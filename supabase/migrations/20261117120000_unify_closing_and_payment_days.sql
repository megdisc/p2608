-- ==============================================================================
-- 20261117120000_unify_closing_and_payment_days.sql
-- 基準日・締め日・支給日・入出金日の一貫性統一（月区分・日分離 & 28日+末日限定）
-- ==============================================================================

-- 1. 取引先 (partners) の基準日カラムを月区分と日に分離
ALTER TABLE public.partners
  DROP COLUMN IF EXISTS customer_payment_day,
  DROP COLUMN IF EXISTS subcontractor_payment_day,
  ADD COLUMN IF NOT EXISTS customer_payment_month_type TEXT DEFAULT 'next' CHECK (customer_payment_month_type IS NULL OR customer_payment_month_type IN ('current', 'next', 'next_next')),
  ADD COLUMN IF NOT EXISTS customer_payment_day SMALLINT DEFAULT 99 CHECK (customer_payment_day IS NULL OR (customer_payment_day BETWEEN 1 AND 28 OR customer_payment_day = 99)),
  ADD COLUMN IF NOT EXISTS subcontractor_payment_month_type TEXT DEFAULT 'next' CHECK (subcontractor_payment_month_type IS NULL OR subcontractor_payment_month_type IN ('current', 'next', 'next_next')),
  ADD COLUMN IF NOT EXISTS subcontractor_payment_day SMALLINT DEFAULT 99 CHECK (subcontractor_payment_day IS NULL OR (subcontractor_payment_day BETWEEN 1 AND 28 OR subcontractor_payment_day = 99));

COMMENT ON COLUMN public.partners.customer_payment_month_type IS '顧客入金月区分（current: 当月, next: 翌月, next_next: 翌々月）';
COMMENT ON COLUMN public.partners.customer_payment_day IS '顧客入金日（1〜28日、または99: 末日）';
COMMENT ON COLUMN public.partners.subcontractor_payment_month_type IS '外注先出金月区分（current: 当月, next: 翌月, next_next: 翌々月）';
COMMENT ON COLUMN public.partners.subcontractor_payment_day IS '外注先出金日（1〜28日、または99: 末日）';

-- 既存レコードの初期値設定
UPDATE public.partners
SET customer_payment_month_type = 'next', customer_payment_day = 99
WHERE is_customer = true;

UPDATE public.partners
SET subcontractor_payment_month_type = 'next', subcontractor_payment_day = 99
WHERE is_subcontractor = true;

-- 2. 積立金項目 (reserve_items) の基準日カラムを月区分と日に分離
ALTER TABLE public.reserve_items
  DROP COLUMN IF EXISTS transfer_in_day,
  DROP COLUMN IF EXISTS transfer_out_day,
  ADD COLUMN IF NOT EXISTS transfer_in_month_type TEXT DEFAULT 'next' NOT NULL CHECK (transfer_in_month_type IN ('current', 'next', 'next_next')),
  ADD COLUMN IF NOT EXISTS transfer_in_day SMALLINT DEFAULT 99 NOT NULL CHECK (transfer_in_day BETWEEN 1 AND 28 OR transfer_in_day = 99),
  ADD COLUMN IF NOT EXISTS transfer_out_month_type TEXT DEFAULT 'next' NOT NULL CHECK (transfer_out_month_type IN ('current', 'next', 'next_next')),
  ADD COLUMN IF NOT EXISTS transfer_out_day SMALLINT DEFAULT 99 NOT NULL CHECK (transfer_out_day BETWEEN 1 AND 28 OR transfer_out_day = 99);

COMMENT ON COLUMN public.reserve_items.transfer_in_month_type IS '積立金繰入月区分（current: 当月, next: 翌月, next_next: 翌々月）';
COMMENT ON COLUMN public.reserve_items.transfer_in_day IS '積立金繰入日（1〜28日、または99: 末日）';
COMMENT ON COLUMN public.reserve_items.transfer_out_month_type IS '積立金取崩月区分（current: 当月, next: 翌月, next_next: 翌々月）';
COMMENT ON COLUMN public.reserve_items.transfer_out_day IS '積立金取崩日（1〜28日、または99: 末日）';

-- 既存レコードの初期値設定
UPDATE public.reserve_items
SET
  transfer_in_month_type = 'next',
  transfer_in_day = 99,
  transfer_out_month_type = 'next',
  transfer_out_day = 99
WHERE transfer_in_month_type IS NULL OR transfer_in_day IS NULL;

-- 3. wage_closing_settings / salary_closing_settings の制約およびコメント更新
ALTER TABLE public.wage_closing_settings
  DROP CONSTRAINT IF EXISTS wage_closing_settings_closing_day_check,
  DROP CONSTRAINT IF EXISTS wage_closing_settings_payment_day_check,
  ADD CONSTRAINT wage_closing_settings_closing_day_check CHECK (closing_day BETWEEN 1 AND 28 OR closing_day = 99),
  ADD CONSTRAINT wage_closing_settings_payment_day_check CHECK (payment_day BETWEEN 1 AND 28 OR payment_day = 99);

COMMENT ON COLUMN public.wage_closing_settings.closing_day IS '工賃締め日（1〜28日、99:末日）';
COMMENT ON COLUMN public.wage_closing_settings.payment_day IS '工賃支給日（1〜28日、99:末日）';

ALTER TABLE public.salary_closing_settings
  DROP CONSTRAINT IF EXISTS salary_closing_settings_closing_day_check,
  DROP CONSTRAINT IF EXISTS salary_closing_settings_payment_day_check,
  ADD CONSTRAINT salary_closing_settings_closing_day_check CHECK (closing_day BETWEEN 1 AND 28 OR closing_day = 99),
  ADD CONSTRAINT salary_closing_settings_payment_day_check CHECK (payment_day BETWEEN 1 AND 28 OR payment_day = 99);

COMMENT ON COLUMN public.salary_closing_settings.closing_day IS '給与締め日（1〜28日、99:末日）';
COMMENT ON COLUMN public.salary_closing_settings.payment_day IS '給与支給日（1〜28日、99:末日）';
