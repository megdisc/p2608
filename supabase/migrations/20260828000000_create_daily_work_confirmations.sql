-- 日次作業確定テーブル (daily_work_confirmations) の作成
CREATE TABLE IF NOT EXISTS "public"."daily_work_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 既存の daily_work_records から確定済み日付データを移行
INSERT INTO "public"."daily_work_confirmations" ("date", "is_confirmed", "confirmed_by", "confirmed_at")
SELECT DISTINCT "date", true, "confirmed_by", COALESCE("confirmed_at", now())
FROM "public"."daily_work_records"
WHERE "is_confirmed" = true
ON CONFLICT ("date") DO NOTHING;

-- daily_work_records テーブルから確定関連カラムを削除
ALTER TABLE "public"."daily_work_records" DROP COLUMN IF EXISTS "is_confirmed";
ALTER TABLE "public"."daily_work_records" DROP COLUMN IF EXISTS "confirmed_by";
ALTER TABLE "public"."daily_work_records" DROP COLUMN IF EXISTS "confirmed_at";
