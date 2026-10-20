-- ==============================================================================
-- 20261020000001_split_office_reward_settings.sql
-- 事業所加算・減算設定テーブルの概要・詳細への分割改修
-- 1. office_reward_summaries (事業所加算・減算概要) テーブルの新規作成
-- 2. office_reward_details (事業所加算・減算詳細) テーブルの新規作成
-- 3. 既存 office_reward_settings からの新テーブルへのデータ移行
-- 4. 後方互換・集約ビュー office_reward_settings の作成
-- ==============================================================================

-- 1. office_reward_summaries (事業所加算・減算概要) テーブルの新規作成
CREATE TABLE IF NOT EXISTS "public"."office_reward_summaries" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "start_date" DATE NOT NULL,
    "end_date" DATE DEFAULT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS "idx_office_reward_summaries_office_id"
ON "public"."office_reward_summaries"("office_id");

CREATE INDEX IF NOT EXISTS "idx_office_reward_summaries_dates"
ON "public"."office_reward_summaries"("office_id", "start_date", "end_date");

-- RLS
ALTER TABLE "public"."office_reward_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_reward_summaries";
CREATE POLICY "Allow all access" ON "public"."office_reward_summaries" FOR ALL USING (true) WITH CHECK (true);

-- 2. office_reward_details (事業所加算・減算詳細) テーブルの新規作成
CREATE TABLE IF NOT EXISTS "public"."office_reward_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID NOT NULL REFERENCES "public"."office_reward_summaries"("id") ON DELETE CASCADE,
    "reward_item_id" UUID NOT NULL REFERENCES "public"."reward_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_office_reward_details_summary_item" UNIQUE ("summary_id", "reward_item_id")
);

-- インデックス
CREATE INDEX IF NOT EXISTS "idx_office_reward_details_summary_id"
ON "public"."office_reward_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_office_reward_details_reward_item_id"
ON "public"."office_reward_details"("reward_item_id");

-- RLS
ALTER TABLE "public"."office_reward_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_reward_details";
CREATE POLICY "Allow all access" ON "public"."office_reward_details" FOR ALL USING (true) WITH CHECK (true);

-- 3. 既存の office_reward_settings テーブルからのデータ移行（ベーステーブルの場合）
DO $$
DECLARE
    rec RECORD;
    new_summary_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'office_reward_settings'
          AND table_type = 'BASE TABLE'
    ) THEN
        -- office_id, start_date, end_date ごとに集約して概要テーブルに登録
        FOR rec IN 
            SELECT DISTINCT office_id, start_date, end_date
            FROM "public"."office_reward_settings"
        LOOP
            INSERT INTO "public"."office_reward_summaries" (
                office_id, start_date, end_date, is_active
            )
            VALUES (
                rec.office_id,
                rec.start_date,
                rec.end_date,
                true
            )
            RETURNING id INTO new_summary_id;

            -- 当該概要に紐づく詳細レコードを移行
            INSERT INTO "public"."office_reward_details" (
                id, summary_id, reward_item_id, created_at, updated_at
            )
            SELECT
                id,
                new_summary_id,
                reward_item_id,
                created_at,
                updated_at
            FROM "public"."office_reward_settings"
            WHERE office_id = rec.office_id
              AND start_date = rec.start_date
              AND (end_date IS NOT DISTINCT FROM rec.end_date)
            ON CONFLICT ("summary_id", "reward_item_id") DO NOTHING;
        END LOOP;

        -- 旧ベーステーブルを削除
        DROP TABLE "public"."office_reward_settings" CASCADE;
    END IF;
END $$;

-- 4. 後方互換・集約ビュー office_reward_settings の作成
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
