-- 1. Add status and completed_at to project_tasks
ALTER TABLE "public"."project_tasks" ADD COLUMN IF NOT EXISTS "status" character varying(20) DEFAULT 'not_started' NOT NULL;
ALTER TABLE "public"."project_tasks" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;

-- Map existing is_canceled to status
UPDATE "public"."project_tasks" SET "status" = 'canceled' WHERE "is_canceled" = true;

-- Note: is_canceled is kept for now but shouldn't be used going forward

-- 2. Modify monthly_task_progress
-- Drop the check constraint on current_progress
ALTER TABLE "public"."monthly_task_progress" DROP CONSTRAINT IF EXISTS "monthly_task_progress_current_progress_check";

-- Rename current_progress to status
ALTER TABLE "public"."monthly_task_progress" RENAME COLUMN "current_progress" TO "status";

-- Alter column type to varchar
ALTER TABLE "public"."monthly_task_progress" ALTER COLUMN "status" TYPE character varying(20) USING "status"::varchar;

-- Map existing values
UPDATE "public"."monthly_task_progress" SET "status" = 'completed' WHERE "status" = '100';
UPDATE "public"."monthly_task_progress" SET "status" = 'not_started' WHERE "status" = '0';
UPDATE "public"."monthly_task_progress" SET "status" = 'in_progress' WHERE "status" NOT IN ('completed', 'not_started', 'canceled');

-- Apply canceled status from tasks
UPDATE "public"."monthly_task_progress" mtp
SET "status" = 'canceled'
FROM "public"."project_tasks" pt
WHERE mtp.task_id = pt.id AND pt.is_canceled = true;

-- Set default to 'not_started'
ALTER TABLE "public"."monthly_task_progress" ALTER COLUMN "status" SET DEFAULT 'not_started';
