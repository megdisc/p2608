export interface ServiceBillingDetailItem {
  id?: string;
  summaryId?: string;
  rewardItemId?: string;
  serviceCode: string;
  itemName: string;
  itemCategory: 'base_reward' | 'addition' | 'subtraction';
  unitValue: number;
  count: number;
  totalItemUnits: number;
}

export interface ServiceBillingRow {
  id: string; // member_id or snapshot_id
  memberId: string;
  memberCode: string;
  memberName: string;
  memberYomigana: string;
  recipientNumber?: string;
  
  // 算定根拠
  attendanceDays: number;
  baseRewardUnits: number;
  additionUnits: number;
  subtractionUnits: number;
  totalUnits: number;
  unitPrice: number;

  // 金額 (円)
  totalCostAmount: number;             // サービス費用総額 (10割)
  calculatedCopaymentAmount: number;   // 利用者負担基準額 (原則1割)
  copaymentLimitAmount: number;        // 利用者負担上限月額 (受給者証)
  finalCopaymentAmount: number;        // サービス利用料 (決定自己負担額)
  benefitBillingAmount: number;        // 訓練等給付費 (国保連/自治体請求額 9割)
  actualExpenseAmount: number;         // 実費費用合計 (食材料費等)
  totalMemberBilledAmount: number;     // 利用者総請求額 (利用料 + 実費)

  status: 'draft' | 'confirmed';
  details: ServiceBillingDetailItem[];
  remarks?: string;
}

export interface ServiceBillingSummary {
  targetPeriod: string;
  totalMembersCount: number;
  activeMembersCount: number;
  totalAttendanceDays: number;
  averageAttendanceDays: number;
  
  totalBaseRewardUnits: number;
  totalAdditionUnits: number;
  totalSubtractionUnits: number;
  totalUnits: number;

  totalCostAmount: number;
  totalBenefitAmount: number;
  totalCopaymentAmount: number;
  totalActualExpenseAmount: number;
  totalMemberBilledAmount: number;

  status: 'draft' | 'confirmed';
  confirmedAt?: string | null;
  confirmedBy?: string | null;
}

export interface RewardBreakdownItem {
  rewardItemId?: string;
  serviceCode: string;
  itemName: string;
  itemCategory: 'base_reward' | 'addition' | 'subtraction';
  unitValue: number;
  targetMembersCount: number;
  totalCount: number;
  totalUnits: number;
  estimatedAmount: number;
  memberNames: string[];
}
