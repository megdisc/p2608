-- 20261118140000_add_valid_periods_and_reward_calc_columns.sql
-- 1. 福祉制度系マスタへの適用期間カラム (valid_from, valid_to) 追加
-- 2. 基本報酬告示マスタ (base_reward_items) 新設
-- 3. 施設・支援種別割当への常勤週労働時間・前年度平均利用者数カラム追加
-- 4. 職員職種割当詳細への職種別週割当時間カラム追加

-- ------------------------------------------------------------------------------
-- 1. 福祉制度系マスタへの valid_from, valid_to 追加
-- ------------------------------------------------------------------------------

-- 1.1 支援種別 (service_types)
ALTER TABLE "public"."service_types"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2006-10-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."service_types"."valid_from" IS '適用開始年月日（制度施行・新設日）';
COMMENT ON COLUMN "public"."service_types"."valid_to" IS '適用終了年月日（制度廃止日。NULL: 継続中）';

-- 1.2 加算・減算 (reward_items)
ALTER TABLE "public"."reward_items"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2024-04-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."reward_items"."valid_from" IS '適用開始年月日（報酬改定施行日）';
COMMENT ON COLUMN "public"."reward_items"."valid_to" IS '適用終了年月日（改定による廃止日。NULL: 継続中）';

-- 1.3 資格 (qualifications)
ALTER TABLE "public"."qualifications"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2006-10-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."qualifications"."valid_from" IS '適用開始年月日（資格・研修新設施行日）';
COMMENT ON COLUMN "public"."qualifications"."valid_to" IS '適用終了年月日（資格・研修廃止日。NULL: 継続中）';

-- 1.4 職種 (staff_roles)
ALTER TABLE "public"."staff_roles"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2006-10-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."staff_roles"."valid_from" IS '適用開始年月日（公定職種新設施行日）';
COMMENT ON COLUMN "public"."staff_roles"."valid_to" IS '適用終了年月日（職種廃止日。NULL: 継続中）';

-- 1.5 所在地級数上乗せ割合 (regional_grade_rates)
ALTER TABLE "public"."regional_grade_rates"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2024-04-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."regional_grade_rates"."valid_from" IS '適用開始年月日（報酬改定施行日）';
COMMENT ON COLUMN "public"."regional_grade_rates"."valid_to" IS '適用終了年月日（改定による終了日。NULL: 継続中）';

-- 1.6 所在地級数地域 (regional_grade_locations)
ALTER TABLE "public"."regional_grade_locations"
ADD COLUMN IF NOT EXISTS "valid_from" DATE DEFAULT '2024-04-01',
ADD COLUMN IF NOT EXISTS "valid_to" DATE DEFAULT NULL;

COMMENT ON COLUMN "public"."regional_grade_locations"."valid_from" IS '適用開始年月日（自治体指定・合併施行日）';
COMMENT ON COLUMN "public"."regional_grade_locations"."valid_to" IS '適用終了年月日（自治体合併等による終了日。NULL: 継続中）';


-- ------------------------------------------------------------------------------
-- 2. 基本報酬告示マスタ (base_reward_items) 新設
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."base_reward_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "service_type_id" UUID NOT NULL REFERENCES "public"."service_types"("id") ON DELETE CASCADE,
    "capacity_tier" VARCHAR(50) NOT NULL DEFAULT '20人以下',
    "staffing_ratio" VARCHAR(50) NOT NULL DEFAULT '7.5:1',
    "wage_achievement_tier" VARCHAR(50) NOT NULL DEFAULT '4万5千円以上',
    "base_units" INTEGER NOT NULL DEFAULT 584,
    "valid_from" DATE NOT NULL DEFAULT '2024-04-01',
    "valid_to" DATE DEFAULT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."base_reward_items" IS '基本報酬告示マスタ（法令・報酬告示に基づく公定基本単位数）';
COMMENT ON COLUMN "public"."base_reward_items"."id" IS '基本報酬ID';
COMMENT ON COLUMN "public"."base_reward_items"."service_type_id" IS '所属支援種別ID';
COMMENT ON COLUMN "public"."base_reward_items"."capacity_tier" IS '利用定員規模区分（20人以下, 21〜40人 等）';
COMMENT ON COLUMN "public"."base_reward_items"."staffing_ratio" IS '人員配置基準区分（7.5:1, 10:1 等）';
COMMENT ON COLUMN "public"."base_reward_items"."wage_achievement_tier" IS '平均工賃月額達成区分';
COMMENT ON COLUMN "public"."base_reward_items"."base_units" IS '基本単位数（1日あたり公定単位数）';
COMMENT ON COLUMN "public"."base_reward_items"."valid_from" IS '適用開始年月日（報酬改定施行日）';
COMMENT ON COLUMN "public"."base_reward_items"."valid_to" IS '適用終了年月日（改定による終了日。NULL: 適用中）';

