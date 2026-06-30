CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period DATE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    subject TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    recorded_date DATE NOT NULL,
    recorded_by UUID REFERENCES staffs(id) ON DELETE SET NULL,
    is_limited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
