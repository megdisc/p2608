-- reserve_items から occurrence_type, default_unit_price, deleted_at, is_deleted カラムを削除し、calc_type, fixed_amount, fixed_rate カラムを追加
ALTER TABLE "public"."reserve_items" 
  DROP COLUMN IF EXISTS "occurrence_type",
  DROP COLUMN IF EXISTS "default_unit_price",
  DROP COLUMN IF EXISTS "deleted_at",
  DROP COLUMN IF EXISTS "is_deleted",
  ADD COLUMN IF NOT EXISTS "calc_type" VARCHAR(20) DEFAULT 'fixed_amount' NOT NULL,
  ADD COLUMN IF NOT EXISTS "fixed_amount" NUMERIC(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "fixed_rate" NUMERIC(5,2) DEFAULT 0 NOT NULL;

CREATE OR REPLACE VIEW "public"."reserve_settings" AS SELECT * FROM "public"."reserve_items";
