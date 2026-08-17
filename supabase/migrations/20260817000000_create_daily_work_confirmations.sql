-- ==========================================
-- 日次作業記録の確定状態管理テーブル
-- ==========================================

CREATE TABLE IF NOT EXISTS "public"."daily_work_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "work_date" DATE NOT NULL,
    "confirmed_by" UUID,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "daily_work_confirmations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "daily_work_confirmations_work_date_key" UNIQUE ("work_date")
);

ALTER TABLE "public"."daily_work_confirmations" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."daily_work_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."daily_work_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_work_confirmations" TO "service_role";
