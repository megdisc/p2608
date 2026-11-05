-- ==============================================================================
-- 20261105000000_add_valid_periods_and_split_office_settings.sql
-- 1. 法人 (organizations)、事業所 (offices)、案件 (projects) への開始・終了時期カラム追加
-- 2. 事業所支援種別割当、事業所職員割当、事業所利用者割当 を 概要 (summaries) と 詳細 (details) に分離
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. 単一テーブルへの開始・終了時期カラム追加
-- ------------------------------------------------------------------------------

-- 1.1 法人 (organizations)
ALTER TABLE "public"."organizations"
    ADD COLUMN IF NOT EXISTS "valid_from" DATE NOT NULL DEFAULT '2020-04-01',
    ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."organizations"."valid_from" IS '集計開始時期（運営開始・設立年月日）';
COMMENT ON COLUMN "public"."organizations"."valid_to" IS '集計終了時期（運営終了・廃止年月日。NULL: 運営中・継続中）';

-- 1.2 事業所 (offices)
ALTER TABLE "public"."offices"
    ADD COLUMN IF NOT EXISTS "valid_from" DATE NOT NULL DEFAULT '2024-04-01',
    ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."offices"."valid_from" IS '集計開始時期（開設・指定年月日）';
COMMENT ON COLUMN "public"."offices"."valid_to" IS '集計終了時期（廃止年月日。NULL: 運営中・継続中）';

-- 1.3 案件 (projects)
ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "start_date" DATE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "end_date" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."projects"."start_date" IS '集計開始時期（案件開始・着手年月日）';
COMMENT ON COLUMN "public"."projects"."end_date" IS '集計終了時期（案件終了・完了予定年月日。NULL: 進行中）';


-- ------------------------------------------------------------------------------
-- 2. 事業所支援種別割当 (office_service_type_settings) の概要・詳細分離
-- ------------------------------------------------------------------------------

-- 2.1 概要テーブル
CREATE TABLE IF NOT EXISTS "public"."office_service_type_setting_summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "valid_from" DATE NOT NULL DEFAULT '2024-04-01',
    "valid_to" DATE DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."office_service_type_setting_summaries" IS '事業所支援種別割当概要';
COMMENT ON COLUMN "public"."office_service_type_setting_summaries"."id" IS '概要ID';
COMMENT ON COLUMN "public"."office_service_type_setting_summaries"."office_id" IS '事業所ID（FK -> offices.id）';
COMMENT ON COLUMN "public"."office_service_type_setting_summaries"."valid_from" IS '集計開始時期（適用開始年月日）';
COMMENT ON COLUMN "public"."office_service_type_setting_summaries"."valid_to" IS '集計終了時期（適用終了年月日。NULL: 継続中）';

CREATE INDEX IF NOT EXISTS "idx_office_service_type_setting_summaries_office_period"
ON "public"."office_service_type_setting_summaries"("office_id", "valid_from", "valid_to");

ALTER TABLE "public"."office_service_type_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_service_type_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."office_service_type_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

-- 2.2 詳細テーブル
CREATE TABLE IF NOT EXISTS "public"."office_service_type_setting_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."office_service_type_setting_summaries"("id") ON DELETE CASCADE,
    "service_type_id" UUID NOT NULL REFERENCES "public"."service_types"("id") ON DELETE RESTRICT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "office_number" VARCHAR(10),
    "staffing_ratio" VARCHAR(20) DEFAULT '7.5:1',
    "wage_achievement_tier" VARCHAR(50),
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_office_service_type_details UNIQUE ("summary_id", "service_type_id")
);

COMMENT ON TABLE "public"."office_service_type_setting_details" IS '事業所支援種別割当詳細';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."id" IS '詳細ID';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."summary_id" IS '概要ID（FK -> office_service_type_setting_summaries.id）';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."service_type_id" IS '支援種別ID（FK -> service_types.id）';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."capacity" IS '利用定員（人）';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."office_number" IS '指定事業所番号（10桁）';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."staffing_ratio" IS '人員配置基準区分';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."wage_achievement_tier" IS '平均工賃月額達成区分';

CREATE INDEX IF NOT EXISTS "idx_office_service_type_setting_details_summary"
ON "public"."office_service_type_setting_details"("summary_id");