CREATE INDEX IF NOT EXISTS "idx_base_reward_items_lookup"
ON "public"."base_reward_items"("service_type_id", "capacity_tier", "staffing_ratio", "wage_achievement_tier", "valid_from");

ALTER TABLE "public"."base_reward_items" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."base_reward_items";
CREATE POLICY "Allow all access" ON "public"."base_reward_items" FOR ALL USING (true) WITH CHECK (true);

-- 就労継続支援B型の代表的な令和6年改定基本報酬データの初期シード
DO $$
DECLARE
    v_b_type_id UUID;
BEGIN
    SELECT id INTO v_b_type_id FROM public.service_types WHERE code = '21' LIMIT 1;
    IF v_b_type_id IS NOT NULL THEN
        INSERT INTO public.base_reward_items (service_type_id, capacity_tier, staffing_ratio, wage_achievement_tier, base_units, valid_from)
        VALUES
            (v_b_type_id, '20人以下', '7.5:1', '4万5千円以上', 584, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '4万円以上4万5千円未満', 554, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '3万5千円以上4万円未満', 531, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '3万円以上3万5千円未満', 508, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '2万5千円以上3万円未満', 485, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '2万円以上2万5千円未満', 462, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '1万5千円以上2万円未満', 439, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '1万円以上1万5千円未満', 416, '2024-04-01'),
            (v_b_type_id, '20人以下', '7.5:1', '1万円未満', 393, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '4万5千円以上', 520, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '4万円以上4万5千円未満', 490, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '3万5千円以上4万円未満', 467, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '3万円以上3万5千円未満', 444, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '2万5千円以上3万円未満', 421, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '2万円以上2万5千円未満', 398, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '1万5千円以上2万円未満', 375, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '1万円以上1万5千円未満', 352, '2024-04-01'),
            (v_b_type_id, '20人以下', '10:1', '1万円未満', 329, '2024-04-01')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 3. 施設・支援種別割当への算定用カラム追加 (standard_weekly_hours, prior_year_average_users)
-- ------------------------------------------------------------------------------

ALTER TABLE "public"."office_service_type_setting_details"
ADD COLUMN IF NOT EXISTS "standard_weekly_hours" NUMERIC(4,2) DEFAULT 40.00,
ADD COLUMN IF NOT EXISTS "prior_year_average_users" NUMERIC(5,2) DEFAULT 20.00;

COMMENT ON COLUMN "public"."office_service_type_setting_details"."standard_weekly_hours" IS '常勤週所定労働時間（常勤換算数の分母。例: 40.00）';
COMMENT ON COLUMN "public"."office_service_type_setting_details"."prior_year_average_users" IS '前年度平均利用者数（直接処遇職員必要数・定員超過減算判定の基礎値。例: 18.50）';

-- 後方互換ビュー office_service_type_settings の再作成
CREATE OR REPLACE VIEW "public"."office_service_type_settings" AS
SELECT
    d."id",
    s."office_id",
    d."service_type_id",
    d."capacity",
    d."office_number",
    d."staffing_ratio",
    d."wage_achievement_tier",
    d."standard_weekly_hours",
    d."prior_year_average_users",
    d."is_deleted",
    d."deleted_at",
    s."valid_from",
    s."valid_to",
    d."created_at",
    d."updated_at"
FROM "public"."office_service_type_setting_details" d
JOIN "public"."office_service_type_setting_summaries" s ON s."id" = d."summary_id";

-- トリガーの再作成
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
        id, summary_id, service_type_id, capacity, office_number, staffing_ratio, wage_achievement_tier, standard_weekly_hours, prior_year_average_users, is_deleted, deleted_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        v_summary_id,
        NEW.service_type_id,
        COALESCE(NEW.capacity, 0),
        NEW.office_number,
        NEW.staffing_ratio,
        NEW.wage_achievement_tier,
        COALESCE(NEW.standard_weekly_hours, 40.00),
        COALESCE(NEW.prior_year_average_users, 20.00),
        COALESCE(NEW.is_deleted, false),
        NEW.deleted_at
    )
    ON CONFLICT (id) DO UPDATE SET
        service_type_id = EXCLUDED.service_type_id,
        capacity = EXCLUDED.capacity,
        office_number = EXCLUDED.office_number,
        staffing_ratio = EXCLUDED.staffing_ratio,
        wage_achievement_tier = EXCLUDED.wage_achievement_tier,
        standard_weekly_hours = EXCLUDED.standard_weekly_hours,
        prior_year_average_users = EXCLUDED.prior_year_average_users,
        is_deleted = EXCLUDED.is_deleted,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------------------------
-- 4. 職員職種割当詳細への算定用カラム追加 (allocated_hours)
-- ------------------------------------------------------------------------------

ALTER TABLE "public"."staff_role_setting_details"
ADD COLUMN IF NOT EXISTS "allocated_hours" NUMERIC(4,2) DEFAULT NULL;

COMMENT ON COLUMN "public"."staff_role_setting_details"."allocated_hours" IS '職種別週割当時間（複数職種兼務時の直接処遇時間按分用）';
