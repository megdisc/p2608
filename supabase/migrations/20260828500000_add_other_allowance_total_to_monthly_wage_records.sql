-- monthly_wage_records テーブルに その他加算手当合計 (other_allowance_total) カラムを追加
ALTER TABLE IF EXISTS "public"."monthly_wage_records"
ADD COLUMN IF NOT EXISTS "other_allowance_total" NUMERIC(12,2) DEFAULT 0 NOT NULL;
