-- Migration to add yomigana column to partner_contacts table
ALTER TABLE "public"."partner_contacts" ADD COLUMN IF NOT EXISTS "yomigana" TEXT;