ALTER TABLE "public"."office_service_type_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_service_type_setting_details";
CREATE POLICY "Allow all access" ON "public"."office_service_type_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 2.3 既存データの移行
DO $$
DECLARE
    r_office RECORD;
    new_summary_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'office_service_type_settings' AND table_type = 'BASE TABLE'
    ) THEN
        FOR r_office IN SELECT DISTINCT office_id FROM "public"."office_service_type_settings" LOOP
            INSERT INTO "public"."office_service_type_setting_summaries" ("office_id", "valid_from", "valid_to")
            VALUES (r_office.office_id, '2024-04-01', NULL)
            RETURNING "id" INTO new_summary_id;

            INSERT INTO "public"."office_service_type_setting_details"
                ("id", "summary_id", "service_type_id", "capacity", "office_number", "staffing_ratio", "wage_achievement_tier", "is_deleted", "deleted_at", "created_at", "updated_at")
            SELECT
                "id", new_summary_id, "service_type_id", COALESCE("capacity", 20), "office_number", "staffing_ratio", "wage_achievement_tier", COALESCE("is_deleted", false), "deleted_at", "created_at", "updated_at"
            FROM "public"."office_service_type_settings"
            WHERE "office_id" = r_office.office_id
            ON CONFLICT ("summary_id", "service_type_id") DO NOTHING;
        END LOOP;

        DROP TABLE "public"."office_service_type_settings" CASCADE;
    END IF;
END $$;

-- 2.4 後方互換ビュー office_service_type_settings
CREATE OR REPLACE VIEW "public"."office_service_type_settings" AS
SELECT
    d."id",
    s."office_id",
    d."service_type_id",
    d."capacity",
    d."office_number",
    d."staffing_ratio",
    d."wage_achievement_tier",
    d."is_deleted",
    d."deleted_at",
    s."valid_from",
    s."valid_to",
    d."created_at",
    d."updated_at"
FROM "public"."office_service_type_setting_details" d
JOIN "public"."office_service_type_setting_summaries" s ON s."id" = d."summary_id";


-- ------------------------------------------------------------------------------
-- 3. 事業所職員割当 (office_staff_settings) の概要・詳細分離
-- ------------------------------------------------------------------------------

-- 3.1 概要テーブル
CREATE TABLE IF NOT EXISTS "public"."office_staff_setting_summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "valid_from" DATE NOT NULL DEFAULT '2024-04-01',
    "valid_to" DATE DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."office_staff_setting_summaries" IS '事業所職員割当概要';
COMMENT ON COLUMN "public"."office_staff_setting_summaries"."id" IS '概要ID';
COMMENT ON COLUMN "public"."office_staff_setting_summaries"."office_id" IS '事業所ID（FK -> offices.id）';
COMMENT ON COLUMN "public"."office_staff_setting_summaries"."valid_from" IS '集計開始時期（配属・所属開始年月日）';
COMMENT ON COLUMN "public"."office_staff_setting_summaries"."valid_to" IS '集計終了時期（配属・所属終了年月日。NULL: 継続中）';

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_summaries_office_period"
ON "public"."office_staff_setting_summaries"("office_id", "valid_from", "valid_to");

ALTER TABLE "public"."office_staff_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_staff_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."office_staff_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

-- 3.2 詳細テーブル
CREATE TABLE IF NOT EXISTS "public"."office_staff_setting_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."office_staff_setting_summaries"("id") ON DELETE CASCADE,
    "staff_id" UUID NOT NULL REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_office_staff_details UNIQUE ("summary_id", "staff_id")
);

COMMENT ON TABLE "public"."office_staff_setting_details" IS '事業所職員割当詳細';
COMMENT ON COLUMN "public"."office_staff_setting_details"."id" IS '詳細ID';
COMMENT ON COLUMN "public"."office_staff_setting_details"."summary_id" IS '概要ID（FK -> office_staff_setting_summaries.id）';
COMMENT ON COLUMN "public"."office_staff_setting_details"."staff_id" IS '職員ID（FK -> staffs.id）';

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_details_summary"
ON "public"."office_staff_setting_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_office_staff_setting_details_staff"
ON "public"."office_staff_setting_details"("staff_id");

