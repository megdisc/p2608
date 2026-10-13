export interface SummaryFormatOptions {
  task?: string | null;
  billingDest?: string | null;
  payee?: string | null;
  isStaff?: boolean;
}

/**
 * 摘要カラムの表示文字列をフォーマットする
 * ルール:
 * - 「タスク：●●」
 * - 「請求先：●●」
 * - 「支払先：●●」
 * - 「職員給与等」
 * 複数の場合は全角カンマ（、）で区切る（例：タスク：●●、支払先：●●）
 */
export function formatSummaryDescription(options: SummaryFormatOptions): string {
  const parts: string[] = [];

  const task = options.task?.trim();
  if (task && task !== '-' && task !== '（未設定）') {
    const cleanTask = task.startsWith('タスク：') ? task.slice('タスク：'.length) : task;
    if (cleanTask) {
      parts.push(`タスク：${cleanTask}`);
    }
  }

  const billingDest = options.billingDest?.trim();
  if (billingDest && billingDest !== '-' && billingDest !== '（未設定）') {
    const cleanDest = billingDest.startsWith('請求先：') ? billingDest.slice('請求先：'.length) : billingDest;
    if (cleanDest) {
      parts.push(`請求先：${cleanDest}`);
    }
  }

  const isStaff = options.isStaff || options.payee === '（職員等）' || options.payee === '職員給与等';

  if (!isStaff) {
    const payee = options.payee?.trim();
    if (payee && payee !== '-' && payee !== '（未設定）' && (!task || payee !== task)) {
      const cleanPayee = payee.startsWith('支払先：') ? payee.slice('支払先：'.length) : payee;
      if (cleanPayee) {
        parts.push(`支払先：${cleanPayee}`);
      }
    }
  }

  if (isStaff) {
    parts.push('職員給与等');
  }

  return parts.length > 0 ? parts.join('、') : '-';
}
