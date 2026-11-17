-- ==============================================================================
-- 20261117113000_add_payment_days_to_partners.sql
-- 取引先 (partners) テーブルに入金基準日・出金基準日カラムを追加
-- ==============================================================================

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS customer_payment_day TEXT,
  ADD COLUMN IF NOT EXISTS subcontractor_payment_day TEXT;

COMMENT ON COLUMN public.partners.customer_payment_day IS '顧客入金基準日（例: next_99: 翌月末日, next_10: 翌月10日）';
COMMENT ON COLUMN public.partners.subcontractor_payment_day IS '外注先出金基準日（例: next_99: 翌月末日, next_20: 翌月20日）';

-- 既存の顧客・外注先のデフォルト基準日（翌月末日）を設定
UPDATE public.partners
SET customer_payment_day = 'next_99'
WHERE is_customer = true AND customer_payment_day IS NULL;

UPDATE public.partners
SET subcontractor_payment_day = 'next_99'
WHERE is_subcontractor = true AND subcontractor_payment_day IS NULL;
