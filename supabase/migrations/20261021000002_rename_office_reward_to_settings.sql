-- ==============================================================================
-- 20261021000002_rename_office_reward_to_settings.sql
-- 事業所加算・減算テーブルを他割当テーブルと同様の命名規則に統一
-- 1. office_reward_summaries -> office_reward_setting_summaries (事業所加算・減算割当概要)
-- 2. office_reward_details -> office_reward_setting_details (事業所加算・減算割当詳細)
-- 3. インデックス、外部キー制約、ユニーク制約のリネーム
-- 4. 後方互換用集約ビュー office_reward_settings の再作成
-- ==============================================================================

-- 1. 既存のビューを一旦DROP
DROP VIEW IF EXISTS "public"."office_reward_settings" CASCADE;

-- 2. テーブル名変更
ALTER TABLE IF EXISTS "public"."office_reward_summaries"
RENAME TO "office_reward_setting_summaries";

ALTER TABLE IF EXISTS "public"."office_reward_details"
RENAME TO "office_reward_setting_details";

-- 3. インデックス・制約名のリネーム (office_reward_setting_summaries)
ALTER INDEX IF EXISTS "public"."office_reward_summaries_pkey"
RENAME TO "office_reward_setting_summaries_pkey";

ALTER INDEX IF EXISTS "public"."idx_office_reward_summaries_office_id"
RENAME TO "idx_office_reward_setting_summaries_office_id";

ALTER INDEX IF EXISTS "public"."idx_office_reward_summaries_service_type_id"
RENAME TO "idx_office_reward_setting_summaries_service_type_id";

ALTER INDEX IF EXISTS "public"."idx_office_reward_summaries_valid_period"
RENAME TO "idx_office_reward_setting_summaries_valid_period";

ALTER TABLE "public"."office_reward_setting_summaries"
RENAME CONSTRAINT "office_reward_summaries_office_id_fkey"
TO "office_reward_setting_summaries_office_id_fkey";

ALTER TABLE "public"."office_reward_setting_summaries"
RENAME CONSTRAINT "office_reward_summaries_service_type_id_fkey"
TO "office_reward_setting_summaries_service_type_id_fkey";

-- 4. インデックス・制約名のリネーム (office_reward_setting_details)
ALTER INDEX IF EXISTS "public"."office_reward_details_pkey"
RENAME TO "office_reward_setting_details_pkey";

ALTER INDEX IF EXISTS "public"."idx_office_reward_details_summary_id"
RENAME TO "idx_office_reward_setting_details_summary_id";

ALTER INDEX IF EXISTS "public"."idx_office_reward_details_reward_item_id"
RENAME TO "idx_office_reward_setting_details_reward_item_id";

ALTER TABLE "public"."office_reward_setting_details"
RENAME CONSTRAINT "uq_office_reward_details_summary_item"
TO "uq_office_reward_setting_details_summary_item";

ALTER TABLE "public"."office_reward_setting_details"
RENAME CONSTRAINT "office_reward_details_summary_id_fkey"
TO "office_reward_setting_details_summary_id_fkey";

ALTER TABLE "public"."office_reward_setting_details"
RENAME CONSTRAINT "office_reward_details_reward_item_id_fkey"
TO "office_reward_setting_details_reward_item_id_fkey";

-- 5. 論理名コメントの付与
COMMENT ON TABLE "public"."office_reward_setting_summaries" IS '事業所加算・減算割当概要';
COMMENT ON TABLE "public"."office_reward_setting_details" IS '事業所加算・減算割当詳細';

-- 6. RLSポリシーの確認・再設定
ALTER TABLE "public"."office_reward_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_reward_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."office_reward_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."office_reward_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_reward_setting_details";
CREATE POLICY "Allow all access" ON "public"."office_reward_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 7. 後方互換・集約ビュー office_reward_settings の再作成
CREATE OR REPLACE VIEW "public"."office_reward_settings" AS
SELECT
    d.id,
    s.id AS summary_id,
    s.office_id,
    s.service_type_id,
    d.reward_item_id,
    s.valid_from,
    s.valid_to,
    NULL::text AS remarks,
    d.created_at,
    d.updated_at
FROM "public"."office_reward_setting_summaries" s
JOIN "public"."office_reward_setting_details" d ON s.id = d.summary_id;
