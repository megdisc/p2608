-- 20261124120000_add_initial_balance_to_reserve_items.sql
-- 積立金項目 (reserve_items) に初期残高 (initial_balance) を追加

ALTER TABLE public.reserve_items
ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.reserve_items.initial_balance IS '積立金初期残高（期首繰越額）';

CREATE OR REPLACE VIEW public.reserve_settings AS SELECT * FROM public.reserve_items;
