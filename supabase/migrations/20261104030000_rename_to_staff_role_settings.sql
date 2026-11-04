-- ==============================================================================
-- 20261104030000_rename_to_staff_role_settings.sql
-- 職員職種概要/詳細 -> 職員職種割当概要/詳細 (staff_role_setting_summaries / staff_role_setting_details)
-- 他の割当系テーブル命名規則 (..._settings / ..._setting_summaries / ..._setting_details) に準拠
-- ==============================================================================

-- 1. テーブル名のリネーム
ALTER TABLE IF EXISTS "public"."staff_role_summaries"
RENAME TO "staff_role_setting_summaries";

ALTER TABLE IF EXISTS "public"."staff_role_details"
RENAME TO "staff_role_setting_details";

-- 2. テーブルコメントの更新
COMMENT ON TABLE "public"."staff_role_setting_summaries" IS '職員職種割当概要';
COMMENT ON TABLE "public"."staff_role_setting_details" IS '職員職種割当詳細';

-- 3. インデックスのリネーム
ALTER INDEX IF EXISTS "public"."idx_staff_role_summaries_setting_id"
RENAME TO "idx_staff_role_setting_summaries_setting_id";

ALTER INDEX IF EXISTS "public"."idx_staff_role_summaries_period"
RENAME TO "idx_staff_role_setting_summaries_period";

ALTER INDEX IF EXISTS "public"."idx_staff_role_details_summary_id"
RENAME TO "idx_staff_role_setting_details_summary_id";

ALTER INDEX IF EXISTS "public"."idx_staff_role_details_staff_role"
RENAME TO "idx_staff_role_setting_details_staff_role";

ALTER INDEX IF EXISTS "public"."idx_staff_role_details_role_id"
RENAME TO "idx_staff_role_setting_details_role_id";

-- 4. RLS ポリシーの再設定
ALTER TABLE "public"."staff_role_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_role_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."staff_role_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."staff_role_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_role_setting_details";
CREATE POLICY "Allow all access" ON "public"."staff_role_setting_details" FOR ALL USING (true) WITH CHECK (true);

