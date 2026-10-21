-- ==============================================================================
-- 20261021000000_add_service_type_to_office_reward_summaries.sql
-- 事業所加算・減算概要テーブルへの支援種別 (service_type_id) カラム追加
-- ==============================================================================

-- 1. office_reward_summaries に service_type_id カラムを追加
ALTER TABLE "public"."office_reward_summaries"
ADD COLUMN IF NOT EXISTS "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_office_reward_summaries_service_type_id"
ON "public"."office_reward_summaries"("service_type_id");

-- 2. 既存レコードへの service_type_id の補完更新
UPDATE "public"."office_reward_summaries" s
SET "service_type_id" = sub.service_type_id
FROM (
    SELECT d.summary_id, ri.service_type_id
    FROM "public"."office_reward_details" d
    JOIN "public"."reward_items" ri ON d.reward_item_id = ri.id
    GROUP BY d.summary_id, ri.service_type_id
) sub
WHERE s.id = sub.summary_id AND s.service_type_id IS NULL;

UPDATE "public"."office_reward_summaries" s
SET "service_type_id" = ost.service_type_id
FROM "public"."office_service_type_settings" ost
WHERE s.office_id = ost.office_id AND s.service_type_id IS NULL;

-- 3. 後方互換・集約ビュー office_reward_settings の再作成（依存解消のため一旦DROP）
DROP VIEW IF EXISTS "public"."office_reward_settings" CASCADE;

CREATE VIEW "public"."office_reward_settings" AS
SELECT
    d.id,
    s.id AS summary_id,
    s.office_id,
    s.service_type_id,
    d.reward_item_id,
    s.start_date,
    s.end_date,
    s.is_active,
    NULL::text AS remarks,
    d.created_at,
    d.updated_at
FROM "public"."office_reward_summaries" s
JOIN "public"."office_reward_details" d ON s.id = d.summary_id;
