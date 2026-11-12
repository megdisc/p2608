-- ==============================================================================
-- 20261112160000_restructure_records_and_snapshots.sql
-- 月次実績・スナップショット・月次締めの再編
-- ==============================================================================

-- 1. monthly_closings（月次締め確定テーブル）の作成
CREATE TABLE IF NOT EXISTS public.monthly_closings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE,
    target_period VARCHAR(7) NOT NULL,
    is_settlement_confirmed BOOLEAN DEFAULT false NOT NULL,
    settlement_confirmed_at TIMESTAMPTZ,
    settlement_confirmed_by UUID REFERENCES public.staffs(id) ON DELETE SET NULL,
    is_financial_confirmed BOOLEAN DEFAULT false NOT NULL,
    financial_confirmed_at TIMESTAMPTZ,
    financial_confirmed_by UUID REFERENCES public.staffs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT monthly_closings_office_id_target_period_key UNIQUE (office_id, target_period)
);

-- 既存の monthly_record_closings, monthly_financial_closings からデータ移行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'monthly_record_closings') THEN
        INSERT INTO public.monthly_closings (office_id, target_period, is_settlement_confirmed, settlement_confirmed_at, settlement_confirmed_by, is_financial_confirmed, financial_confirmed_at, financial_confirmed_by)
        SELECT 
            COALESCE(r.office_id, f.office_id),
            COALESCE(r.target_period, f.target_period),
            COALESCE(r.is_confirmed, false),
            r.confirmed_at,
            r.confirmed_by,
            COALESCE(f.is_confirmed, false),
            f.confirmed_at,
            f.confirmed_by
        FROM public.monthly_record_closings r
        FULL OUTER JOIN public.monthly_financial_closings f
          ON r.office_id = f.office_id AND r.target_period = f.target_period
        ON CONFLICT (office_id, target_period) DO UPDATE SET
            is_settlement_confirmed = EXCLUDED.is_settlement_confirmed,
            settlement_confirmed_at = EXCLUDED.settlement_confirmed_at,
            settlement_confirmed_by = EXCLUDED.settlement_confirmed_by,
            is_financial_confirmed = EXCLUDED.is_financial_confirmed,
            financial_confirmed_at = EXCLUDED.financial_confirmed_at,
            financial_confirmed_by = EXCLUDED.financial_confirmed_by;
    END IF;
END $$;

-- 2. テーブル名の改名（RENAME）
-- 2.1 general_financial_records -> financial_records
ALTER TABLE IF EXISTS public.general_financial_records RENAME TO financial_records;

-- 2.2 general_financial_snapshot_details -> financial_snapshot
ALTER TABLE IF EXISTS public.general_financial_snapshot_details RENAME TO financial_snapshot;

-- 2.3 service_billing_snapshot_summaries -> service_billing_snapshot
ALTER TABLE IF EXISTS public.service_billing_snapshot_summaries RENAME TO service_billing_snapshot;

-- 2.4 wage_snapshot_summaries -> wage_snapshot
ALTER TABLE IF EXISTS public.wage_snapshot_summaries RENAME TO wage_snapshot;

-- 2.5 incentive_snapshot_details -> incentive_snapshot
ALTER TABLE IF EXISTS public.incentive_snapshot_details RENAME TO incentive_snapshot;

-- 2.6 allowance_deduction_snapshot_details -> allowance_deduction_snapshot
ALTER TABLE IF EXISTS public.allowance_deduction_snapshot_details RENAME TO allowance_deduction_snapshot;

-- 3. wage_snapshot のカラム調整
ALTER TABLE public.wage_snapshot ADD COLUMN IF NOT EXISTS service_fee_deduction NUMERIC(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE public.wage_snapshot ADD COLUMN IF NOT EXISTS actual_expense_deduction NUMERIC(12,2) DEFAULT 0 NOT NULL;

UPDATE public.wage_snapshot 
SET 
  service_fee_deduction = COALESCE(service_fee_copayment, 0),
  actual_expense_deduction = GREATEST(0, COALESCE(deduction_total, 0) - COALESCE(service_fee_copayment, 0))
WHERE service_fee_deduction = 0 AND actual_expense_deduction = 0;

-- 4. 一般収支（financial_records, financial_snapshot）から工賃・控除・利用料の重複レコードを削除
DELETE FROM public.financial_records
WHERE subject IN ('労務費（利用者工賃）', '実費控除', '控除', 'サービス利用料');

DELETE FROM public.financial_snapshot
WHERE subject IN ('労務費（利用者工賃）', '実費控除', '控除', 'サービス利用料');

-- 5. 後方互換ビューの作成
DROP TABLE IF EXISTS public.monthly_record_closings CASCADE;
DROP TABLE IF EXISTS public.monthly_financial_closings CASCADE;

CREATE OR REPLACE VIEW public.monthly_record_closings AS 
    SELECT id, office_id, target_period, settlement_confirmed_at AS confirmed_at, settlement_confirmed_by AS confirmed_by, is_settlement_confirmed AS is_confirmed, created_at, updated_at
    FROM public.monthly_closings;

CREATE OR REPLACE VIEW public.monthly_financial_closings AS 
    SELECT id, office_id, target_period, financial_confirmed_at AS confirmed_at, financial_confirmed_by AS confirmed_by, is_financial_confirmed AS is_confirmed, created_at, updated_at
    FROM public.monthly_closings;

CREATE OR REPLACE VIEW public.general_financial_records AS SELECT * FROM public.financial_records;
CREATE OR REPLACE VIEW public.general_financial_snapshot_details AS SELECT * FROM public.financial_snapshot;
CREATE OR REPLACE VIEW public.service_billing_snapshot_summaries AS SELECT * FROM public.service_billing_snapshot;
CREATE OR REPLACE VIEW public.wage_snapshot_summaries AS SELECT * FROM public.wage_snapshot;
CREATE OR REPLACE VIEW public.incentive_snapshot_details AS SELECT * FROM public.incentive_snapshot;
CREATE OR REPLACE VIEW public.allowance_deduction_snapshot_details AS SELECT * FROM public.allowance_deduction_snapshot;

-- 6. RLSポリシーの設定
ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.monthly_closings;
CREATE POLICY "Allow all access" ON public.monthly_closings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.financial_records;
CREATE POLICY "Allow all access" ON public.financial_records FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.financial_snapshot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.financial_snapshot;
CREATE POLICY "Allow all access" ON public.financial_snapshot FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.service_billing_snapshot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.service_billing_snapshot;
CREATE POLICY "Allow all access" ON public.service_billing_snapshot FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.wage_snapshot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.wage_snapshot;
CREATE POLICY "Allow all access" ON public.wage_snapshot FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.incentive_snapshot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.incentive_snapshot;
CREATE POLICY "Allow all access" ON public.incentive_snapshot FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.allowance_deduction_snapshot ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.allowance_deduction_snapshot;
CREATE POLICY "Allow all access" ON public.allowance_deduction_snapshot FOR ALL USING (true) WITH CHECK (true);

