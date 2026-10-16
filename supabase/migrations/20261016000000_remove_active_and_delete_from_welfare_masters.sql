-- 福祉制度関連マスターテーブルから適用フラグおよび論理削除カラムを削除

-- 1. service_types (支援種別マスタ) から is_active を削除
ALTER TABLE "public"."service_types" DROP COLUMN IF EXISTS "is_active";

-- 2. 依存する service_items ビューを一旦 DROP
DROP VIEW IF EXISTS "public"."service_items";

-- reward_items (加算・減算項目マスタ) から is_deleted, deleted_at, is_active を削除
ALTER TABLE "public"."reward_items" DROP COLUMN IF EXISTS "is_deleted";
ALTER TABLE "public"."reward_items" DROP COLUMN IF EXISTS "deleted_at";
ALTER TABLE "public"."reward_items" DROP COLUMN IF EXISTS "is_active";

-- service_items ビューを再作成
CREATE OR REPLACE VIEW "public"."service_items" AS 
SELECT 
    id,
    '33333333-3333-3333-3333-333333333333'::uuid AS service_scheme_id,
    name,
    CASE 
        WHEN item_category = 'addition' THEN 'reward_addition'
        WHEN item_category = 'subtraction' THEN 'reward_subtraction'
        ELSE item_category 
    END AS item_category,
    occurrence_type,
    unit_value,
    calc_rate,
    CASE 
        WHEN calc_rate > 0 THEN 'rate'
        ELSE 'unit'
    END AS value_type,
    monthly_limit_count,
    true AS affects_reward_units,
    true AS is_auto_calculated,
    NULL::timestamptz AS deleted_at,
    false AS is_deleted,
    created_at,
    updated_at
FROM "public"."reward_items"
UNION ALL
SELECT 
    id,
    office_id AS service_scheme_id,
    name,
    item_category,
    occurrence_type,
    unit_price AS unit_value,
    0::numeric(5,2) AS calc_rate,
    'yen'::varchar(20) AS value_type,
    NULL::integer AS monthly_limit_count,
    false AS affects_reward_units,
    false AS is_auto_calculated,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
FROM "public"."allowance_deduction_items";

-- 3. qualifications (資格マスタ) から is_active を削除
ALTER TABLE "public"."qualifications" DROP COLUMN IF EXISTS "is_active";
