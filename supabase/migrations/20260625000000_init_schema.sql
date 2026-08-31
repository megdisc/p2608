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

-- 3. テーブル定義

-- 3.1 users (認証ユーザー)
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "role" TEXT DEFAULT '職員' NOT NULL,
    "user_type" TEXT DEFAULT 'staff' NOT NULL CHECK ("user_type" IN ('staff', 'member')),
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.2 wage_rates (工賃単価マスタ)
CREATE TABLE IF NOT EXISTS "public"."wage_rates" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "wage" NUMERIC(10,2) NOT NULL,
    "effective_from" DATE DEFAULT CURRENT_DATE NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.3 members (利用者基本情報)
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "contract_status" TEXT DEFAULT 'contracted',
    "contract_type" TEXT DEFAULT 'B型',
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.4 staffs (職員基本情報)
CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.5 partners (取引先基本情報)
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

-- 3.6 skills (スキル体系マスタ)
CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER DEFAULT 0 NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.7 skill_levels (スキルレベル定義)
CREATE TABLE IF NOT EXISTS "public"."skill_levels" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "level_value" INTEGER,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.8 allowances (その他加算手当マスタ)
CREATE TABLE IF NOT EXISTS "public"."allowances" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.9 deductions (控除マスタ)
CREATE TABLE IF NOT EXISTS "public"."deductions" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL,
    "default_unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.10 member_skill_evaluations (利用者スキル評価)
CREATE TABLE IF NOT EXISTS "public"."member_skill_evaluations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_levels"("id") ON DELETE CASCADE,
    "evaluated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.11 member_wage_evaluations (利用者工賃単価評価)
CREATE TABLE IF NOT EXISTS "public"."member_wage_evaluations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "wage_rate_id" UUID REFERENCES "public"."wage_rates"("id") ON DELETE CASCADE,
    "evaluated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.12 projects (案件基本情報)
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "project_type" TEXT DEFAULT 'one-off',
    "settlement_year_month" VARCHAR(7),
    "sequence" INTEGER,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.13 project_tasks (案件タスク)
CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "assignee_type" VARCHAR DEFAULT 'internal',
    "is_completed" BOOLEAN DEFAULT false NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.14 project_task_skills (タスク必要スキル)
CREATE TABLE IF NOT EXISTS "public"."project_task_skills" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_levels"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.15 project_task_assignees (タスク担当者割当)
CREATE TABLE IF NOT EXISTS "public"."project_task_assignees" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE SET NULL,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "assignee_type" TEXT DEFAULT 'member',
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.16 project_budgets (案件予算)
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

-- 3.17 daily_work_records (日次作業記録)
CREATE TABLE IF NOT EXISTS "public"."daily_work_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "work_time" NUMERIC(4,1) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.18 daily_allowance_records (日次その他加算手当記録)
CREATE TABLE IF NOT EXISTS "public"."daily_allowance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "work_record_id" UUID REFERENCES "public"."daily_work_records"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowances"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.19 daily_deduction_records (日次控除記録)
CREATE TABLE IF NOT EXISTS "public"."daily_deduction_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "work_record_id" UUID REFERENCES "public"."daily_work_records"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."deductions"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.20 daily_work_confirmations (日次作業記録確定)
CREATE TABLE IF NOT EXISTS "public"."daily_work_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.21 daily_financial_records (日次収支記録)
CREATE TABLE IF NOT EXISTS "public"."daily_financial_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "transaction_date" DATE DEFAULT CURRENT_DATE NOT NULL,
    "period" DATE,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "recorded_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "activity_category" TEXT DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare')),
    "cost_category" TEXT DEFAULT 'manufacturing' NOT NULL CHECK ("cost_category" IN ('manufacturing', 'sga')),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 互換用テーブル (financial_records)
CREATE TABLE IF NOT EXISTS "public"."financial_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "period" DATE,
    "recorded_date" DATE,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "recorded_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "activity_category" TEXT DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare')),
    "cost_category" TEXT DEFAULT 'manufacturing' NOT NULL CHECK ("cost_category" IN ('manufacturing', 'sga')),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.22 monthly_incentive_records (月次インセンティブ記録)
CREATE TABLE IF NOT EXISTS "public"."monthly_incentive_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.23 monthly_incentive_confirmations (月次インセンティブ確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_incentive_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.24 monthly_wage_summaries (月次工賃・控除概要)
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_summaries" (
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
    CONSTRAINT "monthly_wage_summaries_year_month_member_id_key" UNIQUE ("year_month", "member_id")
);

-- 3.25 monthly_incentive_details (月次インセンティブ明細)
CREATE TABLE IF NOT EXISTS "public"."monthly_incentive_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."monthly_wage_summaries"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.26 monthly_allowance_details (月次その他加算手当明細)
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

-- 3.27 monthly_deduction_details (月次控除明細)
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

-- 3.28 monthly_wage_confirmations (月次工賃・控除確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.29 monthly_confirmation_details (月次収支明細)
CREATE TABLE IF NOT EXISTS "public"."monthly_confirmation_details" (
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

-- 3.30 monthly_financial_confirmations (月次収支確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_financial_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. RLS 有効化と全アクセス許可ポリシー

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
