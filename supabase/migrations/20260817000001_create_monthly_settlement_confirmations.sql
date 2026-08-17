-- Create table for monthly settlement confirmations
CREATE TABLE IF NOT EXISTS monthly_settlement_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month VARCHAR(7) NOT NULL UNIQUE,
    confirmed_by UUID REFERENCES members(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE monthly_settlement_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access
CREATE POLICY "Allow all access to monthly_settlement_confirmations" ON monthly_settlement_confirmations
    FOR ALL USING (true) WITH CHECK (true);
