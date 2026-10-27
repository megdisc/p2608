-- ==============================================================================
-- 20261027000000_add_work_location_id_to_member_work_records.sql
-- 利用者作業実績テーブルに作業場所（取引先ID）カラムを追加
-- ==============================================================================

-- 1. member_work_records (利用者作業実績) に work_location_id を追加
ALTER TABLE "public"."member_work_records" 
ADD COLUMN IF NOT EXISTS "work_location_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL;

-- 2. 外部キー用インデックスの作成
CREATE INDEX IF NOT EXISTS "idx_member_work_records_work_location_id"
ON "public"."member_work_records"("work_location_id");

-- 3. ビュー work_records および daily_work_records の再定義
CREATE OR REPLACE VIEW "public"."work_records" AS 
SELECT * FROM "public"."member_work_records";

CREATE OR REPLACE VIEW "public"."daily_work_records" AS 
SELECT * FROM "public"."member_work_records";
