-- ==========================================
-- システム統合マイグレーション (Single Consolidated Schema)
-- テーブル構成タブ (ScreenCompositionPage.tsx) と完全同期
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

-- 1.0 organizations (法人)
CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "representative_name" TEXT,
    "corporate_number" VARCHAR(13),
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.1 offices (事業所)
CREATE TABLE IF NOT EXISTS "public"."offices" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.1b service_types (支援種別マスタ)
CREATE TABLE IF NOT EXISTS "public"."service_types" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.1ba reward_items (加算・減算項目)
CREATE TABLE IF NOT EXISTS "public"."reward_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "item_category" TEXT NOT NULL, -- ('addition', 'subtraction')
    "unit_value" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "calc_rate" NUMERIC(5,2) DEFAULT 0 NOT NULL,
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL, -- ('daily', 'monthly')
    "monthly_limit_count" INTEGER DEFAULT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.1c office_service_type_settings (事業所支援種別割当)
CREATE TABLE IF NOT EXISTS "public"."office_service_type_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "capacity" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.2 addresses (住所)
CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "postal_code_prefix" VARCHAR(3),
    "postal_code_suffix" VARCHAR(4),
    "prefecture" TEXT,
    "city" TEXT,
    "town_street" TEXT,
    "building" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.3 entity_address_settings (住所割当)
CREATE TABLE IF NOT EXISTS "public"."entity_address_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "owner_type" TEXT NOT NULL, -- ('organization', 'office', 'member', 'staff', 'partner')
    "owner_id" UUID NOT NULL,
    "address_id" UUID REFERENCES "public"."addresses"("id") ON DELETE CASCADE,
    "address_type" TEXT DEFAULT 'main' NOT NULL, -- ('main', 'home', 'billing', 'shipping')
    "is_primary" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.4 phone_numbers (電話・FAX番号)
CREATE TABLE IF NOT EXISTS "public"."phone_numbers" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "phone_type" TEXT DEFAULT 'phone' NOT NULL, -- ('phone', 'mobile', 'fax')
    "phone_number" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.5 entity_phone_settings (電話・FAX番号割当)
CREATE TABLE IF NOT EXISTS "public"."entity_phone_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "owner_type" TEXT NOT NULL, -- ('organization', 'office', 'member', 'staff', 'partner')
    "owner_id" UUID NOT NULL,
    "phone_number_id" UUID REFERENCES "public"."phone_numbers"("id") ON DELETE CASCADE,
    "label" TEXT,
    "is_emergency" BOOLEAN DEFAULT false NOT NULL,
    "is_primary" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.6 email_addresses (メールアドレス)
CREATE TABLE IF NOT EXISTS "public"."email_addresses" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.7 entity_email_settings (メールアドレス割当)
CREATE TABLE IF NOT EXISTS "public"."entity_email_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "owner_type" TEXT NOT NULL, -- ('organization', 'office', 'member', 'staff', 'partner')
    "owner_id" UUID NOT NULL,
    "email_address_id" UUID REFERENCES "public"."email_addresses"("id") ON DELETE CASCADE,
    "label" TEXT,
    "is_emergency" BOOLEAN DEFAULT false NOT NULL,
    "is_primary" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.9 wage_rate_items (工賃単価項目)
CREATE TABLE IF NOT EXISTS "public"."wage_rate_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "wage" NUMERIC(12,2) NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.10 allowance_deduction_items (加算手当・控除項目)
CREATE TABLE IF NOT EXISTS "public"."allowance_deduction_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "item_category" TEXT NOT NULL, -- ('allowance', 'deduction')
    "occurrence_type" VARCHAR(20) DEFAULT 'daily' NOT NULL, -- ('daily', 'monthly')
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.12 reserve_items (積立金項目)
CREATE TABLE IF NOT EXISTS "public"."reserve_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "calc_type" VARCHAR(20) DEFAULT 'fixed_amount' NOT NULL,
    "fixed_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "fixed_rate" NUMERIC(5,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.14 skill_items (スキル項目)
