-- ==============================================================================
-- 20261026000000_add_actual_work_hours_to_staff_attendance_records.sql
-- 職員勤務実績テーブルに実労働時間（自動計算結果記録用）カラムを追加
-- ==============================================================================

-- 1. staff_attendance_records (職員勤務実績) に actual_work_hours を追加
ALTER TABLE "public"."staff_attendance_records" 
ADD COLUMN IF NOT EXISTS "actual_work_hours" NUMERIC(4,2) DEFAULT NULL;

-- 2. 既存レコードの実労働時間を start_time, end_time, break_minutes より遡及計算して更新
UPDATE "public"."staff_attendance_records"
SET "actual_work_hours" = ROUND(
  GREATEST(
    0,
    (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) - (COALESCE(break_minutes, 0) / 60.0)
  )::numeric,
  2
)
WHERE start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time;

-- 3. ビュー staff_work_records の再定義
CREATE OR REPLACE VIEW "public"."staff_work_records" AS 
SELECT * FROM "public"."staff_attendance_records";
