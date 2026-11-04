-- ==============================================================================
-- 20261104050000_merge_allowance_and_deduction_details.sql
-- 加算手当明細 (allowance_details) と 控除明細 (deduction_details) を
-- 加算手当・控除明細 (allowance_deduction_details) に統合
-- ==============================================================================

-- 1. 統合テーブル allowance_deduction_details の作成
CREATE TABLE IF NOT EXISTS "public"."allowance_deduction_details" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "summary_id" UUID NOT NULL REFERENCES "public"."wage_summaries"("id") ON DELETE CASCADE,
    "item_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE SET NULL,
    "item_category" VARCHAR(20) NOT NULL, -- ('allowance', 'deduction')
    "item_name" TEXT NOT NULL,
    "unit_price" NUMERIC(12,2) NOT NULL DEFAULT 0,
    "quantity" NUMERIC(8,2) NOT NULL DEFAULT 0,
    "amount" NUMERIC(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."allowance_deduction_details" IS '加算手当・控除明細';
COMMENT ON COLUMN "public"."allowance_deduction_details"."id" IS '明細ID';
COMMENT ON COLUMN "public"."allowance_deduction_details"."summary_id" IS '工賃・控除概要ID';
COMMENT ON COLUMN "public"."allowance_deduction_details"."item_id" IS '加算手当・控除項目ID（FK -> allowance_deduction_items.id）';
COMMENT ON COLUMN "public"."allowance_deduction_details"."item_category" IS '項目区分（allowance: 加算手当, deduction: 控除）';
COMMENT ON COLUMN "public"."allowance_deduction_details"."item_name" IS '項目名称（手当名または控除名）';
COMMENT ON COLUMN "public"."allowance_deduction_details"."unit_price" IS '単価';
COMMENT ON COLUMN "public"."allowance_deduction_details"."quantity" IS '数量・日数';
COMMENT ON COLUMN "public"."allowance_deduction_details"."amount" IS '金額';

-- インデックス作成
CREATE INDEX IF NOT EXISTS "idx_allowance_deduction_details_summary_id" 
ON "public"."allowance_deduction_details"("summary_id");

CREATE INDEX IF NOT EXISTS "idx_allowance_deduction_details_item_id" 
ON "public"."allowance_deduction_details"("item_id");

CREATE INDEX IF NOT EXISTS "idx_allowance_deduction_details_category" 
ON "public"."allowance_deduction_details"("summary_id", "item_category");

-- RLS設定
ALTER TABLE "public"."allowance_deduction_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."allowance_deduction_details";
CREATE POLICY "Allow all access" ON "public"."allowance_deduction_details" FOR ALL USING (true) WITH CHECK (true);

-- 2. 既存データ移行
DO $$
BEGIN
    -- allowance_details からのデータ移行（テーブルが存在し、ビューでない場合）
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'allowance_details' AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO "public"."allowance_deduction_details" 
            ("id", "summary_id", "item_id", "item_category", "item_name", "unit_price", "quantity", "amount", "created_at", "updated_at")
        SELECT 
            "id", "summary_id", "allowance_id", 'allowance', "allowance_name", "unit_price", "quantity", "amount", "created_at", "updated_at"
        FROM "public"."allowance_details"
        ON CONFLICT ("id") DO NOTHING;

        -- 旧テーブル削除
        DROP TABLE "public"."allowance_details" CASCADE;
    END IF;

    -- deduction_details からのデータ移行（テーブルが存在し、ビューでない場合）
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'deduction_details' AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO "public"."allowance_deduction_details" 
            ("id", "summary_id", "item_id", "item_category", "item_name", "unit_price", "quantity", "amount", "created_at", "updated_at")
        SELECT 
            "id", "summary_id", "deduction_id", 'deduction', "deduction_name", "unit_price", "quantity", "amount", "created_at", "updated_at"
        FROM "public"."deduction_details"
        ON CONFLICT ("id") DO NOTHING;

        -- 旧テーブル削除
        DROP TABLE "public"."deduction_details" CASCADE;
    END IF;
END $$;

-- 3. 後方互換ビューの作成
-- 3.1 加算手当明細ビュー (allowance_details)
CREATE OR REPLACE VIEW "public"."allowance_details" AS
SELECT
    "id",
    "summary_id",
    "item_id" AS "allowance_id",
    "item_name" AS "allowance_name",
    "unit_price",
    "quantity",
    "amount",
    "created_at",
    "updated_at"
FROM "public"."allowance_deduction_details"
WHERE "item_category" = 'allowance';

-- 3.2 控除明細ビュー (deduction_details)
CREATE OR REPLACE VIEW "public"."deduction_details" AS
SELECT
    "id",
    "summary_id",
    "item_id" AS "deduction_id",
    "item_name" AS "deduction_name",
    "unit_price",
    "quantity",
    "amount",
    "created_at",
    "updated_at"
FROM "public"."allowance_deduction_details"
WHERE "item_category" = 'deduction';

-- 3.3 monthly_allowance_details ビュー
CREATE OR REPLACE VIEW "public"."monthly_allowance_details" AS
SELECT * FROM "public"."allowance_details";

-- 3.4 monthly_deduction_details ビュー
CREATE OR REPLACE VIEW "public"."monthly_deduction_details" AS
SELECT * FROM "public"."deduction_details";

-- 3.5 monthly_allowance_deduction_details ビュー
CREATE OR REPLACE VIEW "public"."monthly_allowance_deduction_details" AS
SELECT * FROM "public"."allowance_deduction_details";

