CREATE TABLE daily_work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  work_time NUMERIC NOT NULL DEFAULT 0 CHECK (work_time >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, member_id, task_id)
);

-- Trigger to update updated_at
CREATE TRIGGER update_daily_work_records_modtime
BEFORE UPDATE ON daily_work_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
