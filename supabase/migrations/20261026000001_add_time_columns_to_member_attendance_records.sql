-- ==============================================================================
-- 20261026000001_add_time_columns_to_member_attendance_records.sql
-- 利用者出欠実績テーブルに提供開始・終了時刻および休憩時間カラムを追加
-- ==============================================================================

-- 1. member_attendance_records (利用者出欠実績) に start_time, end_time, break_minutes を追加
ALTER TABLE "public"."member_attendance_records" 
ADD COLUMN IF NOT EXISTS "start_time" TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "end_time" TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "break_minutes" INTEGER DEFAULT 0 NOT NULL;

-- 2. 既存の通所レコードに対して標準提供時間（09:30〜15:30、休憩60分、実提供時間5.00時間）を補完
UPDATE "public"."member_attendance_records"
SET 
  "start_time" = '09:30:00'::time,
  "end_time" = '15:30:00'::time,
  "break_minutes" = 60,
  "service_hours" = 5.00
WHERE (status = 'present' OR status = '通所利用') AND start_time IS NULL;

-- 3. ビュー attendance_records の再定義
CREATE OR REPLACE VIEW "public"."attendance_records" AS 
SELECT * FROM "public"."member_attendance_records";
