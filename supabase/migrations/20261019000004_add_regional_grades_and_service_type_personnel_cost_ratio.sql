-- 1. Create regional_grades table (所在地級数・地域区分マスタ)
CREATE TABLE IF NOT EXISTS "public"."regional_grades" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "prefecture" VARCHAR(20) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "grade" VARCHAR(20) NOT NULL,
    "premium_rate" NUMERIC(5,4) DEFAULT 0.0000 NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_regional_grades_pref_city" UNIQUE ("prefecture", "city")
);

CREATE INDEX IF NOT EXISTS "idx_regional_grades_pref_city" 
ON "public"."regional_grades"("prefecture", "city");

CREATE INDEX IF NOT EXISTS "idx_regional_grades_is_deleted" 
ON "public"."regional_grades"("is_deleted");

ALTER TABLE "public"."regional_grades" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON "public"."regional_grades"
FOR ALL USING (true) WITH CHECK (true);

-- 2. Add personnel_cost_ratio to service_types (支援種別マスタに人件費割合を追加)
ALTER TABLE "public"."service_types"
ADD COLUMN IF NOT EXISTS "personnel_cost_ratio" NUMERIC(5,4) DEFAULT 0.5700 NOT NULL;
