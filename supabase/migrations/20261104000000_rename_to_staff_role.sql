-- ==============================================================================
-- 20261104000000_rename_to_staff_role.sql
-- 職員勤務形態テーブルを職員役職テーブルにリネーム
-- 1. staff_work_style_summaries -> staff_role_summaries
-- 2. staff_work_style_details -> staff_role_details
-- 3. インデックス、RLS、論理名コメントの更新
-- ==============================================================================

-- 1. テーブル名変更
ALTER TABLE IF EXISTS "public"."staff_work_style_summaries"
RENAME TO "staff_role_summaries";

ALTER TABLE IF EXISTS "public"."staff_work_style_details"
RENAME TO "staff_role_details";

-- 2. 論理名コメント更新
COMMENT ON TABLE "public"."staff_role_summaries" IS '職員職種概要';
COMMENT ON TABLE "public"."staff_role_details" IS '職員職種詳細';

-- 3. インデックス名変更
ALTER INDEX IF EXISTS "public"."idx_staff_work_style_summaries_setting_id"
RENAME TO "idx_staff_role_summaries_setting_id";

ALTER INDEX IF EXISTS "public"."idx_staff_work_style_summaries_period"
RENAME TO "idx_staff_role_summaries_period";

ALTER INDEX IF EXISTS "public"."idx_staff_work_style_details_summary_id"
RENAME TO "idx_staff_role_details_summary_id";

ALTER INDEX IF EXISTS "public"."idx_staff_work_style_details_staff_role"
RENAME TO "idx_staff_role_details_staff_role";

-- 4. RLS ポリシーの更新
ALTER TABLE "public"."staff_role_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_role_summaries";
CREATE POLICY "Allow all access" ON "public"."staff_role_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."staff_role_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_role_details";
CREATE POLICY "Allow all access" ON "public"."staff_role_details" FOR ALL USING (true) WITH CHECK (true);

