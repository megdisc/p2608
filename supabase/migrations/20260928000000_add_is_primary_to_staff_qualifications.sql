-- Add is_primary column to staff_qualification_settings table
ALTER TABLE "public"."staff_qualification_settings" 
ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN DEFAULT false NOT NULL;
