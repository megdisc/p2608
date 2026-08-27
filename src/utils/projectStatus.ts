import { getCurrentJSTMonth } from './date';

export type TaskStatusItem = {
  isCompleted?: boolean;
  is_completed?: boolean;
  completedAt?: string;
  completed_at?: string;
};

export type ProjectStatusInfo = {
  tasks?: TaskStatusItem[];
};

/**
 * 当該案件のすべてのタスクが「完了」（isCompleted）になっているか判定する
 */
export function isProjectFinished(project: ProjectStatusInfo | null | undefined): boolean {
  if (!project || !project.tasks || project.tasks.length === 0) {
    return false;
  }
  return project.tasks.every(t => Boolean(t.isCompleted || t.is_completed));
}

/**
 * 終了した案件の完了年月（YYYY-MM）を取得する。
 * タスクの completed_at / completedAt の最新値から算出（未設定時は現在のJST年月）
 */
export function getProjectFinishedMonth(project: ProjectStatusInfo | null | undefined): string | null {
  if (!isProjectFinished(project)) {
    return null;
  }
  let maxDateStr: string | null = null;
  for (const t of project?.tasks || []) {
    const dt = t.completedAt || t.completed_at;
    if (dt) {
      if (!maxDateStr || dt > maxDateStr) {
        maxDateStr = dt;
      }
    }
  }
  if (maxDateStr) {
    const dateMatch = maxDateStr.match(/^(\d{4}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
  }
  return getCurrentJSTMonth();
}