ALTER TABLE "public"."office_staff_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_staff_setting_details";
CREATE POLICY "Allow all access" ON "public"."office_staff_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 3.3 既存データの移行
DO $$
DECLARE
    r_office RECORD;
    new_summary_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'office_staff_settings' AND table_type = 'BASE TABLE'
    ) THEN
        FOR r_office IN SELECT DISTINCT office_id FROM "public"."office_staff_settings" LOOP
            INSERT INTO "public"."office_staff_setting_summaries" ("office_id", "valid_from", "valid_to")
            VALUES (r_office.office_id, '2024-04-01', NULL)
            RETURNING "id" INTO new_summary_id;

            -- 既存の id をそのまま office_staff_setting_details.id として引き継ぐことで、
            -- staff_role_setting_summaries (office_staff_setting_id) の参照整合性を維持する
            INSERT INTO "public"."office_staff_setting_details" ("id", "summary_id", "staff_id", "created_at", "updated_at")
            SELECT "id", new_summary_id, "staff_id", "created_at", "updated_at"
            FROM "public"."office_staff_settings"
            WHERE "office_id" = r_office.office_id
            ON CONFLICT ("summary_id", "staff_id") DO NOTHING;
        END LOOP;

        DROP TABLE "public"."office_staff_settings" CASCADE;
    END IF;
END $$;

-- 3.4 後方互換ビュー office_staff_settings
CREATE OR REPLACE VIEW "public"."office_staff_settings" AS
SELECT
    d."id",
    s."office_id",
    d."staff_id",
    s."valid_from",
    s."valid_to",
    d."created_at",
    d."updated_at"
FROM "public"."office_staff_setting_details" d
JOIN "public"."office_staff_setting_summaries" s ON s."id" = d."summary_id";


-- ------------------------------------------------------------------------------
-- 4. 事業所利用者割当 (office_member_settings) の概要・詳細分離
-- ------------------------------------------------------------------------------

-- 4.1 概要テーブル
CREATE TABLE IF NOT EXISTS "public"."office_member_setting_summaries" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "valid_from" DATE NOT NULL DEFAULT '2024-04-01',
    "valid_to" DATE DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."office_member_setting_summaries" IS '事業所利用者割当概要';
COMMENT ON COLUMN "public"."office_member_setting_summaries"."id" IS '概要ID';
COMMENT ON COLUMN "public"."office_member_setting_summaries"."office_id" IS '事業所ID（FK -> offices.id）';
COMMENT ON COLUMN "public"."office_member_setting_summaries"."valid_from" IS '集計開始時期（利用契約・在籍開始年月日）';
COMMENT ON COLUMN "public"."office_member_setting_summaries"."valid_to" IS '集計終了時期（利用契約・在籍終了年月日。NULL: 継続中）';

CREATE INDEX IF NOT EXISTS "idx_office_member_setting_summaries_office_period"
ON "public"."office_member_setting_summaries"("office_id", "valid_from", "valid_to");

ALTER TABLE "public"."office_member_setting_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_member_setting_summaries";
CREATE POLICY "Allow all access" ON "public"."office_member_setting_summaries" FOR ALL USING (true) WITH CHECK (true);

-- 4.2 詳細テーブル
CREATE TABLE IF NOT EXISTS "public"."office_member_setting_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."office_member_setting_summaries"("id") ON DELETE CASCADE,
    "member_id" UUID NOT NULL REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_office_member_details UNIQUE ("summary_id", "member_id")
);

COMMENT ON TABLE "public"."office_member_setting_details" IS '事業所利用者割当詳細';
COMMENT ON COLUMN "public"."office_member_setting_details"."id" IS '詳細ID';
COMMENT ON COLUMN "public"."office_member_setting_details"."summary_id" IS '概要ID（FK -> office_member_setting_summaries.id）';
COMMENT ON COLUMN "public"."office_member_setting_details"."member_id" IS '利用者ID（FK -> members.id）';

CREATE INDEX IF NOT EXISTS "idx_office_member_setting_details_summary"
ON "public"."office_member_setting_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_office_member_setting_details_member"
ON "public"."office_member_setting_details"("member_id");

ALTER TABLE "public"."office_member_setting_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_member_setting_details";
CREATE POLICY "Allow all access" ON "public"."office_member_setting_details" FOR ALL USING (true) WITH CHECK (true);

