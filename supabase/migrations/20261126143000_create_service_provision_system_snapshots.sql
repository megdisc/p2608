-- 20261126143000_create_service_provision_system_snapshots.sql
-- 1. サービス提供体制スナップショットテーブル (service_provision_system_snapshot) 新設
-- 2. 職種別配置内訳スナップショットテーブル (service_provision_system_snapshot_details) 新設
-- 3. office_service_type_setting_details から手入力用の不要カラム (staffing_ratio, wage_achievement_tier, prior_year_average_users) を削除
-- 4. 後方互換ビュー office_service_type_settings およびトリガーを更新

-- 1. service_provision_system_snapshot
CREATE TABLE IF NOT EXISTS "public"."service_provision_system_snapshot" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "office_id" UUID REFERENCES "public"."offices"("id") ON DELETE CASCADE NOT NULL,
    "service_type_id" UUID REFERENCES "public"."service_types"("id") ON DELETE CASCADE NOT NULL,
    "target_period" VARCHAR(7) NOT NULL, -- YYYY-MM
    "target_year" VARCHAR(4) NOT NULL,   -- YYYY
    "operating_days" INTEGER DEFAULT 0 NOT NULL,
    "total_utilization" INTEGER DEFAULT 0 NOT NULL,
    "avg_members_per_day" NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    "previous_year_avg_members" NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    "capacity" INTEGER DEFAULT 20 NOT NULL,
    "capacity_tier_id" UUID REFERENCES "public"."capacity_tiers"("id") ON DELETE SET NULL,
    "is_capacity_excess" BOOLEAN DEFAULT false NOT NULL,
    "direct_care_work_hours" NUMERIC(8,2) DEFAULT 0.00 NOT NULL,
    "standard_monthly_hours" NUMERIC(8,2) DEFAULT 160.00 NOT NULL,
    "direct_care_fte" NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    "has_full_time_direct_care" BOOLEAN DEFAULT true NOT NULL,
    "actual_staffing_ratio" NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    "determined_staffing_ratio" VARCHAR(50) DEFAULT '7.5:1配置' NOT NULL,
    "staffing_ratio_tier_id" UUID REFERENCES "public"."staffing_ratio_tiers"("id") ON DELETE SET NULL,
    "is_staffing_shortage" BOOLEAN DEFAULT false NOT NULL,
    "annual_average_wage" INTEGER DEFAULT 0 NOT NULL,
    "wage_achievement_tier_id" UUID REFERENCES "public"."wage_achievement_tiers"("id") ON DELETE SET NULL,
    "determined_wage_tier" VARCHAR(100),
    "status" VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK ("status" IN ('draft', 'confirmed')),
    "confirmed_by" UUID REFERENCES "public"."staff"("id") ON DELETE SET NULL,
    "confirmed_at" TIMESTAMPTZ,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "uq_service_provision_snapshot_period" UNIQUE ("office_id", "service_type_id", "target_period")
);

CREATE INDEX IF NOT EXISTS "idx_service_provision_snapshot_lookup"
ON "public"."service_provision_system_snapshot"("office_id", "target_period");

ALTER TABLE "public"."service_provision_system_snapshot" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_provision_system_snapshot";
CREATE POLICY "Allow all access" ON "public"."service_provision_system_snapshot" FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE "public"."service_provision_system_snapshot" IS 'サービス提供体制スナップショット（自動算定された人員配置・稼働・報酬算定基準の正本記録）';

-- 2. service_provision_system_snapshot_details
CREATE TABLE IF NOT EXISTS "public"."service_provision_system_snapshot_details" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "summary_id" UUID REFERENCES "public"."service_provision_system_snapshot"("id") ON DELETE CASCADE NOT NULL,
    "staff_role_id" UUID REFERENCES "public"."staff_roles"("id") ON DELETE SET NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "is_direct_care" BOOLEAN DEFAULT false NOT NULL,
    "total_actual_hours" NUMERIC(8,2) DEFAULT 0.00 NOT NULL,
    "fte_value" NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    "full_time_count" INTEGER DEFAULT 0 NOT NULL,
    "part_time_count" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_service_provision_details_summary"
ON "public"."service_provision_system_snapshot_details"("summary_id");

ALTER TABLE "public"."service_provision_system_snapshot_details" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."service_provision_system_snapshot_details";
CREATE POLICY "Allow all access" ON "public"."service_provision_system_snapshot_details" FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE "public"."service_provision_system_snapshot_details" IS 'サービス提供体制スナップショット明細（職種別配置・実労働時間・FTE内訳）';

-- 3. office_service_type_setting_details から直接入力カラムを削除
ALTER TABLE "public"."office_service_type_setting_details"
DROP COLUMN IF EXISTS "staffing_ratio",
DROP COLUMN IF EXISTS "wage_achievement_tier",
DROP COLUMN IF EXISTS "prior_year_average_users";

-- 4. office_service_type_settings ビューの再作成（staffing_ratio 除去）
CREATE OR REPLACE VIEW "public"."office_service_type_settings" AS
SELECT
    d."id",
    s."office_id",
    d."service_type_id",
    d."capacity",
    d."office_number",
    d."is_deleted",
    d."deleted_at",
    s."valid_from",
    s."valid_to",
    d."created_at",
    d."updated_at"
FROM "public"."office_service_type_setting_details" d
JOIN "public"."office_service_type_setting_summaries" s ON s."id" = d."summary_id";

-- トリガー関数の再作成（staffing_ratio 除去）
CREATE OR REPLACE FUNCTION public.handle_office_service_type_settings_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT id INTO v_summary_id
    FROM public.office_service_type_setting_summaries
    WHERE office_id = NEW.office_id
      AND valid_from <= CURRENT_DATE
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO public.office_service_type_setting_summaries (office_id, valid_from, valid_to)
        VALUES (NEW.office_id, COALESCE(NEW.valid_from, '2024-04-01'), NEW.valid_to)
        RETURNING id INTO v_summary_id;
    ELSIF NEW.valid_from IS NOT NULL OR NEW.valid_to IS NOT NULL THEN
        UPDATE public.office_service_type_setting_summaries
        SET valid_from = COALESCE(NEW.valid_from, valid_from),
            valid_to = NEW.valid_to,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_summary_id;
    END IF;

    INSERT INTO public.office_service_type_setting_details (
        id, summary_id, service_type_id, capacity, office_number, is_deleted, deleted_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        v_summary_id,
        NEW.service_type_id,
        COALESCE(NEW.capacity, 0),
        NEW.office_number,
        COALESCE(NEW.is_deleted, false),
        NEW.deleted_at
    )
    ON CONFLICT (id) DO UPDATE SET
        service_type_id = EXCLUDED.service_type_id,
        capacity = EXCLUDED.capacity,
        office_number = EXCLUDED.office_number,
        is_deleted = EXCLUDED.is_deleted,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
