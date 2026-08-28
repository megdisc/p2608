-- monthly_incentive_allocations テーブルから不要な project_id カラムを削除
ALTER TABLE "public"."monthly_incentive_allocations" DROP COLUMN IF EXISTS "project_id";
