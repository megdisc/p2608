-- 担当者に職員 (staff_id) を追加
ALTER TABLE project_task_assignees
ADD COLUMN staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE;

-- 古い制約の削除
ALTER TABLE project_task_assignees
DROP CONSTRAINT IF EXISTS check_assignee_type;

-- 新しい制約の追加: member_id, client_id, staff_id のうち、ちょうど1つだけがNULLでないこと
ALTER TABLE project_task_assignees
ADD CONSTRAINT check_assignee_type CHECK (
  (member_id IS NOT NULL AND client_id IS NULL AND staff_id IS NULL) OR
  (member_id IS NULL AND client_id IS NOT NULL AND staff_id IS NULL) OR
  (member_id IS NULL AND client_id IS NULL AND staff_id IS NOT NULL)
);
