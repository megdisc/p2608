-- 1. organizations テーブルに事業年度締め月・日を追加
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS fiscal_year_closing_month SMALLINT DEFAULT 3 NOT NULL,
  ADD COLUMN IF NOT EXISTS fiscal_year_closing_day SMALLINT DEFAULT 31 NOT NULL;

COMMENT ON COLUMN public.organizations.fiscal_year_closing_month IS '事業年度決算月（1〜12月）';
COMMENT ON COLUMN public.organizations.fiscal_year_closing_day IS '事業年度締め日（1〜31日、または99: 末日）';

-- 2. wage_closing_settings (工賃基準日設定) テーブル作成
CREATE TABLE IF NOT EXISTS public.wage_closing_settings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    closing_day SMALLINT NOT NULL DEFAULT 25,
    payment_month_type TEXT NOT NULL DEFAULT 'next' CHECK (payment_month_type IN ('current', 'next', 'next_next')),
    payment_day SMALLINT NOT NULL DEFAULT 10,
    average_wage_calc_basis TEXT NOT NULL DEFAULT 'payment_date' CHECK (average_wage_calc_basis IN ('closing_date', 'payment_date')),
    valid_from DATE NOT NULL DEFAULT '2020-04-01',
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT wage_closing_settings_office_valid_from_key UNIQUE (office_id, valid_from)
);

COMMENT ON TABLE public.wage_closing_settings IS '工賃基準日設定';
COMMENT ON COLUMN public.wage_closing_settings.closing_day IS '工賃締め日（1〜31日、99:末日）';
COMMENT ON COLUMN public.wage_closing_settings.payment_month_type IS '工賃支給月区分（current:当月, next:翌月, next_next:翌々月）';
COMMENT ON COLUMN public.wage_closing_settings.payment_day IS '工賃支給日（1〜31日、99:末日）';
COMMENT ON COLUMN public.wage_closing_settings.average_wage_calc_basis IS '平均工賃算出基準日区分（closing_date:工賃締め日, payment_date:工賃支給日）';

ALTER TABLE public.wage_closing_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.wage_closing_settings;
CREATE POLICY "Allow all access" ON public.wage_closing_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. incentive_records テーブルの target_period を VARCHAR(7) から DATE に変更
DROP VIEW IF EXISTS public.monthly_incentive_records CASCADE;
ALTER TABLE public.incentive_records DROP CONSTRAINT IF EXISTS incentive_records_period_member_task_key;

ALTER TABLE public.incentive_records
  ALTER COLUMN target_period TYPE DATE
  USING (
    CASE 
      WHEN length(target_period::TEXT) = 7 THEN (target_period || '-01')::DATE
      ELSE target_period::DATE
    END
  );

ALTER TABLE public.incentive_records
  ADD CONSTRAINT incentive_records_period_member_task_key UNIQUE (target_period, member_id, task_id);

CREATE OR REPLACE VIEW public.monthly_incentive_records AS SELECT * FROM public.incentive_records;

-- 4. wage_snapshot テーブルに payment_date (工賃支給日・取引時期) カラムを追加
DROP VIEW IF EXISTS public.wage_snapshot_summaries CASCADE;
ALTER TABLE public.wage_snapshot ADD COLUMN IF NOT EXISTS payment_date DATE;

-- 既存データの補完
UPDATE public.wage_snapshot
SET payment_date = (
  CASE 
    WHEN length(target_period::TEXT) = 7 THEN ((target_period || '-01')::DATE + INTERVAL '1 month' + INTERVAL '9 days')::DATE
    ELSE now()::DATE
  END
)
WHERE payment_date IS NULL;

CREATE OR REPLACE VIEW public.wage_snapshot_summaries AS SELECT * FROM public.wage_snapshot;

-- 5. incentive_snapshot テーブルに target_period (取引時期) カラムを追加
DROP VIEW IF EXISTS public.incentive_snapshot_details CASCADE;
ALTER TABLE public.incentive_snapshot ADD COLUMN IF NOT EXISTS target_period DATE;

-- 既存データの補完
UPDATE public.incentive_snapshot i
SET target_period = COALESCE(
  (SELECT w.payment_date FROM public.wage_snapshot w WHERE w.id = i.summary_id),
  now()::DATE
)
WHERE i.target_period IS NULL;

CREATE OR REPLACE VIEW public.incentive_snapshot_details AS SELECT * FROM public.incentive_snapshot;

