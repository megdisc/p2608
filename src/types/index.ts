
export interface UserItem {
  id: string;
  email?: string;
  role: string;
  user_type: 'staff' | 'member';
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type StaffItem = {
  id: string;
  user_id?: string;
  code?: string;
  name: string;
  yomigana: string;
  email?: string;
  password?: string;
  role: string;
  is_deleted?: boolean;
};

export interface MemberItem {
  id: string;
  user_id?: string;
  code?: string;
  name: string;
  yomigana?: string;
  role: string;
  email?: string;
  password?: string;
  baseWageId?: string;
  is_deleted?: boolean;
};



export type TaskSkill = {
  id: string;
  skillId: string;
  skill?: string;
  levelId?: string;
  levelValue?: number;
};

export type ProjectTask = {
  id: string;
  task: string;
  taskYomigana?: string;
  requiredSkills: TaskSkill[];
  assigneeIds?: string[];
  assigneeType?: string;
  isCompleted?: boolean;
  completedAt?: string;
  laborBudget?: number;
  is_deleted?: boolean;
};

export type ProjectItem = {
  id: string;
  code?: string;
  name: string;
  yomigana?: string;
  projectType: 'one-off' | 'ongoing' | 'その他';
  settlementYearMonth?: string;
  createdAt?: string;
  projectTypeSortKey?: string;
  customerId?: string;
  tasks: ProjectTask[];
  is_deleted?: boolean;
};

export type SkillItem = {
  id: string;
  name: string;
  yomigana?: string;
  description: string;
  is_deleted?: boolean;
};

export type BaseWageItem = {
  id: string;
  wage: number;
  description: string;
  is_deleted?: boolean;
};

export type ClientItem = {
  id: string;
  code?: string;
  name: string;
  yomigana: string;
  contactPerson: string;
  phone: string;
  isCustomer?: boolean;
  isSubcontractor?: boolean;
  is_deleted?: boolean;
};

export type DailyWorkRecordItem = {
  id: string;
  date: string;
  userId: string;
  taskId: string;
  workTime: number;
};

export type DailyWorkConfirmationItem = {
  id: string;
  date: string;
  isConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
};

export type MonthlyIncentiveConfirmationItem = {
  id: string;
  yearMonth: string;
  isConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
};

export type MonthlyIncentiveAllocationItem = {
  id: string;
  yearMonth: string;
  memberId?: string;
  taskId?: string;
  allocationAmount: number;
};

export type FinancialRecordItem = {
  id: string;
  period: string;
  projectId: string;
  clientId?: string;
  type: 'revenue' | 'expense' | 'reserve';
  subject: string;
  amount: number;
  remarks?: string;
  recordedDate: string;
  recordedBy: string;
  activity_category?: 'production' | 'welfare';
  costCategory?: 'manufacturing' | 'sga';
};

export type MonthlyWageRecord = {
  id: string;
  yearMonth: string;
  memberId: string;
  workTime: number;
  wageRate: number | null;
  basicWage: number | null;
  incentiveTotal: number;
  otherAllowanceTotal: number;
  wageTotal: number;
  deductionTotal: number;
  payment: number;
};

export type MonthlyWageConfirmationItem = {
  id: string;
  yearMonth: string;
  isConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
};


export type BudgetCategory = 'revenue' | 'expense' | 'reserve';

export type ProjectBudgetItem = {
  id: string;
  projectId: string;
  category: BudgetCategory;
  subject: string;
  taskId?: string;
  amount: number;
};

// UI usage: Represents a single row in the spreadsheet-like UI grid
export type ProjectBudgetGridRow = {
  id: string; // pseudo-id for rendering
  projectId: string;
  projectName?: string;
  projectType?: 'one-off' | 'ongoing';
  isTotalRow?: boolean;
  revenueSubject?: string;
  revenueAmount?: number;
  expenseSubject?: string;
  expenseAmount?: number;
  reserveSubject?: string;
  reserveAmount?: number;
  // Metadata for saving back
  revenueItemId?: string;
  expenseItemId?: string;
  expenseTaskId?: string;
  reserveItemId?: string;
};

export type SkillLevelItem = {
  id: string;
  levelValue: number;
  description: string;
};

export type SkillEvaluationItem = {
  id: string;
  memberId: string;
  skillId: string;
  skillLevelId?: string;
};

// UI usage: cross-tabulation table row for skill evaluations
export type SkillEvaluationGridRow = {
  id: string; // memberId serves as row id
  memberName: string;
  evaluations: Record<string, string>; // mapping from skillId to skillLevelId
};

export type ProjectFinancialRecordSubRow = {
  id: string;
  type: 'revenue' | 'expense' | 'reserve';
  subject: string;
  amount: number;
  period: string;
  recordedDate: string;
};

export type ProjectFinancialSummaryRow = {
  id: string; // projectId
  projectName: string;
  projectType: string;
  totalRevenue: number;
  totalExpense: number;
  totalReserve: number;
  records: ProjectFinancialRecordSubRow[];
};

export type ReserveSettingItem = {
  id: string;
  reserveType: string;       // 積立金種別
  method: string;            // 積立計算方式
  calculationBase: string;   // 積立基準・計算式 (率/金額)
  targetAmount?: number;     // 積立目標・上限額
  autoExecution: boolean;    // 自動積立実行フラグ
  description: string;       // 目的・用途
  is_deleted?: boolean;
};

export type Tab = 
  | 'dashboard' | 'staff' | 'project' | 'projectUser' | 'skill' | 'skillLevel' | 'skillEvaluation' | 'baseWage' | 'baseWageAssignment' | 'client' | 'dailyWorkRecord' | 'progressRecord' | 'rewardAllocation' | 'assigneeSummary' | 'budgetPlanning' | 'assigneeAllocation' | 'financialRecord' | 'projectFinancialRecord' | 'financialSummary' | 'projectFinancialSummary' | 'welfareFinancialSummary' | 'wageSummary' | 'averageWage' | 'screenComposition' | 'tableComposition' | 'mainFeatures' | 'workflow' | 'screenProject' | 'screenUser' | 'screenStaff' | 'screenClient' | 'screenFinance' | 'screenSkill' | 'screenWage' | 'screenReserve' | 'reserveSetting' | 'reserve';

