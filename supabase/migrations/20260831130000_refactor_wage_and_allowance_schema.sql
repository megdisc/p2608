-- Refactor database schema according to the 4-layer architecture:
-- 1. Master Layer: allowances, deductions
-- 2. Daily Execution Layer: daily_allowance_records, daily_deduction_records
-- 3. Monthly Execution Layer: monthly_incentive_records (rename from monthly_incentive_allocations)
-- 4. Monthly Snapshot Layer: monthly_wage_summaries (rename from monthly_wage_records), monthly_incentive_details, monthly_allowance_details, monthly_deduction_details

-- 1. Create Master Tables
CREATE TABLE IF NOT EXISTS "public"."allowances" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."deductions" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create Daily Records Tables
CREATE TABLE IF NOT EXISTS "public"."daily_allowance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "work_record_id" UUID REFERENCES "public"."daily_work_records"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowances"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."daily_deduction_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "work_record_id" UUID REFERENCES "public"."daily_work_records"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."deductions"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Rename Monthly Execution Table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'monthly_incentive_allocations') THEN
        ALTER TABLE "public"."monthly_incentive_allocations" RENAME TO "monthly_incentive_records";
    END IF;
END $$;

-- 4. Rename Monthly Summary Base Table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'monthly_wage_records') THEN
        ALTER TABLE "public"."monthly_wage_records" RENAME TO "monthly_wage_summaries";
    END IF;
END $$;

-- 5. Create Monthly Snapshot Details Tables
CREATE TABLE IF NOT EXISTS "public"."monthly_incentive_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."monthly_wage_summaries"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."monthly_allowance_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."monthly_wage_summaries"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowances"("id") ON DELETE SET NULL,
    "allowance_name" TEXT NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "quantity" NUMERIC(8,2) DEFAULT 0 NOT NULL,
    "amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."monthly_deduction_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."monthly_wage_summaries"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."deductions"("id") ON DELETE SET NULL,
    "deduction_name" TEXT NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "quantity" NUMERIC(8,2) DEFAULT 0 NOT NULL,
    "amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE IF EXISTS "public"."allowances" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."allowances";
CREATE POLICY "Allow all access" ON "public"."allowances" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."deductions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."deductions";
CREATE POLICY "Allow all access" ON "public"."deductions" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."daily_allowance_records" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."daily_allowance_records";
CREATE POLICY "Allow all access" ON "public"."daily_allowance_records" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."daily_deduction_records" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."daily_deduction_records";
CREATE POLICY "Allow all access" ON "public"."daily_deduction_records" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."monthly_incentive_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_incentive_details";
CREATE POLICY "Allow all access" ON "public"."monthly_incentive_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."monthly_allowance_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_allowance_details";
CREATE POLICY "Allow all access" ON "public"."monthly_allowance_details" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."monthly_deduction_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_deduction_details";
CREATE POLICY "Allow all access" ON "public"."monthly_deduction_details" FOR ALL USING (true) WITH CHECK (true);
