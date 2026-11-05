-- Migration: Add INSTEAD OF triggers for office settings views to support seamless INSERT, UPDATE, DELETE

-- 1. office_service_type_settings
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
        id, summary_id, service_type_id, capacity, office_number, staffing_ratio, wage_achievement_tier, is_deleted, deleted_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        v_summary_id,
        NEW.service_type_id,
        COALESCE(NEW.capacity, 0),
        NEW.office_number,
        NEW.staffing_ratio,
        NEW.wage_achievement_tier,
        COALESCE(NEW.is_deleted, false),
        NEW.deleted_at
    )
    ON CONFLICT (id) DO UPDATE SET
        service_type_id = EXCLUDED.service_type_id,
        capacity = EXCLUDED.capacity,
        office_number = EXCLUDED.office_number,
        staffing_ratio = EXCLUDED.staffing_ratio,
        wage_achievement_tier = EXCLUDED.wage_achievement_tier,
        is_deleted = EXCLUDED.is_deleted,
        deleted_at = EXCLUDED.deleted_at,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_service_type_settings_insert ON public.office_service_type_settings;
CREATE TRIGGER trg_office_service_type_settings_insert
INSTEAD OF INSERT ON public.office_service_type_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_service_type_settings_insert();

CREATE OR REPLACE FUNCTION public.handle_office_service_type_settings_update()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT summary_id INTO v_summary_id
    FROM public.office_service_type_setting_details
    WHERE id = OLD.id;

    IF v_summary_id IS NOT NULL AND (NEW.valid_from IS DISTINCT FROM OLD.valid_from OR NEW.valid_to IS DISTINCT FROM OLD.valid_to) THEN
        UPDATE public.office_service_type_setting_summaries
        SET valid_from = COALESCE(NEW.valid_from, valid_from),
            valid_to = NEW.valid_to,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_summary_id;
    END IF;

    UPDATE public.office_service_type_setting_details
    SET service_type_id = NEW.service_type_id,
        capacity = COALESCE(NEW.capacity, 0),
        office_number = NEW.office_number,
        staffing_ratio = NEW.staffing_ratio,
        wage_achievement_tier = NEW.wage_achievement_tier,
        is_deleted = COALESCE(NEW.is_deleted, false),
        deleted_at = NEW.deleted_at,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_service_type_settings_update ON public.office_service_type_settings;
CREATE TRIGGER trg_office_service_type_settings_update
INSTEAD OF UPDATE ON public.office_service_type_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_service_type_settings_update();

CREATE OR REPLACE FUNCTION public.handle_office_service_type_settings_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.office_service_type_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_service_type_settings_delete ON public.office_service_type_settings;
CREATE TRIGGER trg_office_service_type_settings_delete
INSTEAD OF DELETE ON public.office_service_type_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_service_type_settings_delete();


-- 2. office_staff_settings UPDATE トリガー追加（valid_from, valid_to更新対応）
CREATE OR REPLACE FUNCTION public.handle_office_staff_settings_update()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT summary_id INTO v_summary_id
    FROM public.office_staff_setting_details
    WHERE id = OLD.id;

    IF v_summary_id IS NOT NULL AND (NEW.valid_from IS DISTINCT FROM OLD.valid_from OR NEW.valid_to IS DISTINCT FROM OLD.valid_to) THEN
        UPDATE public.office_staff_setting_summaries
        SET valid_from = COALESCE(NEW.valid_from, valid_from),
            valid_to = NEW.valid_to,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_summary_id;
    END IF;

    UPDATE public.office_staff_setting_details
    SET staff_id = NEW.staff_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_staff_settings_update ON public.office_staff_settings;
CREATE TRIGGER trg_office_staff_settings_update
INSTEAD OF UPDATE ON public.office_staff_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_update();


-- 3. office_member_settings UPDATE トリガー追加（valid_from, valid_to更新対応）
CREATE OR REPLACE FUNCTION public.handle_office_member_settings_update()
RETURNS TRIGGER AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT summary_id INTO v_summary_id
    FROM public.office_member_setting_details
    WHERE id = OLD.id;

    IF v_summary_id IS NOT NULL AND (NEW.valid_from IS DISTINCT FROM OLD.valid_from OR NEW.valid_to IS DISTINCT FROM OLD.valid_to) THEN
        UPDATE public.office_member_setting_summaries
        SET valid_from = COALESCE(NEW.valid_from, valid_from),
            valid_to = NEW.valid_to,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_summary_id;
    END IF;

    UPDATE public.office_member_setting_details
    SET member_id = NEW.member_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_office_member_settings_update ON public.office_member_settings;
CREATE TRIGGER trg_office_member_settings_update
INSTEAD OF UPDATE ON public.office_member_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_update();

