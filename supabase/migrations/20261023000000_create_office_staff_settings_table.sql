-- ==============================================================================
-- 20261023000000_create_office_staff_settings_table.sql
-- 事業所職員割当 (office_staff_settings) テーブルの作成とデータ移行
-- 1. 後方互換用集約ビュー office_staff_settings をDROP
-- 2. 職員と事業所の多対多割当・所属情報を管理する実テーブル office_staff_settings を作成
-- 3. 既存の office_staff_setting_summaries から重複を除いて割当データを移行
-- 4. インデックス、RLSポリシー、論理名コメントの設定
-- ==============================================================================

-- 1. 後方互換用集約ビューの削除
DROP VIEW IF EXISTS "public"."office_staff_settings" CASCADE;

-- 2. 実テーブル office_staff_settings (事業所職員割当) の作成
CREATE TABLE IF NOT EXISTS "public"."office_staff_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "staff_id" UUID NOT NULL REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_office_staff_settings_office_staff" UNIQUE ("office_id", "staff_id")
);

-- 3. インデックス作成
CREATE INDEX IF NOT EXISTS "idx_office_staff_settings_office_id"
ON "public"."office_staff_settings"("office_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_settings_staff_id"
ON "public"."office_staff_settings"("staff_id");

-- 4. 既存の office_staff_setting_summaries から割当データを移行
INSERT INTO "public"."office_staff_settings" ("office_id", "staff_id")
SELECT DISTINCT "office_id", "staff_id"
FROM "public"."office_staff_setting_summaries"
ON CONFLICT ("office_id", "staff_id") DO NOTHING;

-- 5. 論理名コメント
COMMENT ON TABLE "public"."office_staff_settings" IS '事業所職員割当';

-- 6. RLSポリシーの設定
ALTER TABLE "public"."office_staff_settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_staff_settings";
CREATE POLICY "Allow all access" ON "public"."office_staff_settings" FOR ALL USING (true) WITH CHECK (true);
