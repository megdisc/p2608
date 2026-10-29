-- ==============================================================================
-- 20261029000000_add_remarks_to_staff_attendance_records.sql
-- 職員勤務実績テーブル (staff_attendance_records) に備考・特記事項カラム (remarks) を追加
-- ==============================================================================

-- 1. staff_attendance_records に remarks カラムを追加
ALTER TABLE "public"."staff_attendance_records" 
ADD COLUMN IF NOT EXISTS "remarks" TEXT DEFAULT NULL;

-- 2. 論理名コメント
COMMENT ON COLUMN "public"."staff_attendance_records"."remarks" IS '備考・特記事項';

-- 3. ビュー staff_work_records の再定義
CREATE OR REPLACE VIEW "public"."staff_work_records" AS 
SELECT * FROM "public"."staff_attendance_records";

