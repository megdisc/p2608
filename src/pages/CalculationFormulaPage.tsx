import { TABLE_COLUMNS, WORDS_PROJECT, WORDS_WELFARE_SERVICE, WORDS_TIME } from '../constants';

export function CalculationFormulaPage() {
  return (
    <div className="dashboard-container" style={{ padding: '0 0 var(--space-8) 0' }}>
      {/* 1. サービス費用総額（訓練等給付費、サービス利用料） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          1. {TABLE_COLUMNS.TOTAL_COST}（{TABLE_COLUMNS.BENEFIT_BILLING}、{TABLE_COLUMNS.SERVICE_FEE}）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.TOTAL_COST} ＝ ⌊ {TABLE_COLUMNS.TOTAL_UNITS} × {TABLE_COLUMNS.REGIONAL_UNIT_PRICE} ⌋（円未満切捨て）
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.SERVICE_FEE} ＝ min( ⌊ {TABLE_COLUMNS.TOTAL_COST} × 10% ⌋, {TABLE_COLUMNS.COPAYMENT_LIMIT} )
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.BENEFIT_BILLING} ＝ {TABLE_COLUMNS.TOTAL_COST} － {TABLE_COLUMNS.SERVICE_FEE}
          </div>
          <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
            ※ 恒等式：{TABLE_COLUMNS.TOTAL_COST} ＝ {TABLE_COLUMNS.BENEFIT_BILLING} ＋ {TABLE_COLUMNS.SERVICE_FEE}（端数処理含め厳密一致）
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>{TABLE_COLUMNS.REGIONAL_UNIT_PRICE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              10円 ＋ 10円 × {WORDS_WELFARE_SERVICE.PREMIUM_RATE} × {WORDS_WELFARE_SERVICE.PERSONNEL_COST_RATIO}（小数第2位四捨五入）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              事業所の所在地級数および支援種別に基づき決定。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.TOTAL_UNITS}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.TOTAL_UNITS} ＝ {TABLE_COLUMNS.BASE_REWARD} ＋ {TABLE_COLUMNS.ADDITION_TOTAL}
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              利用日数に応じた基本報酬単位数と各種加算・減算単位数の合計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SERVICE_FEE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              法定1割負担額と受給者証記載の{TABLE_COLUMNS.COPAYMENT_LIMIT}のうち、いずれか低い額。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.BENEFIT_BILLING}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.TOTAL_COST}から{TABLE_COLUMNS.SERVICE_FEE}を控除した額（公費請求額）。
            </div>
          </li>
        </ul>
      </section>

      {/* 2. 工賃　A（基本工賃、インセンティブ、加算手当） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          2. {TABLE_COLUMNS.CATEGORY_WAGE_A}（{TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM}、{TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM}、{TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.CATEGORY_WAGE_A} ＝ {TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM} ＋ {TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM} ＋ {TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.SUBJECT_BASE_WAGE_ITEM} ＝ ⌊ {WORDS_TIME.WORK_TIME} × {WORDS_PROJECT.BASE_WAGE} ⌋（円未満切捨て）
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              利用者の工賃単価と日々の利用記録（作業時間）に基づき月次集計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              {TABLE_COLUMNS.SUBJECT_INCENTIVE_ITEM} ＝ ∑ {WORDS_PROJECT.REWARD_ALLOCATION_AMOUNT}
            </div>
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              案件完了時の収益分配による各タスク配分額を集計。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_ALLOWANCE_ITEM}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              手当マスタの支給条件（利用日数・作業時間等）に基づき自動集計。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>{TABLE_COLUMNS.ALLOWANCE_NAME}</th>
                    <th style={{ width: '15%' }}>{TABLE_COLUMNS.OCCURRENCE_TYPE}</th>
                    <th style={{ width: '35%' }}>{TABLE_COLUMNS.CALC_TRIGGER_BASIS}・判定条件</th>
                    <th style={{ width: '25%' }}>{TABLE_COLUMNS.DEFAULT_UNIT_PRICE}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>精勤手当</strong></td>
                    <td>月次</td>
                    <td>{WORDS_WELFARE_SERVICE.ATTENDANCE_DAYS} ≧ 15日</td>
                    <td>3,000円 / 月</td>
                  </tr>
                  <tr>
                    <td><strong>皆勤手当</strong></td>
                    <td>月次</td>
                    <td>{WORDS_WELFARE_SERVICE.ATTENDANCE_DAYS} ≧ 20日</td>
                    <td>2,000円 / 月</td>
                  </tr>
                  <tr>
                    <td><strong>その他手当</strong></td>
                    <td>日次 / 月次</td>
                    <td>条件合致判定</td>
                    <td>設定単価または固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 3. 控除　B（サービス利用料、実費控除）および 差額　A-B */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          3. {TABLE_COLUMNS.CATEGORY_DEDUCTION_B}（{TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE}、{TABLE_COLUMNS.SUBJECT_DEDUCTION}）および {TABLE_COLUMNS.CATEGORY_DIFFERENCE_AB}
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.CATEGORY_DEDUCTION_B} ＝ {TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE} ＋ {TABLE_COLUMNS.SUBJECT_DEDUCTION}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.CATEGORY_DIFFERENCE_AB}（{TABLE_COLUMNS.PAYMENT_AMOUNT}） ＝ {TABLE_COLUMNS.CATEGORY_WAGE_A} － {TABLE_COLUMNS.CATEGORY_DEDUCTION_B}
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_WELFARE_USAGE_FEE}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              サービス費用の自己負担額（受給者証上限管理適用後）。
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.SUBJECT_DEDUCTION}</strong>:
            <div style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-main)' }}>
              利用記録（食事提供等）に基づき自動集計。
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>{TABLE_COLUMNS.DEDUCTION_NAME}</th>
                    <th style={{ width: '15%' }}>{TABLE_COLUMNS.OCCURRENCE_TYPE}</th>
                    <th style={{ width: '35%' }}>{TABLE_COLUMNS.CALC_TRIGGER_BASIS}・実績基準</th>
                    <th style={{ width: '25%' }}>{TABLE_COLUMNS.DEFAULT_UNIT_PRICE}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>昼食代</strong></td>
                    <td>日次</td>
                    <td>{WORDS_WELFARE_SERVICE.MEAL_COUNT}</td>
                    <td>1食 200円 × 提供回数</td>
                  </tr>
                  <tr>
                    <td><strong>飲料設備代</strong></td>
                    <td>日次</td>
                    <td>{WORDS_WELFARE_SERVICE.ATTENDANCE_DAYS}</td>
                    <td>1日 30円 × 通所日数</td>
                  </tr>
                  <tr>
                    <td><strong>その他実費</strong></td>
                    <td>日次 / 月次</td>
                    <td>利用実績</td>
                    <td>設定単価または固定額</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
        </ul>
      </section>

      {/* 4. 積立金（工賃変動積立金、設備等修繕維持積立金） */}
      <section className="dashboard-panel">
        <h3 style={{
          fontSize: 'var(--text-heading-3)',
          fontWeight: 'var(--weight-heading)',
          color: 'var(--color-text-main)',
          margin: '0 0 var(--space-4) 0',
          paddingBottom: 'var(--space-2)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          4. {WORDS_PROJECT.RESERVE}（{TABLE_COLUMNS.SUBJECT_RESERVE_WAGE}、{TABLE_COLUMNS.SUBJECT_RESERVE_EQUIPMENT}）
        </h3>

        {/* 算式ボックス */}
        <div style={{
          backgroundColor: 'var(--color-bg-subtle)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.RESERVE_NET} ＝ {TABLE_COLUMNS.RESERVE_INFLOW} － {TABLE_COLUMNS.RESERVE_WITHDRAWAL}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-body)', fontWeight: 'var(--weight-heading)' }}>
            {TABLE_COLUMNS.RESERVE_CUMULATIVE} ＝ {TABLE_COLUMNS.INITIAL_BALANCE} ＋ ∑ {TABLE_COLUMNS.RESERVE_NET}
          </div>
        </div>

        {/* 箇条書きロジック説明 */}
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          color: 'var(--color-text-main)',
          fontSize: 'var(--text-body)'
        }}>
          <li>
            <strong>積立金科目</strong>:
            <div style={{ marginTop: 'var(--space-2)' }}>
              <table className="inventory-table auto-height-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>科目名</th>
                    <th style={{ width: '45%' }}>目的</th>
                    <th style={{ width: '30%' }}>{TABLE_COLUMNS.CALCULATION_METHOD}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{TABLE_COLUMNS.SUBJECT_RESERVE_WAGE}</strong></td>
                    <td>将来の収益変動による工賃低下を防ぎ、安定的な工賃支給を確保。</td>
                    <td>{TABLE_COLUMNS.FIXED_AMOUNT} または {TABLE_COLUMNS.FIXED_RATE}</td>
                  </tr>
                  <tr>
                    <td><strong>{TABLE_COLUMNS.SUBJECT_RESERVE_EQUIPMENT}</strong></td>
                    <td>生産活動設備・備品の修繕、更新、維持管理に備える。</td>
                    <td>{TABLE_COLUMNS.FIXED_AMOUNT} または {TABLE_COLUMNS.FIXED_RATE}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </li>
          <li>
            <strong>{TABLE_COLUMNS.CALCULATION_METHOD}</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              ・<strong>定額方式</strong>：設定された定額金額（円）を案件完了時または締め時に自動計上。<br />
              ・<strong>定率方式</strong>：案件収益等の基準額に指定割合（%）を乗じて自動算出。
            </div>
          </li>
          <li>
            <strong>帳簿・レポート連動</strong>:
            <div style={{ fontSize: 'var(--text-body)', color: 'var(--color-text-main)', marginTop: 'var(--space-1)' }}>
              設定された期日に基づき、就労支援事業出納帳および積立金レポートへ自動反映。
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
