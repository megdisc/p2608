-- ==============================================================================
-- 20261021000001_unify_reward_summaries_structure.sql
-- 事業所加算・減算概要テーブルの有効フラグ削除および受給者証テーブルとの命名規則統一
-- 1. office_reward_summaries から is_active カラムを削除
-- 2. start_date -> valid_from, end_date -> valid_to へのリネーム
-- 3. インデックスの再作成
-- 4. 後方互換・集約ビュー office_reward_settings の再作成
-- 5. member_recipient_certificates の valid_to を NULL許容化（無期限・継続対応）
-- ==============================================================================

-- 1. ビューの再作成に先立ち、既存ビューを一旦DROP
DROP VIEW IF EXISTS "public"."office_reward_settings" CASCADE;

-- 2. office_reward_summaries のカラム改修（有効フラグ削除・期間カラム命名統一）
ALTER TABLE "public"."office_reward_summaries"
DROP COLUMN IF EXISTS "is_active";

ALTER TABLE "public"."office_reward_summaries"
RENAME COLUMN "start_date" TO "valid_from";

ALTER TABLE "public"."office_reward_summaries"
RENAME COLUMN "end_date" TO "valid_to";

-- 3. インデックスの再作成
DROP INDEX IF EXISTS "public"."idx_office_reward_summaries_dates";

CREATE INDEX IF NOT EXISTS "idx_office_reward_summaries_valid_period"
ON "public"."office_reward_summaries"("office_id", "valid_from", "valid_to");

-- 4. 後方互換・集約ビュー office_reward_settings の再作成
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
FROM "public"."office_reward_summaries" s
JOIN "public"."office_reward_details" d ON s.id = d.summary_id;

-- 5. member_recipient_certificates の valid_to を NULL 許容化（統一構造）
ALTER TABLE "public"."member_recipient_certificates"
ALTER COLUMN "valid_to" DROP NOT NULL;
