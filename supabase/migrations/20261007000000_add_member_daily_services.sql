-- ==========================================
-- member_daily_services テーブルを削除し、
-- member_attendance_records (利用者出欠実績) に食事・送迎フラグを統合
-- ==========================================

-- 1. 不要となった member_daily_services 及び daily_service_records ビューの削除
DROP VIEW IF EXISTS "public"."daily_service_records";
DROP TABLE IF EXISTS "public"."member_daily_services" CASCADE;

-- 2. member_attendance_records テーブルへのカラム追加
ALTER TABLE "public"."member_attendance_records" 
ADD COLUMN IF NOT EXISTS "has_meal" BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "has_pickup" BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "has_dropoff" BOOLEAN DEFAULT false NOT NULL;

-- 3. target_period, member_id のユニーク制約追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'member_attendance_records_target_period_member_id_key'
    ) THEN
        ALTER TABLE "public"."member_attendance_records" 
        ADD CONSTRAINT "member_attendance_records_target_period_member_id_key" UNIQUE ("target_period", "member_id");
    END IF;
END $$;
