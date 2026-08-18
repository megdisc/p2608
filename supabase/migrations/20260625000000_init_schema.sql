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

-- 3.1 wage_rates (工賃単価マスタ)
CREATE TABLE IF NOT EXISTS "public"."wage_rates" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID,
    "wage" NUMERIC(10,2) NOT NULL,
    "effective_from" DATE DEFAULT CURRENT_DATE NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.2 members (利用者基本情報)
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "role" TEXT DEFAULT '利用者',
    "email" TEXT,
    "wage_rate_id" UUID REFERENCES "public"."wage_rates"("id") ON DELETE SET NULL,
    "contract_status" TEXT DEFAULT 'contracted',
    "contract_type" TEXT DEFAULT 'B型',
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.3 staffs (職員基本情報)
CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "email" TEXT,
    "role" TEXT DEFAULT 'staff',
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.4 partners (取引先基本情報)
CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.5 skills (スキル体系マスタ)
CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "description" TEXT,
    "sort_order" INTEGER DEFAULT 0 NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.6 skill_levels (スキルレベル定義)
CREATE TABLE IF NOT EXISTS "public"."skill_levels" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "level" INTEGER,
    "level_value" INTEGER,
    "name" TEXT,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.7 wage_items (工賃項目マスタ)
CREATE TABLE IF NOT EXISTS "public"."wage_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT DEFAULT '円/時',
    "sort_order" INTEGER DEFAULT 0 NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.8 wage_table_levels (基本工賃単価レベル)
CREATE TABLE IF NOT EXISTS "public"."wage_table_levels" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hourly_rate" NUMERIC(10,2) NOT NULL,
    "description" TEXT,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.9 member_skill_evaluations (利用者スキル評価)
CREATE TABLE IF NOT EXISTS "public"."member_skill_evaluations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_levels"("id") ON DELETE CASCADE,
    "evaluated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.10 member_wage_evaluations (利用者工賃単価評価)
CREATE TABLE IF NOT EXISTS "public"."member_wage_evaluations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "wage_rate_id" UUID REFERENCES "public"."wage_rates"("id") ON DELETE CASCADE,
    "evaluated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.11 projects (案件基本情報)
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "start_date" VARCHAR(7),
    "end_date" VARCHAR(7),
    "project_type" TEXT DEFAULT 'one-off',
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.12 project_tasks (案件タスク)
CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "status" VARCHAR(20) DEFAULT 'not_started' NOT NULL,
    "completed_at" TIMESTAMPTZ,
    "assignee_type" VARCHAR DEFAULT 'internal',
    "is_canceled" BOOLEAN DEFAULT false NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.13 project_task_skills (タスク必要スキル)
CREATE TABLE IF NOT EXISTS "public"."project_task_skills" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skills"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_levels"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.14 project_task_assignees (タスク担当者割当)
CREATE TABLE IF NOT EXISTS "public"."project_task_assignees" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE SET NULL,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "assignee_type" TEXT DEFAULT 'member',
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.15 project_budgets (案件予算)
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

-- 3.16 daily_work_records (日次作業記録および確定)
CREATE TABLE IF NOT EXISTS "public"."daily_work_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "work_time" NUMERIC(4,1) NOT NULL,
    "is_confirmed" BOOLEAN DEFAULT false NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.17 project_task_progress (案件タスク進捗)
CREATE TABLE IF NOT EXISTS "public"."project_task_progress" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" TEXT NOT NULL,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "status" VARCHAR(20) DEFAULT 'not_started' NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.18 monthly_incentive_allocations (月次インセンティブ分配記録および確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_incentive_allocations" (
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

-- 3.19 monthly_wage_records (月次工賃記録および確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" TEXT NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "work_time" NUMERIC DEFAULT 0 NOT NULL,
    "wage_rate" NUMERIC,
    "basic_wage" INTEGER,
    "incentive_total" INTEGER DEFAULT 0 NOT NULL,
    "wage_total" INTEGER DEFAULT 0 NOT NULL,
    "deduction_total" INTEGER DEFAULT 0 NOT NULL,
    "payment" INTEGER DEFAULT 0 NOT NULL,
    "is_confirmed" BOOLEAN DEFAULT false NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "monthly_wage_records_year_month_member_id_key" UNIQUE ("year_month", "member_id")
);

-- 3.20 financial_records (収支記録)
CREATE TABLE IF NOT EXISTS "public"."financial_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "period" DATE,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE SET NULL,
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "amount" NUMERIC(12,2) NOT NULL,
    "recorded_date" DATE,
    "recorded_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "is_limited" BOOLEAN DEFAULT false,
    "activity_category" TEXT DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare')),
    "remarks" TEXT,
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
