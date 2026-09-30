-- Migration to create member_recipient_certificates table
CREATE TABLE IF NOT EXISTS "public"."member_recipient_certificates" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "certificate_number" VARCHAR(10),
    "issuing_municipality" TEXT,
    "income_category" TEXT,
    "copayment_limit_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "disability_support_class" TEXT,
    "copayment_management_type" TEXT,
    "copayment_office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL,
    "copayment_office_code" VARCHAR(10),
    "copayment_office_name" TEXT,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE NOT NULL,
    "remarks" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);