CREATE TABLE IF NOT EXISTS "public"."skill_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.15 skill_level_items (スキルレベル項目)
CREATE TABLE IF NOT EXISTS "public"."skill_level_items" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "level_value" INTEGER NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.16 auth_users (認証ユーザー)
CREATE TABLE IF NOT EXISTS "public"."auth_users" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "role" TEXT DEFAULT '職員' NOT NULL,
    "user_type" TEXT DEFAULT 'staff' NOT NULL CHECK ("user_type" IN ('staff', 'member')),
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.17 members (利用者)
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."auth_users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.18 office_member_settings (事業所利用者割当)
CREATE TABLE IF NOT EXISTS "public"."office_member_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "is_primary" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.19 member_skill_settings (利用者スキル割当)
CREATE TABLE IF NOT EXISTS "public"."member_skill_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skill_items"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_level_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.20 member_wage_settings (利用者工賃単価割当)
CREATE TABLE IF NOT EXISTS "public"."member_wage_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "wage_rate_id" UUID REFERENCES "public"."wage_rate_items"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.21 staffs (職員)
CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."auth_users"("id") ON DELETE CASCADE,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.21b qualifications (資格マスタ)
CREATE TABLE IF NOT EXISTS "public"."qualifications" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.21c staff_qualification_settings (職員資格割当)
CREATE TABLE IF NOT EXISTS "public"."staff_qualification_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "qualification_id" UUID REFERENCES "public"."qualifications"("id") ON DELETE CASCADE,
    "license_number" TEXT,
    "acquired_on" DATE,
    "valid_until" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.21d office_staff_settings (事業所職員割当)
CREATE TABLE IF NOT EXISTS "public"."office_staff_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "is_primary" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.22 partners (取引先)
CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "yomigana" TEXT,
    "contact_person" TEXT,
    "is_customer" BOOLEAN DEFAULT false NOT NULL,
    "is_subcontractor" BOOLEAN DEFAULT false NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.23 projects (案件)
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "settlement_year_month" VARCHAR(7),
    "client_id" UUID REFERENCES "public"."partners"("id") ON DELETE SET NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "project_type" TEXT DEFAULT 'one-off',
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.24 project_tasks (案件タスク)
CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "completed_at" TIMESTAMPTZ,
    "project_id" UUID REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "assignee_type" VARCHAR DEFAULT 'internal',
    "is_completed" BOOLEAN DEFAULT false NOT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.25 task_skill_settings (タスクスキル割当)
CREATE TABLE IF NOT EXISTS "public"."task_skill_settings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "skill_id" UUID REFERENCES "public"."skill_items"("id") ON DELETE CASCADE,
    "skill_level_id" UUID REFERENCES "public"."skill_level_items"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.26 task_assignee_settings (タスク担当者割当)
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

-- 1.27 project_budgets (案件予算)
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

-- 2.0 staff_attendance_records (職員勤務実績)
CREATE TABLE IF NOT EXISTS "public"."staff_attendance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL,
    "staff_id" UUID REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "work_date" DATE NOT NULL,
    "start_time" TIME,
    "end_time" TIME,
    "break_minutes" INTEGER DEFAULT 0 NOT NULL,
    "assigned_role" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.1 member_attendance_records (利用者出欠実績)
CREATE TABLE IF NOT EXISTS "public"."member_attendance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL,
    "target_period" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "status" TEXT DEFAULT 'present' NOT NULL, -- ('present', 'absent')
    "contact_date" DATE DEFAULT NULL,
    "is_absentee_supported" BOOLEAN DEFAULT false NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.2 member_work_records (利用者作業実績)
CREATE TABLE IF NOT EXISTS "public"."member_work_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE SET NULL,
    "target_period" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE,
    "work_time" NUMERIC(4,1) NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.3 allowance_records (加算手当実績)
