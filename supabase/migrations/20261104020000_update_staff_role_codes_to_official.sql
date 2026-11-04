-- ==============================================================================
-- 20261104020000_update_staff_role_codes_to_official.sql
-- 職種コードを公定の2桁数字コード（障害福祉指定・体制届出基準）へ更新
-- ==============================================================================

-- 1. staff_roles マスタのコード更新
UPDATE "public"."staff_roles" SET "code" = '01' WHERE "code" = 'manager';
UPDATE "public"."staff_roles" SET "code" = '02' WHERE "code" = 'service_admin';
UPDATE "public"."staff_roles" SET "code" = '03' WHERE "code" = 'vocational_instructor';
UPDATE "public"."staff_roles" SET "code" = '04' WHERE "code" = 'life_supporter';
UPDATE "public"."staff_roles" SET "code" = '05' WHERE "code" = 'target_evaluator';
UPDATE "public"."staff_roles" SET "code" = '06' WHERE "code" = 'employment_supporter';
UPDATE "public"."staff_roles" SET "code" = '07' WHERE "code" = 'peer_supporter';

-- 2. staff_role_details（詳細・孫テーブル）のコード更新
UPDATE "public"."staff_role_details" SET "staff_role" = '01' WHERE "staff_role" = 'manager';
UPDATE "public"."staff_role_details" SET "staff_role" = '02' WHERE "staff_role" = 'service_admin';
UPDATE "public"."staff_role_details" SET "staff_role" = '03' WHERE "staff_role" = 'vocational_instructor';
UPDATE "public"."staff_role_details" SET "staff_role" = '04' WHERE "staff_role" = 'life_supporter';
UPDATE "public"."staff_role_details" SET "staff_role" = '05' WHERE "staff_role" = 'target_evaluator';
UPDATE "public"."staff_role_details" SET "staff_role" = '06' WHERE "staff_role" = 'employment_supporter';
UPDATE "public"."staff_role_details" SET "staff_role" = '07' WHERE "staff_role" = 'peer_supporter';

-- 3. staff_attendance_records（勤務記録）の配置職種コード更新
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '01' WHERE "assigned_role" = 'manager';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '02' WHERE "assigned_role" = 'service_admin';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '03' WHERE "assigned_role" = 'vocational_instructor';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '04' WHERE "assigned_role" = 'life_supporter';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '05' WHERE "assigned_role" = 'target_evaluator';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '06' WHERE "assigned_role" = 'employment_supporter';
UPDATE "public"."staff_attendance_records" SET "assigned_role" = '07' WHERE "assigned_role" = 'peer_supporter';

