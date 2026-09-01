-- ==========================================
-- システム統合マイグレーション (Single Consolidated Schema)
-- ==========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET search_path = public, extensions;

-- 1. 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- 2. トリガー用共通関数 (updated_at 自動更新)
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. テーブル定義（4層アーキテクチャ）

-- ==========================================
-- 1. マスタ層
-- ==========================================

-- 1.1 skill_items (スキル項目)
CREATE TABLE IF NOT EXISTS "public"."skill_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.2 skill_level_items (スキルレベル項目)
CREATE TABLE IF NOT EXISTS "public"."skill_level_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "level_value" INTEGER NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.3 wage_rate_items (工賃単価項目)
CREATE TABLE IF NOT EXISTS "public"."wage_rate_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "wage" NUMERIC(12,2) NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.4 allowance_items (加算手当項目)
CREATE TABLE IF NOT EXISTS "public"."allowance_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.5 deduction_items (控除項目)
CREATE TABLE IF NOT EXISTS "public"."deduction_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.6 auth_users (認証ユーザー)
CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "role" TEXT DEFAULT '職員' NOT NULL,
    "user_type" TEXT DEFAULT 'staff' NOT NULL CHECK ("user_type" IN ('staff', 'member')),
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.7 members (利用者)
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."auth_users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.8 member_skill_settings (利用者スキル割当)
CREATE TABLE IF NOT EXISTS "public"."member_skill_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skill_items"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_level_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.9 member_wage_settings (利用者工賃単価割当)
CREATE TABLE IF NOT EXISTS "public"."member_wage_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "wage_rate_id" UUID REFERENCES "public"."wage_rate_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.10 staffs (職員)
CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."auth_users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.11 partners (取引先)
CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "is_customer" BOOLEAN DEFAULT false NOT NULL,
    "is_subcontractor" BOOLEAN DEFAULT false NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.12 projects (案件)
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "settlement_year_month" VARCHAR(7),
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "project_type" TEXT DEFAULT 'one-off',
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.13 project_tasks (案件タスク)
CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "completed_at" TIMESTAMPTZ,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "assignee_type" VARCHAR DEFAULT 'internal',
    "is_completed" BOOLEAN DEFAULT false NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.14 task_skill_settings (タスクスキル割当)
CREATE TABLE IF NOT EXISTS "public"."task_skill_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skill_items"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_level_items"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.15 task_assignee_settings (タスク担当者割当)
CREATE TABLE IF NOT EXISTS "public"."task_assignee_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE SET NULL,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "assignee_type" TEXT DEFAULT 'member',
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.16 project_budgets (案件予算)
CREATE TABLE IF NOT EXISTS "public"."project_budgets" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 2. 日次実績層
-- ==========================================

-- 2.1 attendance_records (出欠実績)
CREATE TABLE IF NOT EXISTS "public"."attendance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "work_time" NUMERIC(4,1) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.2 allowance_records (加算手当実績)
CREATE TABLE IF NOT EXISTS "public"."allowance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowance_items"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.3 deduction_records (控除実績)
CREATE TABLE IF NOT EXISTS "public"."deduction_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."deduction_items"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.4 daily_record_closings (日次実績確定)
CREATE TABLE IF NOT EXISTS "public"."daily_record_closings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL UNIQUE,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 3. 月次実績層
-- ==========================================

-- 3.1 general_financial_records (一般収支実績)
CREATE TABLE IF NOT EXISTS "public"."general_financial_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "transaction_date" DATE DEFAULT CURRENT_DATE NOT NULL,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.2 incentive_records (インセンティブ実績)
CREATE TABLE IF NOT EXISTS "public"."incentive_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.3 monthly_record_closings (月次実績確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_record_closings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 4. スナップショット層
-- ==========================================

