-- Add office_id to projects table
ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL;
