-- 所在地級数テーブルの分割（正規化：冗長性の排除）
-- 1. 所在地級数上乗せ割合マスタ (regional_grade_rates)
-- 2. 所在地級数所在地マスタ (regional_grade_locations)
-- 3. 後方互換・集約ビュー (regional_grades)

-- 1. Create regional_grade_rates table (所在地級数上乗せ割合マスタ)
CREATE TABLE IF NOT EXISTS "public"."regional_grade_rates" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "grade" VARCHAR(20) NOT NULL,
    "premium_rate" NUMERIC(5,4) DEFAULT 0.0000 NOT NULL,
    "display_order" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_regional_grade_rates_grade" UNIQUE ("grade")
);

CREATE INDEX IF NOT EXISTS "idx_regional_grade_rates_display_order"
ON "public"."regional_grade_rates"("display_order");

ALTER TABLE "public"."regional_grade_rates" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."regional_grade_rates";
CREATE POLICY "Allow all access" ON "public"."regional_grade_rates"
FOR ALL USING (true) WITH CHECK (true);

-- デフォルトの標準級地・上乗せ割合マスタ（1級地〜7級地、その他）を登録
INSERT INTO "public"."regional_grade_rates" (grade, premium_rate, display_order)
VALUES
    ('1級地', 0.2000, 1),
    ('2級地', 0.1600, 2),
    ('3級地', 0.1500, 3),
    ('4級地', 0.1200, 4),
    ('5級地', 0.1000, 5),
    ('6級地', 0.0600, 6),
    ('7級地', 0.0300, 7),
    ('その他', 0.0000, 8)
ON CONFLICT ("grade") DO UPDATE 
SET premium_rate = EXCLUDED.premium_rate,
    display_order = EXCLUDED.display_order;

-- 2. Create regional_grade_locations table (所在地級数所在地マスタ)
CREATE TABLE IF NOT EXISTS "public"."regional_grade_locations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "prefecture" VARCHAR(20) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "grade" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_regional_grade_locations_pref_city" UNIQUE ("prefecture", "city"),
    CONSTRAINT "fk_regional_grade_locations_grade" FOREIGN KEY ("grade")
        REFERENCES "public"."regional_grade_rates"("grade") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "idx_regional_grade_locations_pref_city"
ON "public"."regional_grade_locations"("prefecture", "city");

CREATE INDEX IF NOT EXISTS "idx_regional_grade_locations_grade"
ON "public"."regional_grade_locations"("grade");

ALTER TABLE "public"."regional_grade_locations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."regional_grade_locations";
CREATE POLICY "Allow all access" ON "public"."regional_grade_locations"
FOR ALL USING (true) WITH CHECK (true);

-- 既存の regional_grades テーブルが存在する場合はデータを移行
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'regional_grades'
          AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO "public"."regional_grade_locations" (id, prefecture, city, grade, created_at, updated_at)
        SELECT id, prefecture, city, grade, created_at, updated_at
        FROM "public"."regional_grades"
        ON CONFLICT ("prefecture", "city") DO UPDATE
        SET grade = EXCLUDED.grade;

        -- 既存テーブルをDROP
        DROP TABLE "public"."regional_grades" CASCADE;
    END IF;
END $$;

-- 3. Create regional_grades view (後方互換・集約ビュー)
CREATE OR REPLACE VIEW "public"."regional_grades" AS
SELECT
    l.id,
    l.prefecture,
    l.city,
    l.grade,
    r.premium_rate,
    r.display_order,
    false AS is_deleted,
    NULL::timestamptz AS deleted_at,
    l.created_at,
    l.updated_at
FROM "public"."regional_grade_locations" l
JOIN "public"."regional_grade_rates" r ON l.grade = r.grade;