CREATE TABLE IF NOT EXISTS "public"."allowance_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "target_period" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "allowance_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.4 deduction_records (控除実績)
CREATE TABLE IF NOT EXISTS "public"."deduction_records" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "target_period" DATE NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "deduction_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE RESTRICT,
    "quantity" NUMERIC(8,2) DEFAULT 1 NOT NULL,
    "unit_price" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.5 daily_record_closings (日次実績確定)
CREATE TABLE IF NOT EXISTS "public"."daily_record_closings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "target_period" DATE NOT NULL UNIQUE,
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
    "target_period" DATE DEFAULT CURRENT_DATE NOT NULL,
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
    "target_period" VARCHAR(7) NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "task_id" UUID REFERENCES "public"."project_tasks"("id") ON DELETE SET NULL,
    "allocation_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3.3 monthly_record_closings (月次実績確定)
CREATE TABLE IF NOT EXISTS "public"."monthly_record_closings" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "target_period" VARCHAR(7) NOT NULL UNIQUE,
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
    "target_period" DATE NOT NULL,
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
    "target_period" TEXT NOT NULL,
    "member_id" UUID REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "work_time" NUMERIC(8,2) DEFAULT 0 NOT NULL,
    "wage_rate" NUMERIC(12,2),
    "basic_wage" NUMERIC(12,2),
    "incentive_total" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "other_allowance_total" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "wage_total" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "service_fee_total" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "service_fee_copayment" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "is_copayment_limit_applied" BOOLEAN DEFAULT false NOT NULL,
    "managed_copayment_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "deduction_total" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "payment" NUMERIC(12,2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "wage_summaries_target_period_member_id_key" UNIQUE ("target_period", "member_id")
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
    "allowance_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE SET NULL,
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
    "deduction_id" UUID REFERENCES "public"."allowance_deduction_items"("id") ON DELETE SET NULL,
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
    "target_period" VARCHAR(7) NOT NULL UNIQUE,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 5. 旧テーブル名互換ビュー (Backward-Compatible Views & Triggers)
-- ==========================================

CREATE OR REPLACE VIEW "public"."users" AS 
SELECT id, email, role, user_type, deleted_at, is_deleted, created_at, updated_at 
FROM "public"."auth_users";

-- users ビューに対する INSTEAD OF トリガー (データ追加・更新透過)
CREATE OR REPLACE FUNCTION public.handle_users_view_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.auth_users (id, email, role, user_type)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.email, COALESCE(NEW.role, '職員'), COALESCE(NEW.user_type, 'staff'))
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_view_insert_trigger ON public.users;
CREATE TRIGGER users_view_insert_trigger
INSTEAD OF INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_users_view_insert();

CREATE OR REPLACE FUNCTION public.handle_users_view_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.auth_users
    SET email = NEW.email,
        role = NEW.role,
        user_type = NEW.user_type,
        deleted_at = CASE WHEN NEW.is_deleted = true THEN now() ELSE NULL END
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_view_update_trigger ON public.users;
CREATE TRIGGER users_view_update_trigger
INSTEAD OF UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_users_view_update();

CREATE OR REPLACE VIEW "public"."wage_rates" AS SELECT * FROM "public"."wage_rate_items";
CREATE OR REPLACE VIEW "public"."allowances" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE OR REPLACE VIEW "public"."deductions" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';
CREATE OR REPLACE VIEW "public"."allowance_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE OR REPLACE VIEW "public"."deduction_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';
CREATE OR REPLACE VIEW "public"."service_items" AS 
SELECT 
    id,
    '33333333-3333-3333-3333-333333333333'::uuid AS service_scheme_id,
    name,
    CASE 
        WHEN item_category = 'addition' THEN 'reward_addition'
        WHEN item_category = 'subtraction' THEN 'reward_subtraction'
        ELSE item_category 
    END AS item_category,
    occurrence_type,
    unit_value,
    calc_rate,
    CASE 
        WHEN calc_rate > 0 THEN 'rate'
        ELSE 'unit'
    END AS value_type,
    monthly_limit_count,
    true AS affects_reward_units,
    true AS is_auto_calculated,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
