-- Add soft delete columns to office_service_type_settings
ALTER TABLE "public"."office_service_type_settings"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN GENERATED ALWAYS AS (deleted_at IS NOT NULL) STORED;

CREATE INDEX IF NOT EXISTS "idx_office_service_type_settings_is_deleted" 
ON "public"."office_service_type_settings"("is_deleted");
