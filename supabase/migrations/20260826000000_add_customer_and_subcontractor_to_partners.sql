-- Migration: Add is_customer and is_subcontractor columns to partners table
ALTER TABLE "public"."partners" 
ADD COLUMN IF NOT EXISTS "is_customer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "is_subcontractor" BOOLEAN NOT NULL DEFAULT true;
