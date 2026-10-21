-- ==============================================================================
-- 20261021000004_drop_unnecessary_staff_setting_columns.sql
-- サービス利用料・給付費算定に不要なカラムを削除し、必要最小限・必要十分な構造にスリム化
-- 1. office_staff_setting_summaries から is_primary, remarks を削除
-- 2. office_staff_setting_details から is_main_role を削除
-- 3. 後方互換用集約ビュー office_staff_settings の再作成
-- ==============================================================================

-- 1. 既存ビューを一旦DROP
DROP VIEW IF EXISTS "public"."office_staff_settings" CASCADE;

-- 2. office_staff_setting_summaries から不要カラムを削除
ALTER TABLE "public"."office_staff_setting_summaries"
DROP COLUMN IF EXISTS "is_primary",
DROP COLUMN IF EXISTS "remarks";

-- 3. office_staff_setting_details から不要カラムを削除
ALTER TABLE "public"."office_staff_setting_details"
DROP COLUMN IF EXISTS "is_main_role";

-- 4. 後方互換用集約ビュー office_staff_settings の再作成
CREATE OR REPLACE VIEW "public"."office_staff_settings" AS
SELECT
    s."id",
    s."office_id",
    s."staff_id",
    s."employment_type",
    s."duty_type",
    s."weekly_working_hours",
    s."valid_from",
    s."valid_to",
    d."staff_role",
    s."created_at",
    s."updated_at"
FROM "public"."office_staff_setting_summaries" s
LEFT JOIN "public"."office_staff_setting_details" d
  ON s."id" = d."summary_id";
