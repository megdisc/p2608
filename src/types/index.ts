export type InventoryItem = {
  id: string;
  category: string;
  name: string;
  location: string;
  quantity: number;
};

export type MasterItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
  supplier: string;
  standardPrice: number;
  standardPurchaseQty: number;
  category: string;
  categoryYomigana?: string;
  location: string;
};

export type LocationItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
};

export type CategoryItem = {
  id: string;
  name: string;
  yomigana: string;
  description: string;
};

export type SupplierItem = {
  id: string;
  name: string;
  yomigana: string;
  contactPerson: string;
  phone: string;
};

export type TransactionItem = {
  id: string;
  date: string;
  itemId: string;
  category: string;
  itemName: string;
  type: '受入' | '払出';
  quantity: number;
  location: string;
  personInCharge: string;
};

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

export type StocktakingItem = {
  id: string;
  date: string;
  itemId: string;
  category: string;
  itemName: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  personInCharge: string;
  location: string;
};

export type TaskSkill = {
  id: string;
  skillId: string;
  skill?: string;
  levelId?: string;
  levelName?: string;
};

export type ProjectTask = {
  id: string;
  task: string;
  taskYomigana?: string;
  requiredSkills: TaskSkill[];
  assigneeIds?: string[];
  isCanceled?: boolean;
  laborBudget?: number;
};

export type ProjectItem = {
  id: string;
  name: string;
  yomigana: string;
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
  type: 'revenue' | 'expense';
  subject: string;
  amount: number;
  recordedDate: string;
  recordedBy: string;
  isLimited: boolean;
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
  name: string;
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

export type Tab = 
  | 'inventory' | 'master' | 'location' | 'category' 
  | 'supplier' | 'transaction' | 'stocktaking' | 'staff'
  | 'project' | 'projectUser' | 'skill' | 'skillLevel' | 'skillEvaluation' | 'baseWage' | 'baseWageAssignment' | 'client' | 'dailyWorkRecord' | 'progressRecord' | 'rewardAllocation' | 'projectSummary' | 'assigneeSummary' | 'budgetPlanning' | 'assigneeAllocation' | 'financialRecord' | 'wageSummary';

export type SystemType = 'inventory' | 'project';
