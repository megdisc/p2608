-- ==============================================================================
-- 20261109140000_rename_snapshot_tables_and_setup_closings.sql
-- 1. スナップショット層テーブル物理名の改称 (snapshot であることを明示)
-- 2. 月次実績テーブル general_financial_records への属性カラム追加 (remarks, recorded_by等)
-- 3. 旧テーブル名互換ビューおよび確定・集計用ビューの再定義
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. スナップショット層テーブルの物理名変更
-- ------------------------------------------------------------------------------

-- 1.1 general_financial_details -> general_financial_snapshot_details
ALTER TABLE IF EXISTS "public"."general_financial_details" 
    RENAME TO "general_financial_snapshot_details";
COMMENT ON TABLE "public"."general_financial_snapshot_details" IS '一般収支明細スナップショット';

-- 1.2 wage_summaries -> wage_snapshot_summaries
ALTER TABLE IF EXISTS "public"."wage_summaries" 
    RENAME TO "wage_snapshot_summaries";
COMMENT ON TABLE "public"."wage_snapshot_summaries" IS '工賃・控除概要スナップショット';

-- 1.3 incentive_details -> incentive_snapshot_details
ALTER TABLE IF EXISTS "public"."incentive_details" 
    RENAME TO "incentive_snapshot_details";
COMMENT ON TABLE "public"."incentive_snapshot_details" IS 'インセンティブ明細スナップショット';

-- 1.4 allowance_deduction_details -> allowance_deduction_snapshot_details
ALTER TABLE IF EXISTS "public"."allowance_deduction_details" 
    RENAME TO "allowance_deduction_snapshot_details";
COMMENT ON TABLE "public"."allowance_deduction_snapshot_details" IS '加算手当・控除明細スナップショット';

-- 1.5 service_billing_summaries -> service_billing_snapshot_summaries
ALTER TABLE IF EXISTS "public"."service_billing_summaries" 
    RENAME TO "service_billing_snapshot_summaries";
COMMENT ON TABLE "public"."service_billing_snapshot_summaries" IS 'サービス費概要スナップショット';

-- 1.6 service_billing_details -> service_billing_snapshot_details
ALTER TABLE IF EXISTS "public"."service_billing_details" 
    RENAME TO "service_billing_snapshot_details";
COMMENT ON TABLE "public"."service_billing_snapshot_details" IS 'サービス費明細スナップショット';

-- ※ monthly_financial_closings は改称不要


-- ------------------------------------------------------------------------------
-- 2. 月次実績テーブル general_financial_records & incentive_records の拡張
-- ------------------------------------------------------------------------------
ALTER TABLE "public"."general_financial_records"
    ADD COLUMN IF NOT EXISTS "remarks" TEXT,
    ADD COLUMN IF NOT EXISTS "recorded_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "activity_category" TEXT DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare')),
    ADD COLUMN IF NOT EXISTS "cost_category" TEXT DEFAULT 'manufacturing' NOT NULL CHECK ("cost_category" IN ('manufacturing', 'sga'));

COMMENT ON TABLE "public"."general_financial_records" IS '一般収支実績（月次実績層）';
COMMENT ON COLUMN "public"."general_financial_records"."remarks" IS '備考・摘要詳細';
COMMENT ON COLUMN "public"."general_financial_records"."recorded_by" IS '計上・登録職員ID';
COMMENT ON COLUMN "public"."general_financial_records"."activity_category" IS '事業活動区分（production: 就労支援事業 / welfare: 福祉事業）';
COMMENT ON COLUMN "public"."general_financial_records"."cost_category" IS '費用区分（manufacturing: 製造原価 / sga: 販売費及び一般管理費）';

-- incentive_records へのユニーク制約追加 (upsert用)
ALTER TABLE "public"."incentive_records"
    DROP CONSTRAINT IF EXISTS "incentive_records_period_member_task_key",
    ADD CONSTRAINT "incentive_records_period_member_task_key" UNIQUE ("target_period", "member_id", "task_id");


