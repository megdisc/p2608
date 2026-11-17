-- ==============================================================================
-- 20261117114000_add_transfer_days_to_reserve_items.sql
-- 積立金項目 (reserve_items) テーブルに繰入基準日・取崩基準日カラムを追加
-- ==============================================================================

ALTER TABLE public.reserve_items
  ADD COLUMN IF NOT EXISTS transfer_in_day TEXT,
  ADD COLUMN IF NOT EXISTS transfer_out_day TEXT;

COMMENT ON COLUMN public.reserve_items.transfer_in_day IS '積立金繰入基準日（例: next_99: 翌月末日, current_99: 当月末日）';
COMMENT ON COLUMN public.reserve_items.transfer_out_day IS '積立金取崩基準日（例: next_99: 翌月末日, current_99: 当月末日）';

-- 既存データのデフォルト設定（翌月末日）
UPDATE public.reserve_items
SET transfer_in_day = 'next_99'
WHERE transfer_in_day IS NULL;

UPDATE public.reserve_items
SET transfer_out_day = 'next_99'
WHERE transfer_out_day IS NULL;
