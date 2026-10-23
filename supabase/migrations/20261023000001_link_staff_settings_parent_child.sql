-- ==============================================================================
-- 20261023000001_link_staff_settings_parent_child.sql
-- 事業所職員割当 (親) と 事業所職員勤務形態概要 (子) のリレーションを正規化
-- 1. office_staff_setting_summaries に office_staff_setting_id カラムを追加 (FK)
-- 2. 既存の office_id, staff_id に合致する office_staff_settings.id を設定
-- 3. office_staff_setting_id を NOT NULL に設定
-- 4. 不要となった office_id, staff_id カラムを削除
-- 5. インデックスの再構築
-- ==============================================================================

-- 1. office_staff_setting_id カラム追加
ALTER TABLE "public"."office_staff_setting_summaries"
ADD COLUMN IF NOT EXISTS "office_staff_setting_id" UUID REFERENCES "public"."office_staff_settings"("id") ON DELETE CASCADE;

-- 2. 既存レコードに親の office_staff_settings.id を反映
UPDATE "public"."office_staff_setting_summaries" s
SET "office_staff_setting_id" = oss."id"
FROM "public"."office_staff_settings" oss
WHERE s."office_id" = oss."office_id"
  AND s."staff_id" = oss."staff_id";

-- 親が存在しない孤立レコードがある場合は親を作成して紐付け
INSERT INTO "public"."office_staff_settings" ("office_id", "staff_id")
SELECT DISTINCT s."office_id", s."staff_id"
FROM "public"."office_staff_setting_summaries" s
WHERE s."office_staff_setting_id" IS NULL
ON CONFLICT ("office_id", "staff_id") DO NOTHING;

UPDATE "public"."office_staff_setting_summaries" s
SET "office_staff_setting_id" = oss."id"
FROM "public"."office_staff_settings" oss
WHERE s."office_staff_setting_id" IS NULL
  AND s."office_id" = oss."office_id"
  AND s."staff_id" = oss."staff_id";

-- 3. NOT NULL 制約の付与
ALTER TABLE "public"."office_staff_setting_summaries"
ALTER COLUMN "office_staff_setting_id" SET NOT NULL;

-- 4. 旧インデックス削除
DROP INDEX IF EXISTS "public"."idx_office_staff_setting_summaries_office_id";
DROP INDEX IF EXISTS "public"."idx_office_staff_setting_summaries_staff_id";
DROP INDEX IF EXISTS "public"."idx_office_staff_setting_summaries_period";

-- 5. 不要となった office_id, staff_id を削除
ALTER TABLE "public"."office_staff_setting_summaries"
DROP COLUMN IF EXISTS "office_id",
DROP COLUMN IF EXISTS "staff_id";

-- 6. 新インデックス作成
CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_setting_id"
ON "public"."office_staff_setting_summaries"("office_staff_setting_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_period"
ON "public"."office_staff_setting_summaries"("office_staff_setting_id", "valid_from", "valid_to");
