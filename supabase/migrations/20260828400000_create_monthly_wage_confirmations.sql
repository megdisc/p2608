-- 月次工賃確定テーブル (monthly_wage_confirmations) の作成
CREATE TABLE IF NOT EXISTS "public"."monthly_wage_confirmations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "year_month" VARCHAR(7) NOT NULL UNIQUE,
    "is_confirmed" BOOLEAN DEFAULT true NOT NULL,
    "confirmed_by" UUID REFERENCES "public"."staffs"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS の有効化とポリシー設定
ALTER TABLE "public"."monthly_wage_confirmations" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."monthly_wage_confirmations";
CREATE POLICY "Allow all access" ON "public"."monthly_wage_confirmations" FOR ALL USING (true) WITH CHECK (true);

-- 既存の monthly_wage_records から確定済み年月データを移行
INSERT INTO "public"."monthly_wage_confirmations" ("year_month", "is_confirmed", "confirmed_by", "confirmed_at")
SELECT DISTINCT "year_month", true, "confirmed_by", COALESCE("confirmed_at", now())
FROM "public"."monthly_wage_records"
WHERE "is_confirmed" = true
ON CONFLICT ("year_month") DO NOTHING;

-- monthly_wage_records から不要な確定関連カラムを削除
ALTER TABLE "public"."monthly_wage_records" DROP COLUMN IF EXISTS "is_confirmed";
ALTER TABLE "public"."monthly_wage_records" DROP COLUMN IF EXISTS "confirmed_by";
ALTER TABLE "public"."monthly_wage_records" DROP COLUMN IF EXISTS "confirmed_at";
