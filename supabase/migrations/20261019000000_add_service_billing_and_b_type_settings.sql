-- ==============================================================================
-- 20261019000000_add_service_billing_and_b_type_settings.sql
-- 就労継続支援B型 サービス費算定ロジック（10割・1割）対応に伴うスキーマ改修
-- ==============================================================================

-- 1. reward_items (加算・減算項目マスタ) に算定方式区分 (calc_type) を追加
ALTER TABLE "public"."reward_items" 
ADD COLUMN IF NOT EXISTS "calc_type" VARCHAR(20) DEFAULT 'fixed_units' NOT NULL;

-- 2. office_service_type_settings (事業所支援種別割当) に事業所番号・人員基準・単価等を追加
ALTER TABLE "public"."office_service_type_settings" 
ADD COLUMN IF NOT EXISTS "office_number" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "staffing_ratio" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "wage_achievement_tier" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "regional_grade" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "unit_price_per_point" NUMERIC(12,2) DEFAULT 10.00 NOT NULL;

-- 3. office_reward_settings (事業所加算・減算届出設定) テーブルの新規作成
CREATE TABLE IF NOT EXISTS "public"."office_reward_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "reward_item_id" UUID REFERENCES "public"."reward_items"("id") ON DELETE CASCADE,
    "start_date" DATE NOT NULL,
    "end_date" DATE DEFAULT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. office_staff_settings (事業所職員割当) に配置職種・勤務形態・所定時間等を追加
ALTER TABLE "public"."office_staff_settings" 
ADD COLUMN IF NOT EXISTS "staff_role" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "employment_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "duty_type" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "weekly_working_hours" NUMERIC(5,2);

-- 5. member_attendance_records (利用者出欠実績) に各種加算判定フラグおよび実提供時間を追加
ALTER TABLE "public"."member_attendance_records" 
ADD COLUMN IF NOT EXISTS "is_visit_supported" BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "is_trial_use" BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "is_offsite_work" BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "service_hours" NUMERIC(4,2) DEFAULT NULL;

-- 6. service_billing_summaries (サービス費概要) テーブルの新規作成
CREATE TABLE IF NOT EXISTS "public"."service_billing_summaries" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "target_period" VARCHAR(7) NOT NULL,
    "attendance_days" INTEGER DEFAULT 0 NOT NULL,
    "base_reward_units" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "addition_units" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "subtraction_units" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "total_units" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 10.00 NOT NULL,
    "total_cost_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "calculated_copayment_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "copayment_limit_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "final_copayment_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "benefit_billing_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "actual_expense_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "total_member_billed_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "status" VARCHAR(20) DEFAULT 'draft' NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "service_billing_summaries_office_period_member_key" UNIQUE ("office_id", "target_period", "member_id")
);

-- 7. service_billing_details (サービス費明細) テーブルの新規作成
CREATE TABLE IF NOT EXISTS "public"."service_billing_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."service_billing_summaries"("id") ON DELETE CASCADE,
    "reward_item_id" UUID REFERENCES "public"."reward_items"("id") ON DELETE SET NULL,
    "service_code" VARCHAR(20),
    "item_name" TEXT NOT NULL,
    "item_category" VARCHAR(50) NOT NULL,
    "unit_value" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "count" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "total_item_units" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. 新規テーブルへの行レベルセキュリティ (RLS) およびポリシーの設定
ALTER TABLE "public"."office_reward_settings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."office_reward_settings";
CREATE POLICY "Allow all access" ON "public"."office_reward_settings" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."service_billing_summaries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_billing_summaries";
CREATE POLICY "Allow all access" ON "public"."service_billing_summaries" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."service_billing_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_billing_details";
CREATE POLICY "Allow all access" ON "public"."service_billing_details" FOR ALL USING (true) WITH CHECK (true);
