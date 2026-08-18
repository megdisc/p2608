
export type StaffItem = {
  id: string;
  name: string;
  yomigana: string;
  email?: string;
  password?: string;
  role: string;
};

export interface MemberItem {
  id: string;
  name: string;
  yomigana?: string;
  role: string;
  email?: string;
  password?: string;
  baseWageId?: string;
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
  code?: string;
  task: string;
  taskYomigana?: string;
  requiredSkills: TaskSkill[];
  assigneeIds?: string[];
  isCanceled?: boolean;
  assigneeType?: string;
  status?: string;
  completedAt?: string;
  laborBudget?: number;
};

export type ProjectItem = {
  id: string;
  code?: string;
  name: string;
  yomigana?: string;
  projectType: 'one-off' | 'ongoing' | 'その他';
  projectTypeSortKey?: string;
  customerId?: string;
  startDate: string;
  endDate: string | null;
  tasks: ProjectTask[];
};

export type SkillItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
};

export type BaseWageItem = {
  id: string;
  wage: number;
  description: string;
};

export type ClientItem = {
  id: string;
  name: string;
  yomigana: string;
  contactPerson: string;
  phone: string;
};

export type DailyWorkRecordItem = {
  id: string;
  date: string;
  userId: string;
  taskId: string;
  workTime: number;
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
  isLimited: boolean;
  activity_category?: 'production' | 'welfare';
};

export type MonthlyWageRecord = {
  id: string;
  yearMonth: string;
  memberId: string;
  workTime: number;
  wageRate: number | null;
  basicWage: number | null;
  incentiveTotal: number;
  wageTotal: number;
  deductionTotal: number;
  payment: number;
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

export type Tab = 
  | 'dashboard' | 'staff' | 'project' | 'projectUser' | 'skill' | 'skillLevel' | 'skillEvaluation' | 'baseWage' | 'baseWageAssignment' | 'client' | 'dailyWorkRecord' | 'progressRecord' | 'rewardAllocation' | 'assigneeSummary' | 'budgetPlanning' | 'assigneeAllocation' | 'financialRecord' | 'projectFinancialRecord' | 'financialSummary' | 'welfareFinancialSummary' | 'wageSummary' | 'screenComposition' | 'tableComposition' | 'mainFeatures' | 'workflow' | 'screenProject' | 'screenUser' | 'screenStaff' | 'screenClient' | 'screenFinance' | 'screenSkill' | 'screenWage';
