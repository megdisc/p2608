import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib';
import { getCurrentJSTMonth } from '../utils';
import type { 
  ServiceBillingRow, 
  ServiceBillingSummary, 
  RewardBreakdownItem, 
  ServiceBillingDetailItem 
} from '../types';

export function useServiceBilling(selectedOfficeId: string | null, initialMonth?: string) {
  const [currentMonth, setCurrentMonth] = useState<string>(initialMonth || getCurrentJSTMonth());
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ServiceBillingRow[]>([]);
  const [summary, setSummary] = useState<ServiceBillingSummary>({
    targetPeriod: currentMonth,
    totalMembersCount: 0,
    activeMembersCount: 0,
    totalAttendanceDays: 0,
    averageAttendanceDays: 0,
    totalBaseRewardUnits: 0,
    totalAdditionUnits: 0,
    totalSubtractionUnits: 0,
    totalUnits: 0,
    totalCostAmount: 0,
    totalBenefitAmount: 0,
    totalCopaymentAmount: 0,
    totalActualExpenseAmount: 0,
    totalMemberBilledAmount: 0,
    status: 'draft',
    confirmedAt: null,
    confirmedBy: null,
  });
  const [rewardBreakdown, setRewardBreakdown] = useState<RewardBreakdownItem[]>([]);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);

  const fetchBillingData = useCallback(async (monthStr: string, officeId: string | null) => {
    setLoading(true);
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

      // 1. 月次確定状態の確認
      let closingQuery = supabase
        .from('monthly_closings')
        .select('*')
        .eq('target_period', monthStr);
      if (officeId) {
        closingQuery = closingQuery.eq('office_id', officeId);
      }
      const { data: closingData } = await closingQuery;
      const isFinConfirmed = Boolean(closingData && closingData.length > 0 && closingData[0].is_financial_confirmed);
      setIsConfirmed(isFinConfirmed);
      setConfirmedAt(closingData && closingData.length > 0 ? closingData[0].financial_confirmed_at : null);

      // 2. サービス費用スナップショット (service_billing_snapshot) の取得
      let snapshotQuery = supabase
        .from('service_billing_snapshot')
        .select('*')
        .eq('target_period', monthStr);
      if (officeId) {
        snapshotQuery = snapshotQuery.eq('office_id', officeId);
      }
      const { data: snapshotRows } = await snapshotQuery;

      // 3. 利用者マスタ
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .order('yomigana', { ascending: true });

      // 利用者事業所割当でフィルタリング（office_member_settings）
      let officeMemberIds: Set<string> | null = null;
      if (officeId) {
        const { data: officeMembers } = await supabase
          .from('office_member_settings')
          .select('member_id')
          .eq('office_id', officeId);
        if (officeMembers && officeMembers.length > 0) {
          officeMemberIds = new Set(officeMembers.map(m => m.member_id));
        }
      }

      const relevantMembers = (membersData || []).filter(m => {
        if (!officeMemberIds) return true;
        return officeMemberIds.has(m.id);
      });

      // スナップショットが存在する場合
      const hasSnapshot = Boolean(snapshotRows && snapshotRows.length > 0);

      if (hasSnapshot) {
        // スナップショット詳細の取得
        const snapshotIds = (snapshotRows || []).map(r => r.id);
        const { data: detailRows } = await supabase
          .from('service_billing_snapshot_details')
          .select('*')
          .in('summary_id', snapshotIds);

        const detailsBySummaryId = new Map<string, ServiceBillingDetailItem[]>();
        (detailRows || []).forEach((d: any) => {
          const list = detailsBySummaryId.get(d.summary_id) || [];
          list.push({
            id: d.id,
            summaryId: d.summary_id,
            rewardItemId: d.reward_item_id,
            serviceCode: d.service_code || '',
            itemName: d.item_name || '',
            itemCategory: d.item_category || 'addition',
            unitValue: Number(d.unit_value) || 0,
            count: Number(d.count) || 0,
            totalItemUnits: Number(d.total_item_units) || 0,
          });
          detailsBySummaryId.set(d.summary_id, list);
        });

        // 受給者証情報のマップ
        const { data: certData } = await supabase
          .from('member_recipient_certificates')
          .select('*');
        const certMap = new Map((certData || []).map(c => [c.member_id, c]));

        const rows: ServiceBillingRow[] = (snapshotRows || []).map((s: any) => {
          const member = (membersData || []).find(m => m.id === s.member_id) || {
            code: '',
            name: '利用者',
            yomigana: '',
          };
          const cert = certMap.get(s.member_id);
          const details = detailsBySummaryId.get(s.id) || [];

          // もし details が空の場合、サマリ値から基本報酬明細と加算明細を自動補完
          if (details.length === 0) {
            const baseUnits = Number(s.base_reward_units) || 0;
            const addUnits = Number(s.addition_units) || 0;
            const days = Number(s.attendance_days) || 15;

            if (baseUnits > 0) {
              details.push({
                serviceCode: '111111',
                itemName: '就労継続支援Ｂ型サービス費 (7.5:1)',
                itemCategory: 'base_reward',
                unitValue: 584,
                count: days,
                totalItemUnits: baseUnits,
              });
            }

            if (addUnits > 0) {
              const targetIncentiveUnits = Math.min(addUnits, days * 16);
              details.push({
                rewardItemId: '66666666-0000-0000-0000-000000000005',
                serviceCode: '521131',
                itemName: '目標工賃達成指導員配置加算',
                itemCategory: 'addition',
                unitValue: 16,
                count: days,
                totalItemUnits: targetIncentiveUnits,
              });

              if (addUnits > targetIncentiveUnits) {
                const remainingUnits = addUnits - targetIncentiveUnits;
                details.push({
                  rewardItemId: '66666666-0000-0000-0000-000000000006',
                  serviceCode: '521141',
                  itemName: '食事提供体制加算',
                  itemCategory: 'addition',
                  unitValue: 30,
                  count: Math.round(remainingUnits / 30),
                  totalItemUnits: remainingUnits,
                });
              }
            }
          }

          return {
            id: s.id,
            memberId: s.member_id,
            memberCode: member.code || '',
            memberName: member.name || '',
            memberYomigana: member.yomigana || '',
            recipientNumber: cert?.recipient_number || '',
            attendanceDays: Number(s.attendance_days) || 0,
            baseRewardUnits: Number(s.base_reward_units) || 0,
            additionUnits: Number(s.addition_units) || 0,
            subtractionUnits: Number(s.subtraction_units) || 0,
            totalUnits: Number(s.total_units) || 0,
            unitPrice: Number(s.unit_price) || 10.0,
            totalCostAmount: Number(s.total_cost_amount) || 0,
            calculatedCopaymentAmount: Number(s.calculated_copayment_amount) || 0,
            copaymentLimitAmount: Number(s.copayment_limit_amount) || 0,
            finalCopaymentAmount: Number(s.final_copayment_amount) || 0,
            benefitBillingAmount: Number(s.benefit_billing_amount) || 0,
            actualExpenseAmount: Number(s.actual_expense_amount) || 0,
            totalMemberBilledAmount: Number(s.total_member_billed_amount) || 0,
            status: s.status || (isFinConfirmed ? 'confirmed' : 'draft'),
            details,
          };
        });

        setData(rows);
        computeAndSetSummaries(rows, monthStr, isFinConfirmed, closingData?.[0]?.financial_confirmed_at, closingData?.[0]?.financial_confirmed_by);
        computeAndSetRewardBreakdown(rows);
      } else {
        // スナップショット未作成時：出勤記録・設定マスタから動的算出
        let attendanceQuery = supabase
          .from('member_attendance_records')
          .select('*')
          .gte('target_period', `${monthStr}-01`)
          .lt('target_period', `${nextMonthStr}-01`);
        if (officeId) {
          attendanceQuery = attendanceQuery.eq('office_id', officeId);
        }

        const [
          attendancesRes,
          certsRes,
          _officeServiceTypeRes,
          officeRewardRes,
          _memberRewardRes,
          rewardItemsRes,
          baseRewardRes,
          systemSnapshotRes
        ] = await Promise.all([
          attendanceQuery,
          supabase.from('member_recipient_certificates').select('*'),
          supabase.from('office_service_type_settings').select('*'),
          supabase.from('office_reward_settings').select('*'),
          supabase.from('member_reward_settings').select('*'),
          supabase.from('reward_items').select('*'),
          supabase.from('base_reward_items').select('*'),
          supabase.from('service_provision_system_snapshot').select('*').eq('target_period', monthStr),
        ]);

        const certMap = new Map((certsRes.data || []).map(c => [c.member_id, c]));
        const rewardItemMap = new Map((rewardItemsRes.data || []).map(r => [r.id, r]));

        // サービス提供体制スナップショット（自動算定値の正本記録）を参照
        const targetSnapshot = (systemSnapshotRes.data || []).find((s: any) => !officeId || s.office_id === officeId);

        // 人員配置基準の判定: スナップショットの determined_staffing_ratio を優先参照
        const rawRatio = targetSnapshot?.determined_staffing_ratio || '7.5:1';
        const staffingRatio = rawRatio.replace('配置', '').trim() || '7.5:1';

        // 工賃達成区分の判定
        const wageTier = targetSnapshot?.determined_wage_tier;

        // 基本報酬公定単位数
        const matchedBaseReward = (baseRewardRes.data || []).find((b: any) => 
          b.staffing_ratio === staffingRatio && (!wageTier || b.wage_achievement_tier === wageTier)
        ) || (baseRewardRes.data || []).find((b: any) => b.staffing_ratio === staffingRatio);

        const baseDailyUnit = matchedBaseReward ? matchedBaseReward.base_units : (staffingRatio === '7.5:1' ? 584 : 520);
        const serviceCode = matchedBaseReward?.service_code || (staffingRatio === '7.5:1' ? '111111' : '111211');
        const unitPrice = 10.0;

        // 事業所加算（体制加算）の特定
        const officeRewards = (officeRewardRes.data || [])
          .filter((r: any) => !officeId || r.office_id === officeId)
          .map((r: any) => rewardItemMap.get(r.reward_item_id))
          .filter(Boolean);

        const rows: ServiceBillingRow[] = relevantMembers.map(member => {
          const cert = certMap.get(member.id);
          const memberAttendances = (attendancesRes.data || []).filter((a: any) => a.member_id === member.id);

          // 出席日数
          const attendanceDays = memberAttendances.filter((a: any) => a.status === 'present' || (Number(a.service_hours) || 0) > 0).length;
          
          // 食事提供日数
          const mealDays = memberAttendances.filter((a: any) => a.has_meal).length;
          // 送迎回数 (片道合計)
          const pickupCount = memberAttendances.reduce((acc: number, a: any) => acc + (a.has_pickup ? 1 : 0) + (a.has_dropoff ? 1 : 0), 0);
          // 欠席時対応日数
          const absenteeDays = memberAttendances.filter((a: any) => a.is_absentee_supported).length;

          const details: ServiceBillingDetailItem[] = [];

          // 1. 基本報酬明細
          const baseRewardUnits = attendanceDays * baseDailyUnit;
          if (attendanceDays > 0) {
            details.push({
              serviceCode,
              itemName: `就労継続支援Ｂ型サービス費 (${staffingRatio})`,
              itemCategory: 'base_reward',
              unitValue: baseDailyUnit,
              count: attendanceDays,
              totalItemUnits: baseRewardUnits,
            });
          }

          // 2. 体制加算（目標工賃達成指導員加算など）
          let additionUnits = 0;
          if (attendanceDays > 0) {
            if (officeRewards.length > 0) {
              officeRewards.forEach((item: any) => {
                if (item.occurrence_type === 'daily') {
                  const itemUnits = Math.round(Number(item.unit_value) * attendanceDays);
                  additionUnits += itemUnits;
                  details.push({
                    rewardItemId: item.id,
                    serviceCode: item.code || '',
                    itemName: item.name,
                    itemCategory: 'addition',
                    unitValue: Number(item.unit_value),
                    count: attendanceDays,
                    totalItemUnits: itemUnits,
                  });
                }
              });
            } else {
              // デフォルトの体制加算（目標工賃達成指導員加算 16単位/日）
              const defaultAddUnits = attendanceDays * 16;
              additionUnits += defaultAddUnits;
              details.push({
                rewardItemId: '66666666-0000-0000-0000-000000000005',
                serviceCode: '521131',
                itemName: '目標工賃達成指導員配置加算',
                itemCategory: 'addition',
                unitValue: 16,
                count: attendanceDays,
                totalItemUnits: defaultAddUnits,
              });
            }
          }

          // 3. 個別加算（食事提供・送迎・欠席時対応）
          if (mealDays > 0) {
            const mealUnits = mealDays * 30;
            additionUnits += mealUnits;
            details.push({
              rewardItemId: '66666666-0000-0000-0000-000000000006',
              serviceCode: '521141',
              itemName: '食事提供体制加算',
              itemCategory: 'addition',
              unitValue: 30,
              count: mealDays,
              totalItemUnits: mealUnits,
            });
          }

          if (pickupCount > 0) {
            const pickupUnits = pickupCount * 10;
            additionUnits += pickupUnits;
            details.push({
              rewardItemId: '66666666-0000-0000-0000-000000000001',
              serviceCode: '521111',
              itemName: '送迎加算(片道)',
              itemCategory: 'addition',
              unitValue: 10,
              count: pickupCount,
              totalItemUnits: pickupUnits,
            });
          }

          if (absenteeDays > 0) {
            const absenteeUnits = absenteeDays * 94;
            additionUnits += absenteeUnits;
            details.push({
              rewardItemId: '66666666-0000-0000-0000-000000000003',
              serviceCode: '521121',
              itemName: '欠席時対応加算(I)',
              itemCategory: 'addition',
              unitValue: 94,
              count: absenteeDays,
              totalItemUnits: absenteeUnits,
            });
          }

          const subtractionUnits = 0;
          const totalUnits = baseRewardUnits + additionUnits - subtractionUnits;
          const totalCostAmount = Math.floor(totalUnits * unitPrice);
          const calculatedCopaymentAmount = Math.floor(totalCostAmount * 0.1);
          const copaymentLimitAmount = cert?.copayment_limit_amount !== undefined && cert?.copayment_limit_amount !== null
            ? Number(cert.copayment_limit_amount)
            : 0;

          const finalCopaymentAmount = Math.min(calculatedCopaymentAmount, copaymentLimitAmount);
          const benefitBillingAmount = totalCostAmount - finalCopaymentAmount;
          const actualExpenseAmount = mealDays * 200;
          const totalMemberBilledAmount = finalCopaymentAmount + actualExpenseAmount;

          return {
            id: member.id,
            memberId: member.id,
            memberCode: member.code || '',
            memberName: member.name || '',
            memberYomigana: member.yomigana || '',
            recipientNumber: cert?.recipient_number || '',
            attendanceDays,
            baseRewardUnits,
            additionUnits,
            subtractionUnits,
            totalUnits,
            unitPrice,
            totalCostAmount,
            calculatedCopaymentAmount,
            copaymentLimitAmount,
            finalCopaymentAmount,
            benefitBillingAmount,
            actualExpenseAmount,
            totalMemberBilledAmount,
            status: isFinConfirmed ? 'confirmed' : 'draft',
            details,
          };
        });

        setData(rows);
        computeAndSetSummaries(rows, monthStr, isFinConfirmed, closingData?.[0]?.financial_confirmed_at, closingData?.[0]?.financial_confirmed_by);
        computeAndSetRewardBreakdown(rows);
      }

    } catch (err) {
      console.error('Error fetching service billing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const computeAndSetSummaries = (
    rows: ServiceBillingRow[], 
    period: string, 
    confirmed: boolean,
    confAt?: string | null,
    confBy?: string | null
  ) => {
    const activeRows = rows.filter(r => r.attendanceDays > 0 || r.totalUnits > 0);
    const totalDays = rows.reduce((acc, r) => acc + r.attendanceDays, 0);

    setSummary({
      targetPeriod: period,
      totalMembersCount: rows.length,
      activeMembersCount: activeRows.length,
      totalAttendanceDays: totalDays,
      averageAttendanceDays: activeRows.length > 0 ? Number((totalDays / activeRows.length).toFixed(1)) : 0,
      totalBaseRewardUnits: rows.reduce((acc, r) => acc + r.baseRewardUnits, 0),
      totalAdditionUnits: rows.reduce((acc, r) => acc + r.additionUnits, 0),
      totalSubtractionUnits: rows.reduce((acc, r) => acc + r.subtractionUnits, 0),
      totalUnits: rows.reduce((acc, r) => acc + r.totalUnits, 0),
      totalCostAmount: rows.reduce((acc, r) => acc + r.totalCostAmount, 0),
      totalBenefitAmount: rows.reduce((acc, r) => acc + r.benefitBillingAmount, 0),
      totalCopaymentAmount: rows.reduce((acc, r) => acc + r.finalCopaymentAmount, 0),
      totalActualExpenseAmount: rows.reduce((acc, r) => acc + r.actualExpenseAmount, 0),
      totalMemberBilledAmount: rows.reduce((acc, r) => acc + r.totalMemberBilledAmount, 0),
      status: confirmed ? 'confirmed' : 'draft',
      confirmedAt: confAt || null,
      confirmedBy: confBy || null,
    });
  };

  const computeAndSetRewardBreakdown = (rows: ServiceBillingRow[]) => {
    const itemMap = new Map<string, RewardBreakdownItem>();

    rows.forEach(row => {
      row.details.forEach(item => {
        const key = `${item.serviceCode}_${item.itemName}`;
        const existing = itemMap.get(key) || {
          rewardItemId: item.rewardItemId,
          serviceCode: item.serviceCode,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          unitValue: item.unitValue,
          targetMembersCount: 0,
          totalCount: 0,
          totalUnits: 0,
          estimatedAmount: 0,
          memberNames: [],
        };

        if (item.count > 0 && !existing.memberNames.includes(row.memberName)) {
          existing.targetMembersCount += 1;
          existing.memberNames.push(row.memberName);
        }
        existing.totalCount += item.count;
        existing.totalUnits += item.totalItemUnits;
        existing.estimatedAmount = Math.floor(existing.totalUnits * row.unitPrice);

        itemMap.set(key, existing);
      });
    });

    const breakdown = Array.from(itemMap.values()).sort((a, b) => {
      if (a.itemCategory === 'base_reward' && b.itemCategory !== 'base_reward') return -1;
      if (b.itemCategory === 'base_reward' && a.itemCategory !== 'base_reward') return 1;
      return b.totalUnits - a.totalUnits;
    });

    setRewardBreakdown(breakdown);
  };

  // 確定処理 (確定保存)
  const confirmBilling = async (officeId: string | null) => {
    try {
      setLoading(true);

      const snapshotPayloads = data.map(r => ({
        office_id: officeId || null,
        member_id: r.memberId,
        target_period: currentMonth,
        attendance_days: r.attendanceDays,
        base_reward_units: r.baseRewardUnits,
        addition_units: r.additionUnits,
        subtraction_units: r.subtractionUnits,
        total_units: r.totalUnits,
        unit_price: r.unitPrice,
        total_cost_amount: r.totalCostAmount,
        calculated_copayment_amount: r.calculatedCopaymentAmount,
        copayment_limit_amount: r.copaymentLimitAmount,
        final_copayment_amount: r.finalCopaymentAmount,
        benefit_billing_amount: r.benefitBillingAmount,
        actual_expense_amount: r.actualExpenseAmount,
        total_member_billed_amount: r.totalMemberBilledAmount,
        status: 'confirmed',
      }));

      const { data: insertedSnapshots, error: snapErr } = await supabase
        .from('service_billing_snapshot')
        .upsert(snapshotPayloads, { onConflict: 'office_id,target_period,member_id' })
        .select();

      if (snapErr) throw snapErr;

      if (insertedSnapshots && insertedSnapshots.length > 0) {
        const snapMap = new Map(insertedSnapshots.map((s: any) => [s.member_id, s.id]));

        const snapshotIds = insertedSnapshots.map((s: any) => s.id);
        await supabase
          .from('service_billing_snapshot_details')
          .delete()
          .in('summary_id', snapshotIds);

        const detailPayloads: any[] = [];
        data.forEach(r => {
          const summaryId = snapMap.get(r.memberId);
          if (summaryId && r.details.length > 0) {
            r.details.forEach(d => {
              detailPayloads.push({
                summary_id: summaryId,
                reward_item_id: d.rewardItemId || null,
                service_code: d.serviceCode,
                item_name: d.itemName,
                item_category: d.itemCategory,
                unit_value: d.unitValue,
                count: d.count,
                total_item_units: d.totalItemUnits,
              });
            });
          }
        });

        if (detailPayloads.length > 0) {
          const { error: detailErr } = await supabase
            .from('service_billing_snapshot_details')
            .insert(detailPayloads);
          if (detailErr) console.warn('Could not insert billing snapshot details:', detailErr);
        }
      }

      await supabase
        .from('monthly_closings')
        .upsert({
          office_id: officeId || null,
          target_period: currentMonth,
          is_financial_confirmed: true,
          financial_confirmed_at: new Date().toISOString(),
        }, { onConflict: 'office_id,target_period' });

      setIsConfirmed(true);
      await fetchBillingData(currentMonth, officeId);
      return true;
    } catch (err) {
      console.error('Error confirming service billing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 確定解除処理
  const cancelBilling = async (officeId: string | null) => {
    try {
      setLoading(true);

      await supabase
        .from('service_billing_snapshot')
        .update({ status: 'draft' })
        .eq('target_period', currentMonth);

      await supabase
        .from('monthly_closings')
        .update({
          is_financial_confirmed: false,
          financial_confirmed_at: null,
        })
        .eq('target_period', currentMonth);

      setIsConfirmed(false);
      await fetchBillingData(currentMonth, officeId);
      return true;
    } catch (err) {
      console.error('Error canceling service billing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData(currentMonth, selectedOfficeId);
  }, [currentMonth, selectedOfficeId, fetchBillingData]);

  return {
    currentMonth,
    setCurrentMonth,
    loading,
    data,
    summary,
    rewardBreakdown,
    isConfirmed,
    confirmedAt,
    confirmBilling,
    cancelBilling,
    fetchBillingData,
  };
}
