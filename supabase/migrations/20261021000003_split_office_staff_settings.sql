-- ==============================================================================
-- 20261021000003_split_office_staff_settings.sql
-- 事業所職員割当テーブルを概要と詳細に分離
-- 1. office_staff_setting_summaries (事業所職員割当概要) テーブル作成
--    - 事業所・職員に対する雇用形態、勤務形態、所定時間、主事業所フラグ、有効期間 (履歴管理)
-- 2. office_staff_setting_details (事業所職員割当詳細) テーブル作成
--    - 概要に紐づく配置職種区分 (複数職種の兼務に対応)
-- 3. 既存の office_staff_settings からデータを移行
-- 4. 旧テーブルをDROPし、後方互換用集約ビュー office_staff_settings を作成
-- 5. インデックス、外部キー制約、RLSポリシーの設定
-- ==============================================================================

-- 1. office_staff_setting_summaries (事業所職員割当概要) の作成
CREATE TABLE IF NOT EXISTS "public"."office_staff_setting_summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "staff_id" UUID NOT NULL REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "employment_type" VARCHAR(20),
    "duty_type" VARCHAR(20),
    "weekly_working_hours" NUMERIC(5,2),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    "valid_to" DATE DEFAULT NULL,
    "remarks" TEXT DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス作成 (概要)
CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_office_id"
ON "public"."office_staff_setting_summaries"("office_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_staff_id"
ON "public"."office_staff_setting_summaries"("staff_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_period"
ON "public"."office_staff_setting_summaries"("office_id", "staff_id", "valid_from", "valid_to");

-- 2. office_staff_setting_details (事業所職員割当詳細) の作成
CREATE TABLE IF NOT EXISTS "public"."office_staff_setting_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."office_staff_setting_summaries"("id") ON DELETE CASCADE,
    "staff_role" VARCHAR(50) NOT NULL,
    "is_main_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_office_staff_setting_details_summary_role" UNIQUE ("summary_id", "staff_role")
);

-- インデックス作成 (詳細)
CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_details_summary_id"
ON "public"."office_staff_setting_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_details_staff_role"
ON "public"."office_staff_setting_details"("staff_role");

-- 3. 既存データがある場合の移行処理
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'office_staff_settings'
          AND table_type = 'BASE TABLE'
    ) THEN
        -- 概要テーブルへ移行
        INSERT INTO "public"."office_staff_setting_summaries" (
            "id", "office_id", "staff_id", "employment_type", "duty_type",
            "weekly_working_hours", "is_primary", "valid_from", "valid_to", "created_at", "updated_at"
        )
        SELECT 
            s."id",
            s."office_id",
            s."staff_id",
            s."employment_type",
            s."duty_type",
            s."weekly_working_hours",
            COALESCE(s."is_primary", false),
            '2026-04-01'::DATE,
            NULL,
            s."created_at",
            s."updated_at"
        FROM "public"."office_staff_settings" s
        ON CONFLICT ("id") DO NOTHING;

        -- 既存職種がある場合は詳細テーブルへ移行
        INSERT INTO "public"."office_staff_setting_details" ("summary_id", "staff_role", "is_main_role")
        SELECT 
            s."id",
            s."staff_role",
            true
        FROM "public"."office_staff_settings" s
        WHERE s."staff_role" IS NOT NULL AND s."staff_role" <> ''
        ON CONFLICT ("summary_id", "staff_role") DO NOTHING;

        -- 旧テーブルを削除
        DROP TABLE "public"."office_staff_settings" CASCADE;
    END IF;
END $$;

-- 4. 論理名コメントの付与
COMMENT ON TABLE "public"."office_staff_setting_summaries" IS '事業所職員割当概要';
COMMENT ON TABLE "public"."office_staff_setting_details" IS '事業所職員割当詳細';

-- 5. RLS設定
ALTER TABLE "public"."office_staff_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_staff_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."office_staff_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."office_staff_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_staff_setting_details";
CREATE POLICY "Allow all access" ON "public"."office_staff_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 6. 後方互換用集約ビュー office_staff_settings の作成
CREATE OR REPLACE VIEW "public"."office_staff_settings" AS
SELECT
    s."id",
    s."office_id",
    s."staff_id",
    s."is_primary",
    s."employment_type",
    s."duty_type",
    s."weekly_working_hours",
    s."valid_from",
    s."valid_to",
    s."remarks",
    d."staff_role",
    s."created_at",
    s."updated_at"
FROM "public"."office_staff_setting_summaries" s
LEFT JOIN "public"."office_staff_setting_details" d
  ON s."id" = d."summary_id" AND d."is_main_role" = true;
