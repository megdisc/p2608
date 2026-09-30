-- Migration to alter partners and partner_contacts tables
ALTER TABLE "public"."partners" DROP COLUMN IF EXISTS "contact_person";
ALTER TABLE "public"."partners" ADD COLUMN IF NOT EXISTS "is_other" BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE "public"."partner_contacts" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "public"."partner_contacts" DROP COLUMN IF EXISTS "email";
ALTER TABLE "public"."partner_contacts" DROP COLUMN IF EXISTS "is_primary";
