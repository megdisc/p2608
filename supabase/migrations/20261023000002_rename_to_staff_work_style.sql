-- ==============================================================================
-- 20261023000002_rename_to_staff_work_style.sql
-- 勤務形態テーブルを案A (職員勤務形態概要・職員勤務形態詳細) にリネーム
-- 1. office_staff_setting_summaries -> staff_work_style_summaries
-- 2. office_staff_setting_details -> staff_work_style_details
-- 3. インデックス、RLS、論理名コメントの更新
-- ==============================================================================

-- 1. テーブル名変更
ALTER TABLE IF EXISTS "public"."office_staff_setting_summaries"
RENAME TO "staff_work_style_summaries";

ALTER TABLE IF EXISTS "public"."office_staff_setting_details"
RENAME TO "staff_work_style_details";

-- 2. 論理名コメント更新
COMMENT ON TABLE "public"."staff_work_style_summaries" IS '職員勤務形態概要';
COMMENT ON TABLE "public"."staff_work_style_details" IS '職員勤務形態詳細';

-- 3. インデックス名変更
ALTER INDEX IF EXISTS "public"."idx_office_staff_setting_summaries_setting_id"
RENAME TO "idx_staff_work_style_summaries_setting_id";

ALTER INDEX IF EXISTS "public"."idx_office_staff_setting_summaries_period"
RENAME TO "idx_staff_work_style_summaries_period";

ALTER INDEX IF EXISTS "public"."idx_office_staff_setting_details_summary_id"
RENAME TO "idx_staff_work_style_details_summary_id";

ALTER INDEX IF EXISTS "public"."idx_office_staff_setting_details_staff_role"
RENAME TO "idx_staff_work_style_details_staff_role";

-- 4. RLS ポリシーの更新
ALTER TABLE "public"."staff_work_style_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_work_style_summaries";
CREATE POLICY "Allow all access" ON "public"."staff_work_style_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."staff_work_style_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_work_style_details";
CREATE POLICY "Allow all access" ON "public"."staff_work_style_details" FOR ALL USING (true) WITH CHECK (true);
