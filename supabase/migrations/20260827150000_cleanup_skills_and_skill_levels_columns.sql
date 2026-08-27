-- 不要な skills.sort_order カラムの削除
ALTER TABLE "public"."skills" DROP COLUMN IF EXISTS "sort_order";

-- 不要な skill_levels.skill_id, level, name カラムの削除
ALTER TABLE "public"."skill_levels" DROP COLUMN IF EXISTS "skill_id";
ALTER TABLE "public"."skill_levels" DROP COLUMN IF EXISTS "level";
ALTER TABLE "public"."skill_levels" DROP COLUMN IF EXISTS "name";
