const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function verifyAll() {
  const client = new Client({
    host: '127.0.0.1',
    port: 15432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  await client.connect();

  const report = {
    summary: {},
    tableInventory: {},
    snapshotVerification: {},
    logicVerification: {},
    unusedTablesAndColumns: {}
  };

  // 1. 全テーブル & ビューの分類
  const tablesRes = await client.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  const baseTables = [];
  const views = [];
  for (const r of tablesRes.rows) {
    if (r.table_type === 'BASE TABLE') baseTables.push(r.table_name);
    else views.push(r.table_name);
  }

  // 2. srcコード内のテーブル利用状況
  function scanDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanDir(full, fileList);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.sql')) {
        fileList.push(full);
      }
    }
    return fileList;
  }
  const srcFiles = scanDir(path.resolve(__dirname, '../src'));
  const codeContent = srcFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

  const fromMatches = new Set();
  const fromRegex = /\.from\s*\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g;
  let match;
  while ((match = fromRegex.exec(codeContent)) !== null) {
    fromMatches.add(match[1]);
  }

  // テーブルごとの件数、利用状況、種別
  const tableDetails = [];
  for (const r of tablesRes.rows) {
    const t = r.table_name;
    const isBase = r.table_type === 'BASE TABLE';
    let rowCount = 0;
    try {
      const c = await client.query(`SELECT count(*) FROM "${t}";`);
      rowCount = parseInt(c.rows[0].count, 10);
    } catch (e) {
      rowCount = -1;
    }

    const isDirectlyUsed = fromMatches.has(t);
    const isMentioned = codeContent.includes(`'${t}'`) || codeContent.includes(`"${t}"`);

    tableDetails.push({
      name: t,
      type: r.table_type,
      rowCount,
      isDirectlyUsed,
      isMentioned
    });
  }

  report.tableInventory = {
    total: tablesRes.rows.length,
    baseTablesCount: baseTables.length,
    viewsCount: views.length,
    directlyUsedCount: tableDetails.filter(t => t.isDirectlyUsed).length,
    unusedOrLegacyViews: tableDetails.filter(t => !t.isDirectlyUsed && !t.isMentioned),
    legacyCompatibilityViews: tableDetails.filter(t => t.type === 'VIEW' && !t.isDirectlyUsed),
    unusedBaseTables: tableDetails.filter(t => t.type === 'BASE TABLE' && !t.isDirectlyUsed && !t.isMentioned)
  };

  // 3. 各スナップショットテーブルのレコード検証
  const snapshotTables = [
    'daily_closings',
    'monthly_closings',
    'wage_snapshot',
    'incentive_snapshot',
    'allowance_deduction_snapshot',
    'service_billing_snapshot',
    'service_billing_snapshot_details',
    'service_provision_system_snapshot',
    'financial_snapshot'
  ];

  const snapshotStatus = {};
  for (const st of snapshotTables) {
    try {
      const rows = await client.query(`SELECT * FROM "${st}" LIMIT 10;`);
      const totalCount = await client.query(`SELECT count(*) FROM "${st}";`);
      snapshotStatus[st] = {
        rowCount: parseInt(totalCount.rows[0].count, 10),
        sample: rows.rows.slice(0, 3)
      };
    } catch (e) {
      snapshotStatus[st] = { error: e.message };
    }
  }
  report.snapshotVerification = snapshotStatus;

  // 4. 工賃・控除・サービス費用・平均工賃の計算ロジック検証
  // 4.1 wage_snapshot の計算整合性 (wage_total = basic_wage + incentive_total + other_allowance_total, payment = wage_total - deduction_total)
  const wageSnapRes = await client.query(`
    SELECT 
      id, member_id, target_period, work_time, wage_rate, basic_wage, 
      incentive_total, other_allowance_total, wage_total, 
      service_fee_deduction, actual_expense_deduction, deduction_total, payment
    FROM wage_snapshot;
  `);

  let wageCalcMismatches = [];
  for (const w of wageSnapRes.rows) {
    const calcBasic = (w.work_time && w.wage_rate) ? Math.floor(Number(w.work_time) * Number(w.wage_rate)) : Number(w.basic_wage);
    const calcWageTotal = Number(w.basic_wage || 0) + Number(w.incentive_total || 0) + Number(w.other_allowance_total || 0);
    const calcDedTotal = Number(w.service_fee_deduction || 0) + Number(w.actual_expense_deduction || 0);
    const calcPayment = calcWageTotal - Number(w.deduction_total || 0);

    const issues = [];
    if (calcWageTotal !== Number(w.wage_total)) {
      issues.push(`wage_total mismatch: db=${w.wage_total}, sum=${calcWageTotal}`);
    }
    if (calcPayment !== Number(w.payment)) {
      issues.push(`payment mismatch: db=${w.payment}, calc=${calcPayment}`);
    }
    if (Number(w.deduction_total) !== calcDedTotal && (Number(w.service_fee_deduction) > 0 || Number(w.actual_expense_deduction) > 0)) {
      // 控除内訳合計との比較
      if (Math.abs(Number(w.deduction_total) - calcDedTotal) > 0.01) {
        issues.push(`deduction breakdown mismatch: db=${w.deduction_total}, breakdownSum=${calcDedTotal}`);
      }
    }

    if (issues.length > 0) {
      wageCalcMismatches.push({ id: w.id, member_id: w.member_id, period: w.target_period, issues });
    }
  }

  // 4.2 service_billing_snapshot の計算整合性
  // total_cost_amount = floor(total_units * unit_price)
  // final_copayment_amount = min(calculated_copayment_amount, copayment_limit_amount)
  // benefit_billing_amount = total_cost_amount - final_copayment_amount
  const billingSnapRes = await client.query(`
    SELECT 
      id, member_id, target_period, attendance_days, base_reward_units, addition_units, subtraction_units,
      total_units, unit_price, total_cost_amount, calculated_copayment_amount, copayment_limit_amount,
      final_copayment_amount, benefit_billing_amount, actual_expense_amount, total_member_billed_amount, status
    FROM service_billing_snapshot;
  `);

  let billingCalcMismatches = [];
  for (const b of billingSnapRes.rows) {
    const calcUnits = Number(b.base_reward_units || 0) + Number(b.addition_units || 0) - Number(b.subtraction_units || 0);
    const calcCost = Math.floor(calcUnits * Number(b.unit_price || 10));
    const calcCopay = Math.floor(calcCost * 0.1);
    const calcFinalCopay = Math.min(calcCopay, Number(b.copayment_limit_amount || 0));
    const calcBenefit = Number(b.total_cost_amount || 0) - Number(b.final_copayment_amount || 0);

    const issues = [];
    if (Number(b.total_units) !== calcUnits) {
      issues.push(`total_units mismatch: db=${b.total_units}, calc=${calcUnits}`);
    }
    if (Number(b.total_cost_amount) !== calcCost) {
      issues.push(`total_cost mismatch: db=${b.total_cost_amount}, calc=${calcCost}`);
    }
    if (Number(b.benefit_billing_amount) !== calcBenefit) {
      issues.push(`benefit mismatch: db=${b.benefit_billing_amount}, calc=${calcBenefit}`);
    }
    if (issues.length > 0) {
      billingCalcMismatches.push({ id: b.id, member_id: b.member_id, period: b.target_period, issues });
    }
  }

  // 4.3 service_provision_system_snapshot の計算整合性
  let sysCalcMismatches = [];
  let sysSnapRows = [];
  try {
    const sysSnapRes = await client.query(`
      SELECT 
        id, office_id, target_period, operating_days, total_utilization, avg_members_per_day,
        direct_care_work_hours, standard_monthly_hours, direct_care_fte, actual_staffing_ratio, determined_staffing_ratio
      FROM service_provision_system_snapshot;
    `);
    sysSnapRows = sysSnapRes.rows;
    for (const s of sysSnapRows) {
      const issues = [];
      const opDays = Number(s.operating_days || 0);
      const util = Number(s.total_utilization || 0);
      const expectedAvg = opDays > 0 ? Math.round((util / opDays) * 10) / 10 : 0;
      if (Math.abs(Number(s.avg_members_per_day) - expectedAvg) > 0.1) {
        issues.push(`avg_members_per_day: db=${s.avg_members_per_day}, expected=${expectedAvg}`);
      }

      const dHours = Number(s.direct_care_work_hours || 0);
      const stdHours = Number(s.standard_monthly_hours || 160);
      const expectedFte = stdHours > 0 ? Math.round((dHours / stdHours) * 10) / 10 : 0;
      if (dHours > 0 && Math.abs(Number(s.direct_care_fte) - expectedFte) > 0.1) {
        issues.push(`direct_care_fte: db=${s.direct_care_fte}, expected=${expectedFte}`);
      }
      if (issues.length > 0) {
        sysCalcMismatches.push({ id: s.id, period: s.target_period, issues });
      }
    }
  } catch (e) {
    sysCalcMismatches.push({ error: `service_provision_system_snapshot table missing or error: ${e.message}` });
  }

  // 4.4 マイグレーション適用状況チェック
  let appliedMigrations = [];
  try {
    const migRes = await client.query(`SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;`);
    appliedMigrations = migRes.rows.map(r => r.version);
  } catch (e) {
    appliedMigrations = [`Error: ${e.message}`];
  }
  report.appliedMigrations = appliedMigrations;

  report.logicVerification = {
    wageCalculations: {
      totalInspected: wageSnapRes.rows.length,
      mismatchCount: wageCalcMismatches.length,
      mismatches: wageCalcMismatches
    },
    billingCalculations: {
      totalInspected: billingSnapRes.rows.length,
      mismatchCount: billingCalcMismatches.length,
      mismatches: billingCalcMismatches
    },
    serviceProvisionCalculations: {
      totalInspected: sysSnapRows.length,
      mismatchCount: sysCalcMismatches.length,
      mismatches: sysCalcMismatches
    }
  };

  // 5. 不要な値・孤立レコード・NULLカラムの検証
  // 全BASE TABLEについて、レコードはあるが特定カラムが全てNULL、または孤立FKがあるか等
  const columnAudit = [];
  for (const t of baseTables) {
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = '${t}';
    `);

    const countRes = await client.query(`SELECT count(*) FROM "${t}";`);
    const total = parseInt(countRes.rows[0].count, 10);

    if (total > 0) {
      for (const col of colsRes.rows) {
        const cn = col.column_name;
        const nonNullRes = await client.query(`SELECT count(*) FROM "${t}" WHERE "${cn}" IS NOT NULL;`);
        const nonNullCount = parseInt(nonNullRes.rows[0].count, 10);
        if (nonNullCount === 0) {
          columnAudit.push({ table: t, column: cn, type: col.data_type, totalRows: total, nonNullCount: 0, issue: 'ALL_NULL' });
        }
      }
    }
  }

  report.unusedTablesAndColumns = {
    allNullColumns: columnAudit,
    unusedBaseTables: report.tableInventory.unusedBaseTables.map(t => ({ name: t.name, rowCount: t.rowCount }))
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../scratch_verification_result.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('=== VERIFICATION COMPLETED ===');
  console.log(`Total Tables/Views: ${report.tableInventory.total} (Base: ${report.tableInventory.baseTablesCount}, Views: ${report.tableInventory.viewsCount})`);
  console.log(`Wage Snapshot Checks: ${report.logicVerification.wageCalculations.totalInspected} (Mismatches: ${report.logicVerification.wageCalculations.mismatchCount})`);
  console.log(`Billing Snapshot Checks: ${report.logicVerification.billingCalculations.totalInspected} (Mismatches: ${report.logicVerification.billingCalculations.mismatchCount})`);
  console.log(`Service Provision Checks: ${report.logicVerification.serviceProvisionCalculations.totalInspected} (Mismatches: ${report.logicVerification.serviceProvisionCalculations.mismatchCount})`);
  console.log(`Unused Base Tables: ${report.unusedTablesAndColumns.unusedBaseTables.length}`);
  console.log(`All-NULL Columns in populated tables: ${report.unusedTablesAndColumns.allNullColumns.length}`);

  await client.end();
  process.exit(0);
}

verifyAll().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