-- 4.1 general_financial_details (一般収支明細)
CREATE TABLE IF NOT EXISTS "public"."general_financial_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL,
    "recorded_date" DATE,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "recorded_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "activity_category" TEXT DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare')),
    "cost_category" TEXT DEFAULT 'manufacturing' NOT NULL CHECK ("cost_category" IN ('manufacturing', 'sga')),
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.2 wage_summaries (工賃・控除概要)
CREATE TABLE IF NOT EXISTS "public"."wage_summaries" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" TEXT NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "work_time" NUMERIC DEFAULT 0 NOT NULL,
    "wage_rate" NUMERIC,
    "basic_wage" INTEGER,
    "incentive_total" INTEGER DEFAULT 0 NOT NULL,
    "other_allowance_total" INTEGER DEFAULT 0 NOT NULL,
    "wage_total" INTEGER DEFAULT 0 NOT NULL,
    "deduction_total" INTEGER DEFAULT 0 NOT NULL,
    "payment" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "wage_summaries_year_month_member_id_key" UNIQUE ("year_month", "member_id")
);

-- 4.3 incentive_details (インセンティブ明細)
CREATE TABLE IF NOT EXISTS "public"."incentive_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."wage_summaries"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.4 allowance_details (加算手当明細)
CREATE TABLE IF NOT EXISTS "public"."allowance_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."wage_summaries"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowance_items"("id") ON DELETE SET NULL,
    "allowance_name" TEXT NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "quantity" NUMERIC(8,2) DEFAULT 0 NOT NULL,
    "amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.5 deduction_details (控除明細)
CREATE TABLE IF NOT EXISTS "public"."deduction_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."wage_summaries"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."deduction_items"("id") ON DELETE SET NULL,
    "deduction_name" TEXT NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "quantity" NUMERIC(8,2) DEFAULT 0 NOT NULL,
    "amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4.6 monthly_financial_closings (月次収支確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_financial_closings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 5. 旧テーブル名互換ビュー (Backward-Compatible Views)
-- ==========================================

CREATE OR REPLACE VIEW "public"."users" AS SELECT * FROM "public"."auth_users";
CREATE OR REPLACE VIEW "public"."wage_rates" AS SELECT * FROM "public"."wage_rate_items";
CREATE OR REPLACE VIEW "public"."allowances" AS SELECT * FROM "public"."allowance_items";
CREATE OR REPLACE VIEW "public"."deductions" AS SELECT * FROM "public"."deduction_items";
CREATE OR REPLACE VIEW "public"."skills" AS SELECT * FROM "public"."skill_items";
CREATE OR REPLACE VIEW "public"."skill_levels" AS SELECT * FROM "public"."skill_level_items";
CREATE OR REPLACE VIEW "public"."daily_work_records" AS SELECT * FROM "public"."attendance_records";
CREATE OR REPLACE VIEW "public"."daily_allowance_records" AS SELECT * FROM "public"."allowance_records";
CREATE OR REPLACE VIEW "public"."daily_deduction_records" AS SELECT * FROM "public"."deduction_records";
CREATE OR REPLACE VIEW "public"."daily_work_confirmations" AS SELECT * FROM "public"."daily_record_closings";
CREATE OR REPLACE VIEW "public"."financial_records" AS SELECT * FROM "public"."general_financial_records";
CREATE OR REPLACE VIEW "public"."daily_financial_records" AS SELECT * FROM "public"."general_financial_records";
CREATE OR REPLACE VIEW "public"."monthly_incentive_records" AS SELECT * FROM "public"."incentive_records";
CREATE OR REPLACE VIEW "public"."monthly_incentive_confirmations" AS SELECT * FROM "public"."monthly_record_closings";
CREATE OR REPLACE VIEW "public"."monthly_confirmation_details" AS SELECT * FROM "public"."general_financial_details";
CREATE OR REPLACE VIEW "public"."monthly_wage_summaries" AS SELECT * FROM "public"."wage_summaries";
CREATE OR REPLACE VIEW "public"."monthly_incentive_details" AS SELECT * FROM "public"."incentive_details";
CREATE OR REPLACE VIEW "public"."monthly_allowance_details" AS SELECT * FROM "public"."allowance_details";
CREATE OR REPLACE VIEW "public"."monthly_deduction_details" AS SELECT * FROM "public"."deduction_details";
CREATE OR REPLACE VIEW "public"."monthly_financial_confirmations" AS SELECT * FROM "public"."monthly_financial_closings";

-- ==========================================
-- 6. RLS 有効化と全アクセス許可ポリシー
-- ==========================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Allow all access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
