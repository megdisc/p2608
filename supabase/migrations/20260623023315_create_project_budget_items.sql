-- Create enum for budget category if not exists
DO $$ BEGIN
    CREATE TYPE budget_category AS ENUM ('revenue', 'expense', 'reserve', 'surplus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_budget_items table
CREATE TABLE project_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category budget_category NOT NULL,
  subject TEXT NOT NULL,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_project_budget_items_project_id ON project_budget_items(project_id);

-- Enable RLS
ALTER TABLE project_budget_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all operations for all users" ON project_budget_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_project_budget_items_updated_at
    BEFORE UPDATE ON project_budget_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