FROM "public"."reward_items"
UNION ALL
SELECT 
    id,
    office_id AS service_scheme_id,
    name,
    item_category,
    occurrence_type,
    unit_price AS unit_value,
    0::numeric(5,2) AS calc_rate,
    'yen'::varchar(20) AS value_type,
    NULL::integer AS monthly_limit_count,
    false AS affects_reward_units,
    false AS is_auto_calculated,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
FROM "public"."allowance_deduction_items";
CREATE OR REPLACE VIEW "public"."service_schemes" AS SELECT id, id AS office_id, name, 'type_b'::text AS service_type, '標準サービス体系'::text AS description, 580.00::numeric(12,2) AS basic_reward_unit, deleted_at, is_deleted, created_at, updated_at FROM "public"."offices";
CREATE OR REPLACE VIEW "public"."office_service_scheme_settings" AS SELECT gen_random_uuid() AS id, id AS office_id, id AS service_scheme_id, CURRENT_DATE AS valid_from, NULL::date AS valid_to, created_at, updated_at FROM "public"."offices";
CREATE OR REPLACE VIEW "public"."reserve_settings" AS SELECT * FROM "public"."reserve_items";
CREATE OR REPLACE VIEW "public"."skills" AS SELECT * FROM "public"."skill_items";
CREATE OR REPLACE VIEW "public"."skill_levels" AS SELECT * FROM "public"."skill_level_items";
CREATE OR REPLACE VIEW "public"."member_skill_evaluations" AS SELECT * FROM "public"."member_skill_settings";
CREATE OR REPLACE VIEW "public"."member_wage_evaluations" AS SELECT * FROM "public"."member_wage_settings";
CREATE OR REPLACE VIEW "public"."project_task_skills" AS SELECT * FROM "public"."task_skill_settings";
CREATE OR REPLACE VIEW "public"."project_task_assignees" AS SELECT * FROM "public"."task_assignee_settings";
CREATE OR REPLACE VIEW "public"."office_service_settings" AS SELECT gen_random_uuid() AS id, id AS office_id, id AS service_scheme_id, CURRENT_DATE AS valid_from, NULL::date AS valid_to, created_at, updated_at FROM "public"."offices";
CREATE OR REPLACE VIEW "public"."staff_work_records" AS SELECT * FROM "public"."staff_attendance_records";
CREATE OR REPLACE VIEW "public"."attendance_records" AS SELECT * FROM "public"."member_attendance_records";
CREATE OR REPLACE VIEW "public"."work_records" AS SELECT * FROM "public"."member_work_records";
CREATE OR REPLACE VIEW "public"."daily_work_records" AS SELECT * FROM "public"."member_work_records";
CREATE OR REPLACE VIEW "public"."daily_allowance_records" AS SELECT * FROM "public"."allowance_records";
CREATE OR REPLACE VIEW "public"."daily_deduction_records" AS SELECT * FROM "public"."deduction_records";
CREATE OR REPLACE VIEW "public"."daily_work_confirmations" AS SELECT * FROM "public"."daily_record_closings";
CREATE OR REPLACE VIEW "public"."financial_records" AS SELECT * FROM "public"."general_financial_details";
CREATE OR REPLACE VIEW "public"."daily_financial_records" AS SELECT * FROM "public"."general_financial_details";
CREATE OR REPLACE VIEW "public"."monthly_incentive_records" AS SELECT * FROM "public"."incentive_records";
CREATE OR REPLACE VIEW "public"."monthly_incentive_confirmations" AS SELECT * FROM "public"."monthly_record_closings";
CREATE OR REPLACE VIEW "public"."monthly_wage_confirmations" AS SELECT * FROM "public"."monthly_record_closings";
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