-- ------------------------------------------------------------------------------
-- 3. RLS ポリシーの更新
-- ------------------------------------------------------------------------------
ALTER TABLE "public"."general_financial_snapshot_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."general_financial_snapshot_details";
CREATE POLICY "Allow all access" ON "public"."general_financial_snapshot_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."wage_snapshot_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."wage_snapshot_summaries";
CREATE POLICY "Allow all access" ON "public"."wage_snapshot_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."incentive_snapshot_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."incentive_snapshot_details";
CREATE POLICY "Allow all access" ON "public"."incentive_snapshot_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."allowance_deduction_snapshot_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."allowance_deduction_snapshot_details";
CREATE POLICY "Allow all access" ON "public"."allowance_deduction_snapshot_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."service_billing_snapshot_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_billing_snapshot_summaries";
CREATE POLICY "Allow all access" ON "public"."service_billing_snapshot_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."service_billing_snapshot_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_billing_snapshot_details";
CREATE POLICY "Allow all access" ON "public"."service_billing_snapshot_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."general_financial_records" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."general_financial_records";
CREATE POLICY "Allow all access" ON "public"."general_financial_records" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."incentive_records" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."incentive_records";
CREATE POLICY "Allow all access" ON "public"."incentive_records" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."monthly_record_closings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_record_closings";
CREATE POLICY "Allow all access" ON "public"."monthly_record_closings" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."monthly_financial_closings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_financial_closings";
CREATE POLICY "Allow all access" ON "public"."monthly_financial_closings" FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. 旧テーブル名互換ビュー & 集計用ビューの再定義
-- ------------------------------------------------------------------------------

-- 4.1 旧スナップショットテーブル名互換ビュー
CREATE OR REPLACE VIEW "public"."general_financial_details" AS 
    SELECT * FROM "public"."general_financial_snapshot_details";

CREATE OR REPLACE VIEW "public"."wage_summaries" AS 
    SELECT * FROM "public"."wage_snapshot_summaries";

CREATE OR REPLACE VIEW "public"."incentive_details" AS 
    SELECT * FROM "public"."incentive_snapshot_details";

CREATE OR REPLACE VIEW "public"."allowance_deduction_details" AS 
    SELECT * FROM "public"."allowance_deduction_snapshot_details";

CREATE OR REPLACE VIEW "public"."service_billing_summaries" AS 
    SELECT * FROM "public"."service_billing_snapshot_summaries";

CREATE OR REPLACE VIEW "public"."service_billing_details" AS 
    SELECT * FROM "public"."service_billing_snapshot_details";

-- 4.2 工賃・インセンティブ・手当控除集計ビュー
CREATE OR REPLACE VIEW "public"."monthly_wage_summaries" AS 
    SELECT * FROM "public"."wage_snapshot_summaries";

CREATE OR REPLACE VIEW "public"."monthly_incentive_details" AS 
    SELECT * FROM "public"."incentive_snapshot_details";

CREATE OR REPLACE VIEW "public"."monthly_allowance_deduction_details" AS 
    SELECT * FROM "public"."allowance_deduction_snapshot_details";

-- 4.3 財務確定ビュー
CREATE OR REPLACE VIEW "public"."monthly_financial_details" AS 
    SELECT * FROM "public"."general_financial_snapshot_details";

CREATE OR REPLACE VIEW "public"."monthly_financial_confirmations" AS 
    SELECT * FROM "public"."monthly_financial_closings";

-- 4.4 月次実績確定ビュー
CREATE OR REPLACE VIEW "public"."monthly_incentive_confirmations" AS 
    SELECT * FROM "public"."monthly_record_closings";

CREATE OR REPLACE VIEW "public"."monthly_incentive_records" AS 
    SELECT * FROM "public"."incentive_records";
