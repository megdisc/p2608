-- Add settlement_year_month column to projects table
ALTER TABLE IF EXISTS "public"."projects" ADD COLUMN IF NOT EXISTS "settlement_year_month" VARCHAR(7);
