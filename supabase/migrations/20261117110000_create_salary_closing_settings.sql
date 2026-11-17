-- ==============================================================================
-- 20261117110000_create_salary_closing_settings.sql
-- 給与基準日設定 (salary_closing_settings) テーブルの作成
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.salary_closing_settings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
    closing_day SMALLINT NOT NULL DEFAULT 20,
    payment_month_type TEXT NOT NULL DEFAULT 'next' CHECK (payment_month_type IN ('current', 'next', 'next_next')),
    payment_day SMALLINT NOT NULL DEFAULT 10,
    valid_from DATE NOT NULL DEFAULT '2020-04-01',
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT salary_closing_settings_office_valid_from_key UNIQUE (office_id, valid_from)
);

COMMENT ON TABLE public.salary_closing_settings IS '給与基準日設定';
COMMENT ON COLUMN public.salary_closing_settings.closing_day IS '給与締め日（1〜31日、99:末日）';
COMMENT ON COLUMN public.salary_closing_settings.payment_month_type IS '給与支給月区分（current:当月, next:翌月, next_next:翌々月）';
COMMENT ON COLUMN public.salary_closing_settings.payment_day IS '給与支給日（1〜31日、99:末日）';
COMMENT ON COLUMN public.salary_closing_settings.valid_from IS '適用開始日';
COMMENT ON COLUMN public.salary_closing_settings.valid_to IS '適用終了日（NULL:継続適用中）';

ALTER TABLE public.salary_closing_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.salary_closing_settings;
CREATE POLICY "Allow all access" ON public.salary_closing_settings FOR ALL USING (true) WITH CHECK (true);

-- 既存の事業所に対する初期データの投入
INSERT INTO public.salary_closing_settings (id, office_id, closing_day, payment_month_type, payment_day, valid_from, valid_to) VALUES
('d1111111-2222-42ea-800b-5e476066c581', '22222222-2222-2222-2222-222222222222', 20, 'next', 5, '2024-04-01', NULL),
('d1111111-3333-42ea-800b-5e476066c581', '33333333-3333-3333-3333-333333333333', 99, 'next', 25, '2024-04-01', NULL),
('d1111111-4444-42ea-800b-5e476066c581', '44444444-4444-4444-4444-444444444444', 15, 'current', 25, '2024-04-01', NULL)
ON CONFLICT (office_id, valid_from) DO NOTHING;
