-- 1. スキルカテゴリテーブルの作成 (フラット構造)
CREATE TABLE IF NOT EXISTS "public"."skill_categories" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 既存テーブルから parent_id / sort_order カラムの削除 (存在する場合)
ALTER TABLE "public"."skill_categories" DROP COLUMN IF EXISTS "parent_id";
ALTER TABLE "public"."skill_categories" DROP COLUMN IF EXISTS "sort_order";

-- 2. skill_items に category_id カラムの追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'skill_items' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "public"."skill_items" 
        ADD COLUMN "category_id" UUID REFERENCES "public"."skill_categories"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- 3. 互換ビュー作成
CREATE OR REPLACE VIEW "public"."skill_categories_view" AS SELECT * FROM "public"."skill_categories";

-- 4. RLS有効化とポリシー作成
ALTER TABLE "public"."skill_categories" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."skill_categories";
CREATE POLICY "Allow all access" ON "public"."skill_categories" FOR ALL USING (true) WITH CHECK (true);