-- 4.3 既存データの移行
DO $$
DECLARE
    r_office RECORD;
    new_summary_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'office_member_settings' AND table_type = 'BASE TABLE'
    ) THEN
        FOR r_office IN SELECT DISTINCT office_id FROM "public"."office_member_settings" LOOP
            INSERT INTO "public"."office_member_setting_summaries" ("office_id", "valid_from", "valid_to")
            VALUES (r_office.office_id, '2024-04-01', NULL)
            RETURNING "id" INTO new_summary_id;

            INSERT INTO "public"."office_member_setting_details" ("id", "summary_id", "member_id", "created_at", "updated_at")
            SELECT "id", new_summary_id, "member_id", "created_at", "updated_at"
            FROM "public"."office_member_settings"
            WHERE "office_id" = r_office.office_id
            ON CONFLICT ("summary_id", "member_id") DO NOTHING;
        END LOOP;

        DROP TABLE "public"."office_member_settings" CASCADE;
    END IF;
END $$;

-- 4.4 後方互換ビュー office_member_settings
CREATE OR REPLACE VIEW "public"."office_member_settings" AS
SELECT
    d."id",
    s."office_id",
    d."member_id",
    s."valid_from",
    s."valid_to",
    d."created_at",
    d."updated_at"
FROM "public"."office_member_setting_details" d
JOIN "public"."office_member_setting_summaries" s ON s."id" = d."summary_id";


-- ------------------------------------------------------------------------------
-- 5. 後方互換ビューに対する INSTEAD OF トリガー（INSERT / DELETE透過）
-- ------------------------------------------------------------------------------

-- 5.1 office_staff_settings ビューへの INSERT トリガー
CREATE OR REPLACE FUNCTION public.handle_office_staff_settings_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    -- 該当事業所の有効な概要レコードを取得、なければ自動作成
    SELECT id INTO v_summary_id
    FROM public.office_staff_setting_summaries
    WHERE office_id = NEW.office_id
      AND valid_from <= CURRENT_DATE
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO public.office_staff_setting_summaries (office_id, valid_from, valid_to)
        VALUES (NEW.office_id, '2024-04-01', NULL)
        RETURNING id INTO v_summary_id;
    END IF;

    -- 詳細に挿入
    INSERT INTO public.office_staff_setting_details (id, summary_id, staff_id)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), v_summary_id, NEW.staff_id)
    ON CONFLICT (summary_id, staff_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_staff_settings_insert ON public.office_staff_settings;
CREATE TRIGGER trg_office_staff_settings_insert
INSTEAD OF INSERT ON public.office_staff_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_insert();

-- 5.2 office_staff_settings ビューへの DELETE トリガー
CREATE OR REPLACE FUNCTION public.handle_office_staff_settings_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.office_staff_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_staff_settings_delete ON public.office_staff_settings;
CREATE TRIGGER trg_office_staff_settings_delete
INSTEAD OF DELETE ON public.office_staff_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_delete();


-- 5.3 office_member_settings ビューへの INSERT トリガー
CREATE OR REPLACE FUNCTION public.handle_office_member_settings_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT id INTO v_summary_id
    FROM public.office_member_setting_summaries
    WHERE office_id = NEW.office_id
      AND valid_from <= CURRENT_DATE
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO public.office_member_setting_summaries (office_id, valid_from, valid_to)
        VALUES (NEW.office_id, '2024-04-01', NULL)
        RETURNING id INTO v_summary_id;
    END IF;

    INSERT INTO public.office_member_setting_details (id, summary_id, member_id)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), v_summary_id, NEW.member_id)
    ON CONFLICT (summary_id, member_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_member_settings_insert ON public.office_member_settings;
CREATE TRIGGER trg_office_member_settings_insert
INSTEAD OF INSERT ON public.office_member_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_insert();

-- 5.4 office_member_settings ビューへの DELETE トリガー
CREATE OR REPLACE FUNCTION public.handle_office_member_settings_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.office_member_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_member_settings_delete ON public.office_member_settings;
CREATE TRIGGER trg_office_member_settings_delete
INSTEAD OF DELETE ON public.office_member_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_delete();

