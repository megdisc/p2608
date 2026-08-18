-- Schema update based on revised Table Composition specification

-- 1. Rename tables if old names exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
        ALTER TABLE "public"."clients" RENAME TO "partners";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='base_wages') THEN
        ALTER TABLE "public"."base_wages" RENAME TO "wage_rates";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='project_budget_items') THEN
        ALTER TABLE "public"."project_budget_items" RENAME TO "project_budgets";
    END IF;
END $$;

-- 2. Update column names in referencing tables if old column name exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='members' AND column_name='base_wage_id') THEN
        ALTER TABLE "public"."members" RENAME COLUMN "base_wage_id" TO "wage_rate_id";
    END IF;
END $$;

-- 3. Daily Work Records confirmation columns and drop separate confirmations table
ALTER TABLE IF EXISTS "public"."daily_work_records" ADD COLUMN IF NOT EXISTS "is_confirmed" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE IF EXISTS "public"."daily_work_records" ADD COLUMN IF NOT EXISTS "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL;
ALTER TABLE IF EXISTS "public"."daily_work_records" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMPTZ;
DROP TABLE IF EXISTS "public"."daily_work_confirmations";

-- 4. Monthly Settlements table & drop separate settlement confirmations
CREATE TABLE IF NOT EXISTS "public"."monthly_settlements" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_confirmed" BOOLEAN DEFAULT false NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);
DROP TABLE IF EXISTS "public"."monthly_settlement_confirmations";

-- 5. Monthly Wage Records confirmation columns and drop separate wage confirmations
ALTER TABLE IF EXISTS "public"."monthly_wage_records" ADD COLUMN IF NOT EXISTS "is_confirmed" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE IF EXISTS "public"."monthly_wage_records" ADD COLUMN IF NOT EXISTS "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL;
ALTER TABLE IF EXISTS "public"."monthly_wage_records" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMPTZ;
DROP TABLE IF EXISTS "public"."monthly_wage_confirmations";

-- 6. Member Wage Evaluations table
CREATE TABLE IF NOT EXISTS "public"."member_wage_evaluations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "wage_rate_id" UUID REFERENCES "public"."wage_rates"("id") ON DELETE CASCADE,
    "evaluated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Ensure RLS policies on new tables
ALTER TABLE IF EXISTS "public"."monthly_settlements" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_settlements";
CREATE POLICY "Allow all access" ON "public"."monthly_settlements" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS "public"."member_wage_evaluations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."member_wage_evaluations";
CREATE POLICY "Allow all access" ON "public"."member_wage_evaluations" FOR ALL USING (true) WITH CHECK (true);
