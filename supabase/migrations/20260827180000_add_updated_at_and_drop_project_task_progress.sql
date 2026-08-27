-- 1. project_task_skills に updated_at カラムを追加
ALTER TABLE "public"."project_task_skills" 
  ADD COLUMN IF EXISTS "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL;

-- 2. project_task_assignees に updated_at カラムを追加
ALTER TABLE "public"."project_task_assignees" 
  ADD COLUMN IF EXISTS "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL;

-- 3. 未使用の project_task_progress テーブルを削除
DROP TABLE IF EXISTS "public"."project_task_progress";
