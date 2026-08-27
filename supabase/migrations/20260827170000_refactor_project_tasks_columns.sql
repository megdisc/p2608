-- 1. 不要カラムの削除
ALTER TABLE "public"."project_tasks" DROP COLUMN IF EXISTS "code";
ALTER TABLE "public"."project_tasks" DROP COLUMN IF EXISTS "status";
ALTER TABLE "public"."project_tasks" DROP COLUMN IF EXISTS "is_canceled";

-- 2. is_completed カラムの追加
ALTER TABLE "public"."project_tasks" ADD COLUMN IF EXISTS "is_completed" BOOLEAN DEFAULT false NOT NULL;
