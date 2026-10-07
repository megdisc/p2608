-- ==========================================
-- allowance_deduction_items (加算手当・控除項目) カラムの細分化
-- ==========================================

ALTER TABLE "public"."allowance_deduction_items"
ADD COLUMN IF NOT EXISTS "calc_trigger_basis" VARCHAR(30) DEFAULT 'manual' NOT NULL,
ADD COLUMN IF NOT EXISTS "threshold_value" NUMERIC(8,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "threshold_unit" VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "threshold_operator" VARCHAR(20) DEFAULT NULL;

DROP VIEW IF EXISTS "public"."allowances" CASCADE;
DROP VIEW IF EXISTS "public"."deductions" CASCADE;
DROP VIEW IF EXISTS "public"."allowance_items" CASCADE;
DROP VIEW IF EXISTS "public"."deduction_items" CASCADE;

CREATE OR REPLACE VIEW "public"."allowances" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE OR REPLACE VIEW "public"."deductions" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';
CREATE OR REPLACE VIEW "public"."allowance_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE OR REPLACE VIEW "public"."deduction_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';

