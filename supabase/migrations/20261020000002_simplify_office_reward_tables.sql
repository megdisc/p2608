-- ==============================================================================
-- 20261020000002_simplify_office_reward_tables.sql
-- 事業所加算・減算概要および事業所加算・減算詳細テーブルの改称・カラム構成簡素化
-- 1. 依存ビュー office_reward_settings を一旦削除
-- 2. office_reward_summaries から届出帳票事項 (submission_date, notification_type) および不要な remarks を削除
-- 3. office_reward_details から不要な詳細設定 (setting_value, condition_memo, is_active) を削除し最小限化
-- 4. 後方互換・集約ビュー office_reward_settings の再作成
-- ==============================================================================

-- 1. カラム削除に先立ち、依存するビューを一旦削除
DROP VIEW IF EXISTS "public"."office_reward_settings" CASCADE;

-- 2. office_reward_summaries から届出帳票固有のカラムおよび不要な remarks を削除し、有効年月の履歴管理に特化
ALTER TABLE "public"."office_reward_summaries"
DROP COLUMN IF EXISTS "submission_date",
DROP COLUMN IF EXISTS "notification_type",
DROP COLUMN IF EXISTS "remarks";

-- 3. office_reward_details から帳票・補足設定カラムを削除し、各項目の紐付け記述に特化
ALTER TABLE "public"."office_reward_details"
DROP COLUMN IF EXISTS "setting_value",
DROP COLUMN IF EXISTS "condition_memo",
DROP COLUMN IF EXISTS "is_active";

-- 4. 後方互換・集約ビュー office_reward_settings の再作成
CREATE OR REPLACE VIEW "public"."office_reward_settings" AS
SELECT
    d.id,
    s.id AS summary_id,
    s.office_id,
    d.reward_item_id,
    s.start_date,
    s.end_date,
    s.is_active,
    NULL::text AS remarks,
    d.created_at,
    d.updated_at
FROM "public"."office_reward_summaries" s
JOIN "public"."office_reward_details" d ON s.id = d.summary_id;
