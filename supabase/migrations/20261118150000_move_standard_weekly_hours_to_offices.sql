-- 20261118150000_move_standard_weekly_hours_to_offices.sql
-- 1. 事業所テーブル (offices) に常勤週所定労働時間 (standard_weekly_hours) を追加
-- 2. 支援種別詳細 (office_service_type_setting_details) から不要カラムを整理し、後方互換ビューを更新

-- 1. offices テーブルに standard_weekly_hours を追加
ALTER TABLE "public"."offices"
ADD COLUMN IF NOT EXISTS "standard_weekly_hours" NUMERIC(4,2) DEFAULT 40.00;

COMMENT ON COLUMN "public"."offices"."standard_weekly_hours" IS '常勤週所定労働時間（就業規則上の基準週労働時間。常勤換算数の分母。デフォルト40.00時間）';

-- 2. office_service_type_setting_details のカラム整理
-- ※ wage_achievement_tier, prior_year_average_users, standard_weekly_hours は支援種別設定からは手入力不要化
-- 既存データを保護するためカラム自体は残しつつ、ビュー定義を認可スペックに特化させる

CREATE OR REPLACE VIEW "public"."office_service_type_settings" AS
SELECT
    d."id",
    s."office_id",
    d."service_type_id",
    d."capacity",
    d."office_number",
    d."staffing_ratio",
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
        id, summary_id, service_type_id, capacity, office_number, staffing_ratio, is_deleted, deleted_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        v_summary_id,
        NEW.service_type_id,
        COALESCE(NEW.capacity, 0),
        NEW.office_number,
        NEW.staffing_ratio,
        COALESCE(NEW.is_deleted, false),
        NEW.deleted_at
    )
    ON CONFLICT (id) DO UPDATE SET
        service_type_id = EXCLUDED.service_type_id,
        capacity = EXCLUDED.capacity,
        office_number = EXCLUDED.office_number,
        staffing_ratio = EXCLUDED.staffing_ratio,
        is_deleted = EXCLUDED.is_deleted,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
