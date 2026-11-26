-- 制度基準値マスタおよび基本報酬割当テーブル
-- 1. capacity_tiers (利用定員規模区分マスタ)
-- 2. staffing_ratio_tiers (人員配置基準区分マスタ)
-- 3. wage_achievement_tiers (平均工賃月額達成区分マスタ)
-- 4. base_reward_allocations (基本報酬割当マスタ)

-- 1. Create capacity_tiers table
CREATE TABLE IF NOT EXISTS "public"."capacity_tiers" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "min_capacity" INTEGER NOT NULL,
    "max_capacity" INTEGER,
    "display_order" INTEGER DEFAULT 0 NOT NULL,
    "valid_from" DATE DEFAULT '2024-04-01' NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_capacity_tiers_code" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "idx_capacity_tiers_display_order" ON "public"."capacity_tiers"("display_order");

ALTER TABLE "public"."capacity_tiers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."capacity_tiers";
CREATE POLICY "Allow all access" ON "public"."capacity_tiers" FOR ALL USING (true) WITH CHECK (true);

-- 2. Create staffing_ratio_tiers table
CREATE TABLE IF NOT EXISTS "public"."staffing_ratio_tiers" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "ratio_value" NUMERIC(5,2) NOT NULL,
    "display_order" INTEGER DEFAULT 0 NOT NULL,
    "valid_from" DATE DEFAULT '2024-04-01' NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_staffing_ratio_tiers_code" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "idx_staffing_ratio_tiers_display_order" ON "public"."staffing_ratio_tiers"("display_order");

ALTER TABLE "public"."staffing_ratio_tiers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staffing_ratio_tiers";
CREATE POLICY "Allow all access" ON "public"."staffing_ratio_tiers" FOR ALL USING (true) WITH CHECK (true);

-- 3. Create wage_achievement_tiers table
CREATE TABLE IF NOT EXISTS "public"."wage_achievement_tiers" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tier_rank" INTEGER NOT NULL,
    "min_wage" INTEGER NOT NULL,
    "max_wage" INTEGER,
    "display_order" INTEGER DEFAULT 0 NOT NULL,
    "valid_from" DATE DEFAULT '2024-04-01' NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_wage_achievement_tiers_code" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "idx_wage_achievement_tiers_display_order" ON "public"."wage_achievement_tiers"("display_order");

ALTER TABLE "public"."wage_achievement_tiers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."wage_achievement_tiers";
CREATE POLICY "Allow all access" ON "public"."wage_achievement_tiers" FOR ALL USING (true) WITH CHECK (true);

-- 4. Create base_reward_allocations table (基本報酬割当マスタ)
CREATE TABLE IF NOT EXISTS "public"."base_reward_allocations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "capacity_tier_id" UUID REFERENCES "public"."capacity_tiers"("id") ON DELETE RESTRICT,
    "staffing_ratio_tier_id" UUID REFERENCES "public"."staffing_ratio_tiers"("id") ON DELETE RESTRICT,
    "wage_achievement_tier_id" UUID REFERENCES "public"."wage_achievement_tiers"("id") ON DELETE RESTRICT,
    "base_units" INTEGER NOT NULL,
    "valid_from" DATE DEFAULT '2024-04-01' NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_base_reward_allocations_units" ON "public"."base_reward_allocations"("base_units" DESC);

ALTER TABLE "public"."base_reward_allocations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."base_reward_allocations";
CREATE POLICY "Allow all access" ON "public"."base_reward_allocations" FOR ALL USING (true) WITH CHECK (true);
