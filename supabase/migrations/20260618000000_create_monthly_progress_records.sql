CREATE TABLE monthly_progress_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month VARCHAR(7) NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  current_progress NUMERIC NOT NULL DEFAULT 0 CHECK (current_progress >= 0 AND current_progress <= 100),
  contribution_ratio NUMERIC NOT NULL DEFAULT 0 CHECK (contribution_ratio >= 0 AND contribution_ratio <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(year_month, member_id, task_id)
);

-- Trigger to update updated_at
CREATE TRIGGER update_monthly_progress_records_modtime
BEFORE UPDATE ON monthly_progress_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
