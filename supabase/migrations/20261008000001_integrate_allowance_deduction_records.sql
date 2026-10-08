-- Migration to integrate allowance_records and deduction_records into allowance_deduction_records

CREATE TABLE IF NOT EXISTS "public"."allowance_deduction_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "target_period" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "item_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Migrate data if tables existed as base tables
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'allowance_records' 
          AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO "public"."allowance_deduction_records" ("id", "target_period", "member_id", "item_id", "quantity", "unit_price", "created_at", "updated_at")
        SELECT "id", "target_period", "member_id", "allowance_id", "quantity", "unit_price", "created_at", "updated_at" 
        FROM "public"."allowance_records"
        ON CONFLICT ("id") DO NOTHING;
        
        DROP TABLE "public"."allowance_records" CASCADE;
    END IF;

    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'deduction_records' 
          AND table_type = 'BASE TABLE'
    ) THEN
        INSERT INTO "public"."allowance_deduction_records" ("id", "target_period", "member_id", "item_id", "quantity", "unit_price", "created_at", "updated_at")
        SELECT "id", "target_period", "member_id", "deduction_id", "quantity", "unit_price", "created_at", "updated_at" 
        FROM "public"."deduction_records"
        ON CONFLICT ("id") DO NOTHING;
        
        DROP TABLE "public"."deduction_records" CASCADE;
    END IF;
END $$;

-- Create backward-compatibility views
CREATE OR REPLACE VIEW "public"."daily_allowance_records" AS 
SELECT id, target_period, member_id, item_id AS allowance_id, quantity, unit_price, created_at, updated_at 
FROM "public"."allowance_deduction_records";

CREATE OR REPLACE VIEW "public"."daily_deduction_records" AS 
SELECT id, target_period, member_id, item_id AS deduction_id, quantity, unit_price, created_at, updated_at 
FROM "public"."allowance_deduction_records";

CREATE OR REPLACE VIEW "public"."allowance_records" AS 
SELECT id, target_period, member_id, item_id AS allowance_id, quantity, unit_price, created_at, updated_at 
FROM "public"."allowance_deduction_records";

CREATE OR REPLACE VIEW "public"."deduction_records" AS 
SELECT id, target_period, member_id, item_id AS deduction_id, quantity, unit_price, created_at, updated_at 
FROM "public"."allowance_deduction_records";
