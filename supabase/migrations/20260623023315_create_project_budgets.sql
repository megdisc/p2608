CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  revenue_subject TEXT,
  revenue_amount INTEGER,
  expense_subject TEXT,
  expense_amount INTEGER,
  reserve_subject TEXT,
  reserve_amount INTEGER,
  surplus_subject TEXT,
  surplus_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE TRIGGER update_project_budgets_updated_at
  BEFORE UPDATE ON project_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all operations for authenticated users" ON project_budgets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
