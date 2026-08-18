-- ==========================================
-- 20260818000000_create_monthly_wage_records_and_confirmations.sql
-- 工賃・控除明細レコードテーブルおよび確定管理テーブル作成、収支記録への事業区分追加
-- ==========================================

-- 1. 工賃・控除明細記録テーブル
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "year_month" text NOT NULL,
    "member_id" "uuid" NOT NULL REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "work_time" numeric DEFAULT 0 NOT NULL,
    "wage_rate" numeric,
    "basic_wage" integer,
    "incentive_total" integer DEFAULT 0 NOT NULL,
    "wage_total" integer DEFAULT 0 NOT NULL,
    "deduction_total" integer DEFAULT 0 NOT NULL,
    "payment" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monthly_wage_records_year_month_member_id_key" UNIQUE ("year_month", "member_id")
);

ALTER TABLE "public"."monthly_wage_records" OWNER TO "postgres";
GRANT ALL ON TABLE "public"."monthly_wage_records" TO "anon";
GRANT ALL ON TABLE "public"."monthly_wage_records" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_wage_records" TO "service_role";

-- 2. 工賃・控除確定状況テーブル
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_confirmations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "year_month" text NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."monthly_wage_confirmations" OWNER TO "postgres";
GRANT ALL ON TABLE "public"."monthly_wage_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."monthly_wage_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_wage_confirmations" TO "service_role";

-- 3. 収支記録テーブルへの事業区分カラム追加 (production: 生産活動 / welfare: 福祉事業)
ALTER TABLE "public"."financial_records" 
ADD COLUMN IF NOT EXISTS "activity_category" text DEFAULT 'production' NOT NULL CHECK ("activity_category" IN ('production', 'welfare'));
