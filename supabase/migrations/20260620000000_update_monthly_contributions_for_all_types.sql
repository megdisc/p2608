-- Add staff_id and client_id to monthly_member_contributions
ALTER TABLE monthly_member_contributions
ADD COLUMN staff_id UUID REFERENCES staffs(id) ON DELETE CASCADE,
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Make member_id nullable
ALTER TABLE monthly_member_contributions
ALTER COLUMN member_id DROP NOT NULL;

-- Drop the old unique constraint (which only covered member_id)
ALTER TABLE monthly_member_contributions
DROP CONSTRAINT IF EXISTS monthly_progress_records_year_month_member_id_task_id_key,
DROP CONSTRAINT IF EXISTS monthly_member_contributions_year_month_member_id_task_id_key;

-- Add check constraint to ensure exactly one assignee type is set
ALTER TABLE monthly_member_contributions
ADD CONSTRAINT check_contribution_assignee_type CHECK (
  (member_id IS NOT NULL AND staff_id IS NULL AND client_id IS NULL) OR
  (member_id IS NULL AND staff_id IS NOT NULL AND client_id IS NULL) OR
  (member_id IS NULL AND staff_id IS NULL AND client_id IS NOT NULL)
);

-- Add unique constraint that covers all types (using coalesce to treat nulls as empty uuid is one way, but easier is separate unique indexes)
CREATE UNIQUE INDEX idx_monthly_contrib_member ON monthly_member_contributions (year_month, task_id, member_id) WHERE member_id IS NOT NULL;
CREATE UNIQUE INDEX idx_monthly_contrib_staff ON monthly_member_contributions (year_month, task_id, staff_id) WHERE staff_id IS NOT NULL;
CREATE UNIQUE INDEX idx_monthly_contrib_client ON monthly_member_contributions (year_month, task_id, client_id) WHERE client_id IS NOT NULL;

