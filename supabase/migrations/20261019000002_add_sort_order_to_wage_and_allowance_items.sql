-- Migration: Add sort_order to wage_rate_items and allowance_deduction_items
-- Also recreate views to include the new sort_order column

ALTER TABLE "public"."wage_rate_items" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "public"."allowance_deduction_items" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0 NOT NULL;

-- Drop views before recreation to avoid column position/type change errors
DROP VIEW IF EXISTS "public"."wage_rates";
DROP VIEW IF EXISTS "public"."allowances";
DROP VIEW IF EXISTS "public"."deductions";
DROP VIEW IF EXISTS "public"."allowance_items";
DROP VIEW IF EXISTS "public"."deduction_items";

CREATE VIEW "public"."wage_rates" AS SELECT * FROM "public"."wage_rate_items";
CREATE VIEW "public"."allowances" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE VIEW "public"."deductions" AS SELECT *, (deleted_at IS NULL) AS is_active FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';
CREATE VIEW "public"."allowance_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'allowance';
CREATE VIEW "public"."deduction_items" AS SELECT * FROM "public"."allowance_deduction_items" WHERE item_category = 'deduction';
