-- Migration to update office_member_settings and member_recipient_certificates
ALTER TABLE "public"."office_member_settings" 
  DROP COLUMN IF EXISTS "is_primary";

ALTER TABLE "public"."member_recipient_certificates" 
  ADD COLUMN IF NOT EXISTS "copayment_office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "copayment_office_code" VARCHAR(10);
