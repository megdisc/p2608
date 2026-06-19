-- 新しいタスク進捗テーブルの作成
CREATE TABLE monthly_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL,
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  current_progress NUMERIC NOT NULL DEFAULT 0 CHECK (current_progress >= 0 AND current_progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(year_month, task_id)
);

CREATE TRIGGER update_monthly_task_progress_modtime
BEFORE UPDATE ON monthly_task_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 既存データの移行 (monthly_progress_records -> monthly_task_progress)
-- 重複がある場合は最大値をとる
INSERT INTO monthly_task_progress (year_month, task_id, current_progress)
SELECT year_month, task_id, MAX(current_progress)
FROM monthly_progress_records
GROUP BY year_month, task_id;

-- monthly_progress_records を monthly_member_contributions にリネーム
ALTER TABLE monthly_progress_records RENAME TO monthly_member_contributions;
ALTER TABLE monthly_member_contributions RENAME CONSTRAINT monthly_progress_records_pkey TO monthly_member_contributions_pkey;
ALTER TRIGGER update_monthly_progress_records_modtime ON monthly_member_contributions RENAME TO update_monthly_member_contributions_modtime;

-- current_progress カラムを削除
ALTER TABLE monthly_member_contributions DROP COLUMN current_progress;
