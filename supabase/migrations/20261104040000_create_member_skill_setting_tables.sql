-- ==============================================================================
-- 20261104040000_create_member_skill_setting_tables.sql
-- 利用者スキル割当テーブルを、利用者スキル割当概要 (member_skill_setting_summaries)
-- および 利用者スキル割当詳細 (member_skill_setting_details) に分離・新設
-- スキルの有効期間・履歴管理に対応
-- ==============================================================================

-- 1. 利用者スキル割当概要テーブル作成
CREATE TABLE IF NOT EXISTS "public"."member_skill_setting_summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."member_skill_setting_summaries" IS '利用者スキル割当概要';
COMMENT ON COLUMN "public"."member_skill_setting_summaries"."id" IS '概要ID';
COMMENT ON COLUMN "public"."member_skill_setting_summaries"."member_id" IS '利用者ID';
COMMENT ON COLUMN "public"."member_skill_setting_summaries"."valid_from" IS '有効期間（開始）';
COMMENT ON COLUMN "public"."member_skill_setting_summaries"."valid_to" IS '有効期間（終了。NULL: 継続中）';

CREATE INDEX IF NOT EXISTS "idx_member_skill_setting_summaries_member_id" 
ON "public"."member_skill_setting_summaries"("member_id");

CREATE INDEX IF NOT EXISTS "idx_member_skill_setting_summaries_period" 
ON "public"."member_skill_setting_summaries"("member_id", "valid_from", "valid_to");

ALTER TABLE "public"."member_skill_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."member_skill_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."member_skill_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

-- 2. 利用者スキル割当詳細テーブル作成
CREATE TABLE IF NOT EXISTS "public"."member_skill_setting_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."member_skill_setting_summaries"("id") ON DELETE CASCADE,
    "skill_id" UUID NOT NULL REFERENCES "public"."skill_items"("id") ON DELETE CASCADE,
    "skill_level_id" UUID NOT NULL REFERENCES "public"."skill_level_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT member_skill_setting_details_summary_skill_key UNIQUE ("summary_id", "skill_id")
);

COMMENT ON TABLE "public"."member_skill_setting_details" IS '利用者スキル割当詳細';
COMMENT ON COLUMN "public"."member_skill_setting_details"."id" IS '詳細ID';
COMMENT ON COLUMN "public"."member_skill_setting_details"."summary_id" IS '概要ID（FK -> member_skill_setting_summaries.id）';
COMMENT ON COLUMN "public"."member_skill_setting_details"."skill_id" IS 'スキルID（FK -> skill_items.id）';
COMMENT ON COLUMN "public"."member_skill_setting_details"."skill_level_id" IS 'スキルレベルID（FK -> skill_level_items.id）';

CREATE INDEX IF NOT EXISTS "idx_member_skill_setting_details_summary_id" 
ON "public"."member_skill_setting_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_member_skill_setting_details_skill_id" 
ON "public"."member_skill_setting_details"("skill_id");

ALTER TABLE "public"."member_skill_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."member_skill_setting_details";
CREATE POLICY "Allow all access" ON "public"."member_skill_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 3. 既存の member_skill_settings データからの移行
DO $$
DECLARE
    m_record RECORD;
    new_summary_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'member_skill_settings') THEN
        FOR m_record IN SELECT DISTINCT member_id FROM "public"."member_skill_settings" LOOP
            -- 各利用者の初期概要レコードを作成（2025-04-01 〜 継続中）
            INSERT INTO "public"."member_skill_setting_summaries" ("member_id", "valid_from", "valid_to")
            VALUES (m_record.member_id, '2025-04-01', NULL)
            RETURNING "id" INTO new_summary_id;

            -- 詳細レコードの移行
            INSERT INTO "public"."member_skill_setting_details" ("summary_id", "skill_id", "skill_level_id")
            SELECT new_summary_id, "skill_id", "skill_level_id"
            FROM "public"."member_skill_settings"
            WHERE "member_id" = m_record.member_id
            ON CONFLICT ("summary_id", "skill_id") DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- 4. member_skill_evaluations ビューの更新（最新の有効評価を返す）
CREATE OR REPLACE VIEW "public"."member_skill_evaluations" AS
SELECT
    d.id,
    s.member_id,
    d.skill_id,
    d.skill_level_id,
    d.created_at,
    d.updated_at
FROM "public"."member_skill_setting_details" d
JOIN "public"."member_skill_setting_summaries" s ON s.id = d.summary_id
WHERE s.valid_from <= CURRENT_DATE
  AND (s.valid_to IS NULL OR s.valid_to >= CURRENT_DATE);

