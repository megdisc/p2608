ALTER TABLE "public"."monthly_member_contributions" ADD COLUMN IF NOT EXISTS "deduction_amount" integer DEFAULT 0 NOT NULL;
