ALTER TABLE "public"."project_tasks" ADD COLUMN IF NOT EXISTS "is_completed" boolean DEFAULT false NOT NULL;
