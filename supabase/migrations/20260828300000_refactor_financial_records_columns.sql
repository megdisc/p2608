-- 収支記録テーブル (financial_records) から不要な is_limited カラムを削除
ALTER TABLE "public"."financial_records" DROP COLUMN IF EXISTS "is_limited";

-- 製造原価と販売費及び一般管理費 (販管費) を区分する cost_category カラムを追加
ALTER TABLE "public"."financial_records" 
    ADD COLUMN IF NOT EXISTS "cost_category" TEXT DEFAULT 'manufacturing' NOT NULL CHECK ("cost_category" IN ('manufacturing', 'sga'));
