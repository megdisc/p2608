-- Migration: Remove unit_price from offices table
-- Regional unit prices are now managed per service type in office_service_type_settings (unit_price_per_point)

ALTER TABLE "public"."offices" DROP COLUMN IF EXISTS "unit_price";
