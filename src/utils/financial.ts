import { WORDS_PROJECT, WORDS_ORG_LOCATION, TABLE_COLUMNS, ACCOUNT_SUBJECT_TREE } from '../constants';

export type ActivityCategoryType = 'production' | 'welfare';
export type TransactionTypeKey = 'revenue' | 'expense' | 'reserve_inflow' | 'reserve_withdrawal';

/**
 * 勘定科目から事業区分（就労支援／福祉）を自動判定する
 */
export function getSubjectActivityCategory(subject?: string): ActivityCategoryType {
  if (!subject) return 'production';
  // 福祉事業の科目にマッチするか判定
  const welfareSubjects = [
    ...ACCOUNT_SUBJECT_TREE.welfare.revenue,
    ...ACCOUNT_SUBJECT_TREE.welfare.expense,
    '控除', // 過去データ互換
    '事業収益',
    '事業費用',
    '事業費用・経費'
  ];
  if (welfareSubjects.some(s => subject === s || subject.includes(s))) {
    return 'welfare';
  }
  return 'production';
}

/**
 * 勘定科目および案件紐付けから取引区分（収益／費用／積立金繰入／積立金取崩）を自動判定する
 */
export function getSubjectTransactionType(
  subject?: string,
  projectId?: string | null,
  rawType?: string
): TransactionTypeKey {
  if (!subject) {
    if (rawType === 'revenue') return 'revenue';
    if (rawType === 'expense') return 'expense';
    if (rawType === 'reserve') return projectId ? 'reserve_inflow' : 'reserve_withdrawal';
    return 'expense';
  }

  // 1. 積立金関連（工賃変動積立金・設備等修繕維持積立金）
  if (
    subject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
    subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT ||
    subject.includes('積立金')
  ) {
    // 案件IDが存在する、または明示的な積立金繰入の場合は繰入、それ以外（手動出金等）は取崩
    return (projectId || rawType === 'reserve_inflow') ? 'reserve_inflow' : 'reserve_withdrawal';
  }

  // 2. 収益関連
  const revenueSubjects = [
    ...ACCOUNT_SUBJECT_TREE.production.revenue,
    ...ACCOUNT_SUBJECT_TREE.welfare.revenue,
    '売上',
    '事業収益',
    '控除' // 過去データ
  ];
  if (revenueSubjects.some(s => subject === s || subject.includes(s)) || rawType === 'revenue') {
    return 'revenue';
  }

  // 3. 費用関連
  return 'expense';
}

/**
 * 取引区分の表示ラベル（収益／費用／積立金繰入／積立金取崩）を取得する
 */
export function getTransactionTypeDisplayLabel(typeKeyOrItem: TransactionTypeKey | {
  subject?: string;
  projectId?: string | null;
  type?: string;
}): string {
  if (typeof typeKeyOrItem === 'string') {
    switch (typeKeyOrItem) {
      case 'revenue':
        return TABLE_COLUMNS.TRANSACTION_TYPE_REVENUE;
      case 'expense':
        return TABLE_COLUMNS.TRANSACTION_TYPE_EXPENSE;
      case 'reserve_inflow':
        return TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_INFLOW;
      case 'reserve_withdrawal':
        return TABLE_COLUMNS.TRANSACTION_TYPE_RESERVE_WITHDRAWAL;
      default:
        return typeKeyOrItem;
    }
  }

  const { subject, projectId, type } = typeKeyOrItem;
  const resolvedType = getSubjectTransactionType(subject, projectId, type);
  return getTransactionTypeDisplayLabel(resolvedType);
}

/**
 * 勘定科目から取引先の固定値（利用者一括／自社）または案件依存（null）を判定する
 */
export function getDefaultClientBySubject(subject?: string): string | null {
  if (!subject) return null;

  // 利用者一括: 労務費（利用者工賃）、実費控除（旧: 控除）、サービス利用料
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_MEMBER ||
    subject === WORDS_PROJECT.SUBJECT_WELFARE_EXPENSE_DEDUCTION ||
    subject === WORDS_PROJECT.SUBJECT_WELFARE_USAGE_FEE ||
    subject === '控除' ||
    subject.startsWith('労務費（利用者工賃')
  ) {
    return WORDS_ORG_LOCATION.CLIENT_MEMBERS_ALL;
  }

  // 自社: 労務費（利用者工賃以外）、積立金繰入・取崩
  if (
    subject === WORDS_PROJECT.SUBJECT_EXPENSE_LABOR_OTHER ||
    subject === '労務費（その他）' ||
    subject.startsWith('労務費（利用者工賃以外）') ||
    subject === WORDS_PROJECT.SUBJECT_RESERVE_WAGE ||
    subject === WORDS_PROJECT.SUBJECT_RESERVE_EQUIPMENT ||
    subject.includes('積立金')
  ) {
    return WORDS_ORG_LOCATION.CLIENT_COMPANY;
  }

  return null;
}

/**
 * 指定した事業区分・取引区分に応じた勘定科目の選択肢一覧を取得する（今後のためのヘルパー）
 */
export function getAccountSubjectOptions(
  activityCategory: ActivityCategoryType = 'production',
  transactionType?: TransactionTypeKey
): { label: string; value: string }[] {
  const categoryTree = ACCOUNT_SUBJECT_TREE[activityCategory];
  if (!categoryTree) return [];

  if (transactionType && categoryTree[transactionType]) {
    return categoryTree[transactionType].map(s => ({ label: s, value: s }));
  }

  // 取引区分未指定の場合はその事業区分の全科目をリストアップ
  const allSubjects = Array.from(new Set([
    ...categoryTree.revenue,
    ...categoryTree.expense,
    ...categoryTree.reserve_inflow,
    ...categoryTree.reserve_withdrawal,
  ]));

  return allSubjects.map(s => ({ label: s, value: s }));
}

