-- Add sort_order column to skill_categories and skill_items
ALTER TABLE "public"."skill_categories" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0;
ALTER TABLE "public"."skill_items" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0;

CREATE OR REPLACE VIEW "public"."skill_categories_view" AS SELECT * FROM "public"."skill_categories";
CREATE OR REPLACE VIEW "public"."skills" AS SELECT * FROM "public"."skill_items";
