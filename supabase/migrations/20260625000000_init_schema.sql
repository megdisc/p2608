-- ==========================================
-- システム統合マイグレーション (Single Consolidated Schema)
-- 独立マスタ・従属マスタ・記録系・スナップショット系 全テーブル/ビュー統合
-- ==========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = "UTF8";
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET search_path = public, extensions;

-- 拡張機能
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

--
-- PostgreSQL database dump
--



-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--






--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--




--
-- Name: calc_member_service_hours(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calc_member_service_hours() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.is_scheduled = false OR NEW.start_time IS NULL OR NEW.end_time IS NULL OR NEW.end_time <= NEW.start_time THEN
    NEW.service_hours := 0.00;
  ELSE
    NEW.service_hours := ROUND(
      GREATEST(
        0,
        (EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0) - (COALESCE(NEW.break_minutes, 0) / 60.0)
      )::numeric,
      2
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;




--
-- Name: calc_staff_scheduled_hours(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calc_staff_scheduled_hours() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.is_work_day = false OR NEW.start_time IS NULL OR NEW.end_time IS NULL OR NEW.end_time <= NEW.start_time THEN
    NEW.scheduled_hours := 0.00;
  ELSE
    NEW.scheduled_hours := ROUND(
      GREATEST(
        0,
        (EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0) - (COALESCE(NEW.break_minutes, 0) / 60.0)
      )::numeric,
      2
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;




--
-- Name: handle_office_member_settings_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_member_settings_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.office_member_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$;




--
-- Name: handle_office_member_settings_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_member_settings_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    SELECT id INTO v_summary_id
    FROM public.office_member_setting_summaries
    WHERE office_id = NEW.office_id
      AND valid_from <= CURRENT_DATE
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO public.office_member_setting_summaries (office_id, valid_from, valid_to)
        VALUES (NEW.office_id, '2024-04-01', NULL)
        RETURNING id INTO v_summary_id;
    END IF;

    INSERT INTO public.office_member_setting_details (id, summary_id, member_id)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), v_summary_id, NEW.member_id)
    ON CONFLICT (summary_id, member_id) DO NOTHING;

    RETURN NEW;
END;
$$;




--
-- Name: handle_office_member_settings_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_member_settings_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;




--
-- Name: handle_office_service_type_settings_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_service_type_settings_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.office_service_type_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$;




--
-- Name: handle_office_service_type_settings_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_service_type_settings_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;




--
-- Name: handle_office_service_type_settings_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_service_type_settings_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;




--
-- Name: handle_office_staff_settings_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_staff_settings_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.office_staff_setting_details WHERE id = OLD.id;
    RETURN OLD;
END;
$$;




--
-- Name: handle_office_staff_settings_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_staff_settings_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_summary_id UUID;
BEGIN
    -- 該当事業所の有効な概要レコードを取得、なければ自動作成
    SELECT id INTO v_summary_id
    FROM public.office_staff_setting_summaries
    WHERE office_id = NEW.office_id
      AND valid_from <= CURRENT_DATE
      AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO public.office_staff_setting_summaries (office_id, valid_from, valid_to)
        VALUES (NEW.office_id, '2024-04-01', NULL)
        RETURNING id INTO v_summary_id;
    END IF;

    -- 詳細に挿入
    INSERT INTO public.office_staff_setting_details (id, summary_id, staff_id)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), v_summary_id, NEW.staff_id)
    ON CONFLICT (summary_id, staff_id) DO NOTHING;

    RETURN NEW;
END;
$$;




--
-- Name: handle_office_staff_settings_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_office_staff_settings_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;




--
-- Name: handle_users_view_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_users_view_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO public.auth_users (id, email, role, user_type)
    VALUES (COALESCE(NEW.id, gen_random_uuid()), NEW.email, COALESCE(NEW.role, '職員'), COALESCE(NEW.user_type, 'staff'))
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        user_type = EXCLUDED.user_type;
    RETURN NEW;
END;
$$;




--
-- Name: handle_users_view_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_users_view_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.auth_users
    SET email = NEW.email,
        role = NEW.role,
        user_type = NEW.user_type,
        deleted_at = CASE WHEN NEW.is_deleted = true THEN now() ELSE NULL END
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;




--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;




SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    postal_code_prefix character varying(3),
    postal_code_suffix character varying(4),
    prefecture text,
    city text,
    town_street text,
    building text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: allowance_deduction_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allowance_deduction_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    item_id uuid,
    item_category character varying(20) NOT NULL,
    item_name text NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    quantity numeric(8,2) DEFAULT 0 NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE allowance_deduction_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.allowance_deduction_snapshot IS '加算手当・実費控除スナップショット';


--
-- Name: COLUMN allowance_deduction_snapshot.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.id IS '明細ID';


--
-- Name: COLUMN allowance_deduction_snapshot.summary_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.summary_id IS '工賃・控除概要ID';


--
-- Name: COLUMN allowance_deduction_snapshot.item_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.item_id IS '加算手当・控除項目ID（FK -> allowance_deduction_items.id）';


--
-- Name: COLUMN allowance_deduction_snapshot.item_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.item_category IS '項目区分（allowance: 加算手当, deduction: 控除）';


--
-- Name: COLUMN allowance_deduction_snapshot.item_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.item_name IS '項目名称（手当名または控除名）';


--
-- Name: COLUMN allowance_deduction_snapshot.unit_price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.unit_price IS '単価';


--
-- Name: COLUMN allowance_deduction_snapshot.quantity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.quantity IS '数量・日数';


--
-- Name: COLUMN allowance_deduction_snapshot.amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.allowance_deduction_snapshot.amount IS '金額';


--
-- Name: allowance_deduction_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowance_deduction_details AS
 SELECT id,
    summary_id,
    item_id,
    item_category,
    item_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_deduction_snapshot;




--
-- Name: allowance_deduction_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allowance_deduction_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    name text NOT NULL,
    item_category text NOT NULL,
    occurrence_type character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    calc_trigger_basis character varying(30) DEFAULT 'manual'::character varying NOT NULL,
    threshold_value numeric(8,2) DEFAULT NULL::numeric,
    threshold_unit character varying(20) DEFAULT NULL::character varying,
    threshold_operator character varying(20) DEFAULT NULL::character varying,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: allowance_deduction_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.allowance_deduction_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_period date NOT NULL,
    member_id uuid,
    item_id uuid,
    quantity numeric(8,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE allowance_deduction_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.allowance_deduction_records IS '加算手当・控除レコード';


--
-- Name: allowance_deduction_snapshot_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowance_deduction_snapshot_details AS
 SELECT id,
    summary_id,
    item_id,
    item_category,
    item_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_deduction_snapshot;




--
-- Name: allowance_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowance_details AS
 SELECT id,
    summary_id,
    item_id AS allowance_id,
    item_name AS allowance_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_deduction_snapshot
  WHERE ((item_category)::text = 'allowance'::text);




--
-- Name: allowance_items; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowance_items AS
 SELECT id,
    office_id,
    name,
    item_category,
    occurrence_type,
    calc_trigger_basis,
    threshold_value,
    threshold_unit,
    threshold_operator,
    unit_price,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.allowance_deduction_items
  WHERE (item_category = 'allowance'::text);




--
-- Name: allowance_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowance_records AS
 SELECT id,
    target_period,
    member_id,
    item_id AS allowance_id,
    quantity,
    unit_price,
    created_at,
    updated_at
   FROM public.allowance_deduction_records;




--
-- Name: allowances; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.allowances AS
 SELECT id,
    office_id,
    name,
    item_category,
    occurrence_type,
    calc_trigger_basis,
    threshold_value,
    threshold_unit,
    threshold_operator,
    unit_price,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at,
    (deleted_at IS NULL) AS is_active
   FROM public.allowance_deduction_items
  WHERE (item_category = 'allowance'::text);




--
-- Name: member_attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period date NOT NULL,
    member_id uuid,
    status text DEFAULT 'present'::text NOT NULL,
    contact_date date,
    is_absentee_supported boolean DEFAULT false NOT NULL,
    has_meal boolean DEFAULT false NOT NULL,
    has_pickup boolean DEFAULT false NOT NULL,
    has_dropoff boolean DEFAULT false NOT NULL,
    is_visit_supported boolean DEFAULT false NOT NULL,
    is_trial_use boolean DEFAULT false NOT NULL,
    is_offsite_work boolean DEFAULT false NOT NULL,
    service_hours numeric(4,2) DEFAULT NULL::numeric,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_minutes integer DEFAULT 0 NOT NULL
);




--
-- Name: TABLE member_attendance_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_attendance_records IS '利用者出欠レコード';


--
-- Name: attendance_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.attendance_records AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    status,
    contact_date,
    is_absentee_supported,
    has_meal,
    has_pickup,
    has_dropoff,
    is_visit_supported,
    is_trial_use,
    is_offsite_work,
    service_hours,
    remarks,
    created_at,
    updated_at,
    start_time,
    end_time,
    break_minutes
   FROM public.member_attendance_records;




--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    role text DEFAULT '職員'::text NOT NULL,
    user_type text DEFAULT 'staff'::text NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT auth_users_user_type_check CHECK ((user_type = ANY (ARRAY['staff'::text, 'member'::text])))
);




--
-- Name: base_reward_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.base_reward_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid NOT NULL,
    capacity_tier character varying(50) DEFAULT '20人以下'::character varying NOT NULL,
    staffing_ratio character varying(50) DEFAULT '7.5:1'::character varying NOT NULL,
    wage_achievement_tier character varying(50) DEFAULT '4万5千円以上'::character varying NOT NULL,
    base_units integer DEFAULT 584 NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_code character varying(20)
);




--
-- Name: TABLE base_reward_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.base_reward_items IS '基本報酬告示マスタ（法令・報酬告示に基づく公定基本単位数）';


--
-- Name: COLUMN base_reward_items.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.id IS '基本報酬ID';


--
-- Name: COLUMN base_reward_items.service_type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.service_type_id IS '所属支援種別ID';


--
-- Name: COLUMN base_reward_items.capacity_tier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.capacity_tier IS '利用定員規模区分（20人以下, 21〜40人 等）';


--
-- Name: COLUMN base_reward_items.staffing_ratio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.staffing_ratio IS '人員配置基準区分（7.5:1, 10:1 等）';


--
-- Name: COLUMN base_reward_items.wage_achievement_tier; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.wage_achievement_tier IS '平均工賃月額達成区分';


--
-- Name: COLUMN base_reward_items.base_units; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.base_units IS '基本単位数（1日あたり公定単位数）';


--
-- Name: COLUMN base_reward_items.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.valid_from IS '適用開始年月日（報酬改定施行日）';


--
-- Name: COLUMN base_reward_items.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.valid_to IS '適用終了年月日（改定による終了日。NULL: 適用中）';


--
-- Name: COLUMN base_reward_items.service_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.base_reward_items.service_code IS 'サービスコード（国保連公定6桁コード。例: 111111）';


--
-- Name: capacity_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capacity_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    min_capacity integer NOT NULL,
    max_capacity integer,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: daily_allowance_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_allowance_records AS
 SELECT id,
    target_period,
    member_id,
    item_id AS allowance_id,
    quantity,
    unit_price,
    created_at,
    updated_at
   FROM public.allowance_deduction_records;




--
-- Name: daily_closings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_closings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_period date NOT NULL,
    confirmed_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmed_by uuid,
    is_confirmed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE daily_closings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.daily_closings IS '日次締め';


--
-- Name: daily_deduction_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_deduction_records AS
 SELECT id,
    target_period,
    member_id,
    item_id AS deduction_id,
    quantity,
    unit_price,
    created_at,
    updated_at
   FROM public.allowance_deduction_records;




--
-- Name: financial_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period date NOT NULL,
    project_id uuid,
    client_id uuid,
    recorded_by uuid,
    type text NOT NULL,
    activity_category text DEFAULT 'production'::text NOT NULL,
    cost_category text DEFAULT 'manufacturing'::text NOT NULL,
    subject text NOT NULL,
    amount numeric(12,2) NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT general_financial_details_activity_category_check CHECK ((activity_category = ANY (ARRAY['production'::text, 'welfare'::text]))),
    CONSTRAINT general_financial_details_cost_category_check CHECK ((cost_category = ANY (ARRAY['manufacturing'::text, 'sga'::text])))
);




--
-- Name: TABLE financial_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.financial_snapshot IS '収支スナップショット';


--
-- Name: daily_financial_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_financial_records AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    recorded_by,
    type,
    activity_category,
    cost_category,
    subject,
    amount,
    remarks,
    created_at,
    updated_at
   FROM public.financial_snapshot;




--
-- Name: daily_record_closings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_record_closings AS
 SELECT id,
    target_period,
    confirmed_at,
    confirmed_by,
    is_confirmed,
    created_at,
    updated_at
   FROM public.daily_closings;




--
-- Name: daily_work_confirmations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_work_confirmations AS
 SELECT id,
    target_period,
    confirmed_at,
    confirmed_by,
    is_confirmed,
    created_at,
    updated_at
   FROM public.daily_closings;




--
-- Name: member_work_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_work_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period date NOT NULL,
    member_id uuid,
    task_id uuid,
    work_time numeric(4,1) NOT NULL,
    work_location_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE member_work_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_work_records IS '利用者作業レコード';


--
-- Name: daily_work_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_work_records AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    task_id,
    work_time,
    work_location_id,
    created_at,
    updated_at
   FROM public.member_work_records;




--
-- Name: deduction_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.deduction_details AS
 SELECT id,
    summary_id,
    item_id AS deduction_id,
    item_name AS deduction_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_deduction_snapshot
  WHERE ((item_category)::text = 'deduction'::text);




--
-- Name: deduction_items; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.deduction_items AS
 SELECT id,
    office_id,
    name,
    item_category,
    occurrence_type,
    calc_trigger_basis,
    threshold_value,
    threshold_unit,
    threshold_operator,
    unit_price,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.allowance_deduction_items
  WHERE (item_category = 'deduction'::text);




--
-- Name: deduction_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.deduction_records AS
 SELECT id,
    target_period,
    member_id,
    item_id AS deduction_id,
    quantity,
    unit_price,
    created_at,
    updated_at
   FROM public.allowance_deduction_records;




--
-- Name: deductions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.deductions AS
 SELECT id,
    office_id,
    name,
    item_category,
    occurrence_type,
    calc_trigger_basis,
    threshold_value,
    threshold_unit,
    threshold_operator,
    unit_price,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at,
    (deleted_at IS NULL) AS is_active
   FROM public.allowance_deduction_items
  WHERE (item_category = 'deduction'::text);




--
-- Name: email_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: entity_address_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entity_address_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_type text NOT NULL,
    owner_id uuid NOT NULL,
    address_id uuid,
    address_type text DEFAULT 'main'::text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: entity_email_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entity_email_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_type text NOT NULL,
    owner_id uuid NOT NULL,
    email_address_id uuid,
    label text,
    is_emergency boolean DEFAULT false NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: entity_phone_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entity_phone_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_type text NOT NULL,
    owner_id uuid NOT NULL,
    phone_number_id uuid,
    label text,
    is_emergency boolean DEFAULT false NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: financial_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period date DEFAULT CURRENT_DATE NOT NULL,
    project_id uuid,
    client_id uuid,
    subject text NOT NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    remarks text,
    recorded_by uuid,
    activity_category text DEFAULT 'production'::text NOT NULL,
    cost_category text DEFAULT 'manufacturing'::text NOT NULL,
    CONSTRAINT general_financial_records_activity_category_check CHECK ((activity_category = ANY (ARRAY['production'::text, 'welfare'::text]))),
    CONSTRAINT general_financial_records_cost_category_check CHECK ((cost_category = ANY (ARRAY['manufacturing'::text, 'sga'::text])))
);




--
-- Name: TABLE financial_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.financial_records IS '収支レコード';


--
-- Name: COLUMN financial_records.remarks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.financial_records.remarks IS '備考・摘要詳細';


--
-- Name: COLUMN financial_records.recorded_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.financial_records.recorded_by IS '計上・登録職員ID';


--
-- Name: COLUMN financial_records.activity_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.financial_records.activity_category IS '事業活動区分（production: 就労支援事業 / welfare: 福祉事業）';


--
-- Name: COLUMN financial_records.cost_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.financial_records.cost_category IS '費用区分（manufacturing: 製造原価 / sga: 販売費及び一般管理費）';


--
-- Name: general_financial_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.general_financial_details AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    recorded_by,
    type,
    activity_category,
    cost_category,
    subject,
    amount,
    remarks,
    created_at,
    updated_at
   FROM public.financial_snapshot;




--
-- Name: general_financial_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.general_financial_records AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    subject,
    amount,
    type,
    created_at,
    updated_at,
    remarks,
    recorded_by,
    activity_category,
    cost_category
   FROM public.financial_records;




--
-- Name: general_financial_snapshot_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.general_financial_snapshot_details AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    recorded_by,
    type,
    activity_category,
    cost_category,
    subject,
    amount,
    remarks,
    created_at,
    updated_at
   FROM public.financial_snapshot;




--
-- Name: incentive_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incentive_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid,
    task_id uuid,
    allocation_amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    target_period date
);




--
-- Name: TABLE incentive_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.incentive_snapshot IS 'インセンティブスナップショット';


--
-- Name: incentive_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.incentive_details AS
 SELECT id,
    summary_id,
    task_id,
    allocation_amount,
    created_at,
    updated_at
   FROM public.incentive_snapshot;




--
-- Name: incentive_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incentive_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_period date NOT NULL,
    member_id uuid,
    task_id uuid,
    allocation_amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE incentive_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.incentive_records IS 'インセンティブ配分レコード';


--
-- Name: incentive_snapshot_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.incentive_snapshot_details AS
 SELECT id,
    summary_id,
    task_id,
    allocation_amount,
    created_at,
    updated_at,
    target_period
   FROM public.incentive_snapshot;




--
-- Name: member_basic_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_basic_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    member_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    is_scheduled boolean DEFAULT true NOT NULL,
    status text DEFAULT 'present'::text NOT NULL,
    start_time time without time zone DEFAULT '09:30:00'::time without time zone,
    end_time time without time zone DEFAULT '15:30:00'::time without time zone,
    break_minutes integer DEFAULT 60 NOT NULL,
    service_hours numeric(4,2) DEFAULT NULL::numeric,
    has_meal boolean DEFAULT true NOT NULL,
    has_pickup boolean DEFAULT false NOT NULL,
    has_dropoff boolean DEFAULT false NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT member_basic_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);




--
-- Name: TABLE member_basic_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_basic_schedules IS '利用者基本利用予定';


--
-- Name: member_exception_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_exception_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    member_id uuid NOT NULL,
    target_date date NOT NULL,
    is_scheduled boolean DEFAULT true NOT NULL,
    status text DEFAULT 'present'::text NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_minutes integer DEFAULT 60 NOT NULL,
    service_hours numeric(4,2) DEFAULT NULL::numeric,
    has_meal boolean DEFAULT true NOT NULL,
    has_pickup boolean DEFAULT false NOT NULL,
    has_dropoff boolean DEFAULT false NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE member_exception_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_exception_schedules IS '利用者例外利用予定';


--
-- Name: member_recipient_certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_recipient_certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    certificate_number character varying(10),
    issuing_municipality text,
    income_category text,
    copayment_limit_amount numeric(12,2) DEFAULT 0 NOT NULL,
    disability_support_class text,
    copayment_management_type text,
    copayment_office_id uuid,
    copayment_office_code character varying(10),
    copayment_office_name text,
    valid_from date NOT NULL,
    valid_to date,
    remarks text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: member_skill_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_skill_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    skill_id uuid NOT NULL,
    skill_level_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE member_skill_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_skill_setting_details IS '利用者スキル割当詳細';


--
-- Name: COLUMN member_skill_setting_details.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_details.id IS '詳細ID';


--
-- Name: COLUMN member_skill_setting_details.summary_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_details.summary_id IS '概要ID（FK -> member_skill_setting_summaries.id）';


--
-- Name: COLUMN member_skill_setting_details.skill_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_details.skill_id IS 'スキルID（FK -> skill_items.id）';


--
-- Name: COLUMN member_skill_setting_details.skill_level_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_details.skill_level_id IS 'スキルレベルID（FK -> skill_level_items.id）';


--
-- Name: member_skill_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_skill_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE member_skill_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.member_skill_setting_summaries IS '利用者スキル割当概要';


--
-- Name: COLUMN member_skill_setting_summaries.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_summaries.id IS '概要ID';


--
-- Name: COLUMN member_skill_setting_summaries.member_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_summaries.member_id IS '利用者ID';


--
-- Name: COLUMN member_skill_setting_summaries.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_summaries.valid_from IS '有効期間（開始）';


--
-- Name: COLUMN member_skill_setting_summaries.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.member_skill_setting_summaries.valid_to IS '有効期間（終了。NULL: 継続中）';


--
-- Name: member_skill_evaluations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.member_skill_evaluations AS
 SELECT d.id,
    s.member_id,
    d.skill_id,
    d.skill_level_id,
    d.created_at,
    d.updated_at
   FROM (public.member_skill_setting_details d
     JOIN public.member_skill_setting_summaries s ON ((s.id = d.summary_id)))
  WHERE ((s.valid_from <= CURRENT_DATE) AND ((s.valid_to IS NULL) OR (s.valid_to >= CURRENT_DATE)));




--
-- Name: member_skill_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_skill_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    skill_id uuid,
    skill_level_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: member_wage_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_wage_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    wage_rate_id uuid,
    start_period character varying(7) NOT NULL,
    end_period character varying(7) DEFAULT NULL::character varying,
    remarks text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: member_wage_evaluations; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.member_wage_evaluations AS
 SELECT id,
    member_id,
    wage_rate_id,
    start_period,
    end_period,
    remarks,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.member_wage_settings;




--
-- Name: members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    code text,
    name text NOT NULL,
    yomigana text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: monthly_allowance_deduction_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_allowance_deduction_details AS
 SELECT id,
    summary_id,
    item_id,
    item_category,
    item_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_deduction_snapshot;




--
-- Name: monthly_allowance_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_allowance_details AS
 SELECT id,
    summary_id,
    allowance_id,
    allowance_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.allowance_details;




--
-- Name: monthly_closings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_closings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period character varying(7) NOT NULL,
    is_settlement_confirmed boolean DEFAULT false NOT NULL,
    settlement_confirmed_at timestamp with time zone,
    settlement_confirmed_by uuid,
    is_financial_confirmed boolean DEFAULT false NOT NULL,
    financial_confirmed_at timestamp with time zone,
    financial_confirmed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE monthly_closings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.monthly_closings IS '月次締め';


--
-- Name: monthly_confirmation_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_confirmation_details AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    recorded_by,
    type,
    activity_category,
    cost_category,
    subject,
    amount,
    remarks,
    created_at,
    updated_at
   FROM public.financial_snapshot;




--
-- Name: monthly_deduction_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_deduction_details AS
 SELECT id,
    summary_id,
    deduction_id,
    deduction_name,
    unit_price,
    quantity,
    amount,
    created_at,
    updated_at
   FROM public.deduction_details;




--
-- Name: monthly_financial_closings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_financial_closings AS
 SELECT id,
    office_id,
    target_period,
    financial_confirmed_at AS confirmed_at,
    financial_confirmed_by AS confirmed_by,
    is_financial_confirmed AS is_confirmed,
    created_at,
    updated_at
   FROM public.monthly_closings;




--
-- Name: monthly_financial_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_financial_details AS
 SELECT id,
    office_id,
    target_period,
    project_id,
    client_id,
    recorded_by,
    type,
    activity_category,
    cost_category,
    subject,
    amount,
    remarks,
    created_at,
    updated_at
   FROM public.financial_snapshot;




--
-- Name: monthly_incentive_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_incentive_details AS
 SELECT id,
    summary_id,
    task_id,
    allocation_amount,
    created_at,
    updated_at
   FROM public.incentive_snapshot;




--
-- Name: monthly_incentive_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_incentive_records AS
 SELECT id,
    target_period,
    member_id,
    task_id,
    allocation_amount,
    created_at,
    updated_at
   FROM public.incentive_records;




--
-- Name: monthly_record_closings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_record_closings AS
 SELECT id,
    office_id,
    target_period,
    settlement_confirmed_at AS confirmed_at,
    settlement_confirmed_by AS confirmed_by,
    is_settlement_confirmed AS is_confirmed,
    created_at,
    updated_at
   FROM public.monthly_closings;




--
-- Name: wage_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    target_period text NOT NULL,
    member_id uuid,
    work_time numeric(8,2) DEFAULT 0 NOT NULL,
    wage_rate numeric(12,2),
    basic_wage numeric(12,2),
    incentive_total numeric(12,2) DEFAULT 0 NOT NULL,
    other_allowance_total numeric(12,2) DEFAULT 0 NOT NULL,
    wage_total numeric(12,2) DEFAULT 0 NOT NULL,
    service_fee_total numeric(12,2) DEFAULT 0 NOT NULL,
    service_fee_copayment numeric(12,2) DEFAULT 0 NOT NULL,
    is_copayment_limit_applied boolean DEFAULT false NOT NULL,
    managed_copayment_amount numeric(12,2) DEFAULT 0 NOT NULL,
    deduction_total numeric(12,2) DEFAULT 0 NOT NULL,
    payment numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_fee_deduction numeric(12,2) DEFAULT 0 NOT NULL,
    actual_expense_deduction numeric(12,2) DEFAULT 0 NOT NULL,
    payment_date date
);




--
-- Name: TABLE wage_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.wage_snapshot IS '工賃・控除総額スナップショット';


--
-- Name: monthly_wage_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.monthly_wage_summaries AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    work_time,
    wage_rate,
    basic_wage,
    incentive_total,
    other_allowance_total,
    wage_total,
    service_fee_total,
    service_fee_copayment,
    is_copayment_limit_applied,
    managed_copayment_amount,
    deduction_total,
    payment,
    created_at,
    updated_at
   FROM public.wage_snapshot;




--
-- Name: office_member_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_member_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    member_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE office_member_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_member_setting_details IS '事業所利用者割当詳細';


--
-- Name: COLUMN office_member_setting_details.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_details.id IS '詳細ID';


--
-- Name: COLUMN office_member_setting_details.summary_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_details.summary_id IS '概要ID（FK -> office_member_setting_summaries.id）';


--
-- Name: COLUMN office_member_setting_details.member_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_details.member_id IS '利用者ID（FK -> members.id）';


--
-- Name: office_member_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_member_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE office_member_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_member_setting_summaries IS '事業所利用者割当概要';


--
-- Name: COLUMN office_member_setting_summaries.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_summaries.id IS '概要ID';


--
-- Name: COLUMN office_member_setting_summaries.office_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_summaries.office_id IS '事業所ID（FK -> offices.id）';


--
-- Name: COLUMN office_member_setting_summaries.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_summaries.valid_from IS '集計開始時期（利用契約・在籍開始年月日）';


--
-- Name: COLUMN office_member_setting_summaries.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_member_setting_summaries.valid_to IS '集計終了時期（利用契約・在籍終了年月日。NULL: 継続中）';


--
-- Name: office_member_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_member_settings AS
 SELECT d.id,
    s.office_id,
    d.member_id,
    s.valid_from,
    s.valid_to,
    d.created_at,
    d.updated_at
   FROM (public.office_member_setting_details d
     JOIN public.office_member_setting_summaries s ON ((s.id = d.summary_id)));




--
-- Name: office_reward_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_reward_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    reward_item_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE office_reward_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_reward_setting_details IS '事業所加算・減算割当詳細';


--
-- Name: office_reward_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_reward_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_type_id uuid
);




--
-- Name: TABLE office_reward_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_reward_setting_summaries IS '事業所加算・減算割当概要';


--
-- Name: office_reward_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_reward_settings AS
 SELECT d.id,
    s.id AS summary_id,
    s.office_id,
    s.service_type_id,
    d.reward_item_id,
    s.valid_from,
    s.valid_to,
    NULL::text AS remarks,
    d.created_at,
    d.updated_at
   FROM (public.office_reward_setting_summaries s
     JOIN public.office_reward_setting_details d ON ((s.id = d.summary_id)));




--
-- Name: offices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    name text NOT NULL,
    short_name text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    standard_weekly_hours numeric(4,2) DEFAULT 40.00
);




--
-- Name: COLUMN offices.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.offices.valid_from IS '集計開始時期（開設・指定年月日）';


--
-- Name: COLUMN offices.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.offices.valid_to IS '集計終了時期（廃止年月日。NULL: 運営中・継続中）';


--
-- Name: COLUMN offices.standard_weekly_hours; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.offices.standard_weekly_hours IS '常勤週所定労働時間（就業規則上の基準週労働時間。常勤換算数の分母。デフォルト40.00時間）';


--
-- Name: office_service_scheme_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_service_scheme_settings AS
 SELECT gen_random_uuid() AS id,
    id AS office_id,
    id AS service_scheme_id,
    CURRENT_DATE AS valid_from,
    NULL::date AS valid_to,
    created_at,
    updated_at
   FROM public.offices;




--
-- Name: office_service_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_service_settings AS
 SELECT gen_random_uuid() AS id,
    id AS office_id,
    id AS service_scheme_id,
    CURRENT_DATE AS valid_from,
    NULL::date AS valid_to,
    created_at,
    updated_at
   FROM public.offices;




--
-- Name: office_service_type_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_service_type_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    service_type_id uuid NOT NULL,
    capacity integer DEFAULT 20 NOT NULL,
    office_number character varying(10),
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    standard_weekly_hours numeric(4,2) DEFAULT 40.00
);




--
-- Name: TABLE office_service_type_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_service_type_setting_details IS '事業所支援種別割当詳細';


--
-- Name: COLUMN office_service_type_setting_details.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.id IS '詳細ID';


--
-- Name: COLUMN office_service_type_setting_details.summary_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.summary_id IS '概要ID（FK -> office_service_type_setting_summaries.id）';


--
-- Name: COLUMN office_service_type_setting_details.service_type_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.service_type_id IS '支援種別ID（FK -> service_types.id）';


--
-- Name: COLUMN office_service_type_setting_details.capacity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.capacity IS '利用定員（人）';


--
-- Name: COLUMN office_service_type_setting_details.office_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.office_number IS '指定事業所番号（10桁）';


--
-- Name: COLUMN office_service_type_setting_details.standard_weekly_hours; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_details.standard_weekly_hours IS '常勤週所定労働時間（常勤換算数の分母。例: 40.00）';


--
-- Name: office_service_type_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_service_type_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE office_service_type_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_service_type_setting_summaries IS '事業所支援種別割当概要';


--
-- Name: COLUMN office_service_type_setting_summaries.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_summaries.id IS '概要ID';


--
-- Name: COLUMN office_service_type_setting_summaries.office_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_summaries.office_id IS '事業所ID（FK -> offices.id）';


--
-- Name: COLUMN office_service_type_setting_summaries.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_summaries.valid_from IS '集計開始時期（適用開始年月日）';


--
-- Name: COLUMN office_service_type_setting_summaries.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_service_type_setting_summaries.valid_to IS '集計終了時期（適用終了年月日。NULL: 継続中）';


--
-- Name: office_service_type_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_service_type_settings AS
 SELECT d.id,
    s.office_id,
    d.service_type_id,
    d.capacity,
    d.office_number,
    d.is_deleted,
    d.deleted_at,
    s.valid_from,
    s.valid_to,
    d.created_at,
    d.updated_at
   FROM (public.office_service_type_setting_details d
     JOIN public.office_service_type_setting_summaries s ON ((s.id = d.summary_id)));




--
-- Name: office_staff_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_staff_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE office_staff_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_staff_setting_details IS '事業所職員割当詳細';


--
-- Name: COLUMN office_staff_setting_details.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_details.id IS '詳細ID';


--
-- Name: COLUMN office_staff_setting_details.summary_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_details.summary_id IS '概要ID（FK -> office_staff_setting_summaries.id）';


--
-- Name: COLUMN office_staff_setting_details.staff_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_details.staff_id IS '職員ID（FK -> staffs.id）';


--
-- Name: office_staff_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.office_staff_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);




--
-- Name: TABLE office_staff_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.office_staff_setting_summaries IS '事業所職員割当概要';


--
-- Name: COLUMN office_staff_setting_summaries.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_summaries.id IS '概要ID';


--
-- Name: COLUMN office_staff_setting_summaries.office_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_summaries.office_id IS '事業所ID（FK -> offices.id）';


--
-- Name: COLUMN office_staff_setting_summaries.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_summaries.valid_from IS '集計開始時期（配属・所属開始年月日）';


--
-- Name: COLUMN office_staff_setting_summaries.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.office_staff_setting_summaries.valid_to IS '集計終了時期（配属・所属終了年月日。NULL: 継続中）';


--
-- Name: office_staff_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.office_staff_settings AS
 SELECT d.id,
    s.office_id,
    d.staff_id,
    s.valid_from,
    s.valid_to,
    d.created_at,
    d.updated_at
   FROM (public.office_staff_setting_details d
     JOIN public.office_staff_setting_summaries s ON ((s.id = d.summary_id)));




--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    representative_name text,
    corporate_number character varying(13),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2020-04-01'::date NOT NULL,
    valid_to date,
    fiscal_year_closing_month smallint DEFAULT 3 NOT NULL,
    fiscal_year_closing_day smallint DEFAULT 31 NOT NULL
);




--
-- Name: COLUMN organizations.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizations.valid_from IS '集計開始時期（運営開始・設立年月日）';


--
-- Name: COLUMN organizations.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizations.valid_to IS '集計終了時期（運営終了・廃止年月日。NULL: 運営中・継続中）';


--
-- Name: COLUMN organizations.fiscal_year_closing_month; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizations.fiscal_year_closing_month IS '事業年度決算月（1〜12月）';


--
-- Name: COLUMN organizations.fiscal_year_closing_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizations.fiscal_year_closing_day IS '事業年度締め日（1〜31日、または99: 末日）';


--
-- Name: partner_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partner_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid,
    name text NOT NULL,
    yomigana text,
    department text,
    "position" text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    name text NOT NULL,
    yomigana text,
    is_customer boolean DEFAULT false NOT NULL,
    is_subcontractor boolean DEFAULT false NOT NULL,
    is_other boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_payment_month_type text DEFAULT 'next'::text,
    customer_payment_day smallint DEFAULT 99,
    subcontractor_payment_month_type text DEFAULT 'next'::text,
    subcontractor_payment_day smallint DEFAULT 99,
    CONSTRAINT partners_customer_payment_day_check CHECK (((customer_payment_day IS NULL) OR (((customer_payment_day >= 1) AND (customer_payment_day <= 28)) OR (customer_payment_day = 99)))),
    CONSTRAINT partners_customer_payment_month_type_check CHECK (((customer_payment_month_type IS NULL) OR (customer_payment_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text])))),
    CONSTRAINT partners_subcontractor_payment_day_check CHECK (((subcontractor_payment_day IS NULL) OR (((subcontractor_payment_day >= 1) AND (subcontractor_payment_day <= 28)) OR (subcontractor_payment_day = 99)))),
    CONSTRAINT partners_subcontractor_payment_month_type_check CHECK (((subcontractor_payment_month_type IS NULL) OR (subcontractor_payment_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text]))))
);




--
-- Name: COLUMN partners.customer_payment_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.partners.customer_payment_month_type IS '顧客入金月区分（current: 当月, next: 翌月, next_next: 翌々月）';


--
-- Name: COLUMN partners.customer_payment_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.partners.customer_payment_day IS '顧客入金日（1〜28日、または99: 末日）';


--
-- Name: COLUMN partners.subcontractor_payment_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.partners.subcontractor_payment_month_type IS '外注先出金月区分（current: 当月, next: 翌月, next_next: 翌々月）';


--
-- Name: COLUMN partners.subcontractor_payment_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.partners.subcontractor_payment_day IS '外注先出金日（1〜28日、または99: 末日）';


--
-- Name: phone_numbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_numbers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_type text DEFAULT 'phone'::text NOT NULL,
    phone_number text NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: project_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    task_id uuid,
    category text NOT NULL,
    subject text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: task_assignee_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignee_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid,
    member_id uuid,
    staff_id uuid,
    client_id uuid,
    assignee_type text DEFAULT 'member'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: project_task_assignees; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.project_task_assignees AS
 SELECT id,
    task_id,
    member_id,
    staff_id,
    client_id,
    assignee_type,
    created_at,
    updated_at
   FROM public.task_assignee_settings;




--
-- Name: task_skill_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_skill_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid,
    skill_id uuid,
    skill_level_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: project_task_skills; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.project_task_skills AS
 SELECT id,
    task_id,
    skill_id,
    skill_level_id,
    created_at,
    updated_at
   FROM public.task_skill_settings;




--
-- Name: project_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    completed_at timestamp with time zone,
    project_id uuid,
    name text NOT NULL,
    assignee_type character varying DEFAULT 'internal'::character varying,
    is_completed boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    settlement_year_month character varying(7),
    client_id uuid,
    code text,
    name text NOT NULL,
    project_type text DEFAULT 'one-off'::text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    start_date date,
    end_date date
);




--
-- Name: COLUMN projects.start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.projects.start_date IS '集計開始時期（案件開始・着手年月日）';


--
-- Name: COLUMN projects.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.projects.end_date IS '集計終了時期（案件終了・完了予定年月日。NULL: 進行中）';


--
-- Name: qualifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qualifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2006-10-01'::date,
    valid_to date
);




--
-- Name: COLUMN qualifications.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.qualifications.valid_from IS '適用開始年月日（資格・研修新設施行日）';


--
-- Name: COLUMN qualifications.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.qualifications.valid_to IS '適用終了年月日（資格・研修廃止日。NULL: 継続中）';


--
-- Name: regional_grade_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regional_grade_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prefecture character varying(20) NOT NULL,
    city character varying(50) NOT NULL,
    grade character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date,
    valid_to date
);




--
-- Name: COLUMN regional_grade_locations.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.regional_grade_locations.valid_from IS '適用開始年月日（自治体指定・合併施行日）';


--
-- Name: COLUMN regional_grade_locations.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.regional_grade_locations.valid_to IS '適用終了年月日（自治体合併等による終了日。NULL: 継続中）';


--
-- Name: regional_grade_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.regional_grade_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grade character varying(20) NOT NULL,
    premium_rate numeric(5,4) DEFAULT 0.0000 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date,
    valid_to date
);




--
-- Name: COLUMN regional_grade_rates.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.regional_grade_rates.valid_from IS '適用開始年月日（報酬改定施行日）';


--
-- Name: COLUMN regional_grade_rates.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.regional_grade_rates.valid_to IS '適用終了年月日（改定による終了日。NULL: 継続中）';


--
-- Name: regional_grades; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.regional_grades AS
 SELECT l.id,
    l.prefecture,
    l.city,
    l.grade,
    r.premium_rate,
    false AS is_deleted,
    NULL::timestamp with time zone AS deleted_at,
    l.created_at,
    l.updated_at
   FROM (public.regional_grade_locations l
     JOIN public.regional_grade_rates r ON (((l.grade)::text = (r.grade)::text)));




--
-- Name: reserve_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reserve_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    name text NOT NULL,
    calc_type character varying(20) DEFAULT 'fixed_amount'::character varying NOT NULL,
    fixed_amount numeric(12,2) DEFAULT 0 NOT NULL,
    fixed_rate numeric(5,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    transfer_in_month_type text DEFAULT 'next'::text NOT NULL,
    transfer_in_day smallint DEFAULT 99 NOT NULL,
    transfer_out_month_type text DEFAULT 'next'::text NOT NULL,
    transfer_out_day smallint DEFAULT 99 NOT NULL,
    initial_balance numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT reserve_items_transfer_in_day_check CHECK ((((transfer_in_day >= 1) AND (transfer_in_day <= 28)) OR (transfer_in_day = 99))),
    CONSTRAINT reserve_items_transfer_in_month_type_check CHECK ((transfer_in_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text]))),
    CONSTRAINT reserve_items_transfer_out_day_check CHECK ((((transfer_out_day >= 1) AND (transfer_out_day <= 28)) OR (transfer_out_day = 99))),
    CONSTRAINT reserve_items_transfer_out_month_type_check CHECK ((transfer_out_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text])))
);




--
-- Name: COLUMN reserve_items.transfer_in_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reserve_items.transfer_in_month_type IS '積立金繰入月区分（current: 当月, next: 翌月, next_next: 翌々月）';


--
-- Name: COLUMN reserve_items.transfer_in_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reserve_items.transfer_in_day IS '積立金繰入日（1〜28日、または99: 末日）';


--
-- Name: COLUMN reserve_items.transfer_out_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reserve_items.transfer_out_month_type IS '積立金取崩月区分（current: 当月, next: 翌月, next_next: 翌々月）';


--
-- Name: COLUMN reserve_items.transfer_out_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reserve_items.transfer_out_day IS '積立金取崩日（1〜28日、または99: 末日）';


--
-- Name: COLUMN reserve_items.initial_balance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reserve_items.initial_balance IS '積立金初期残高（期首繰越額）';


--
-- Name: reserve_settings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.reserve_settings AS
 SELECT id,
    office_id,
    name,
    calc_type,
    fixed_amount,
    fixed_rate,
    created_at,
    updated_at,
    transfer_in_month_type,
    transfer_in_day,
    transfer_out_month_type,
    transfer_out_day,
    initial_balance
   FROM public.reserve_items;




--
-- Name: reward_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reward_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid,
    code text,
    name text NOT NULL,
    item_category text NOT NULL,
    calc_type character varying(20) DEFAULT 'fixed_units'::character varying NOT NULL,
    unit_value numeric(12,2) DEFAULT 0 NOT NULL,
    calc_rate numeric(5,2) DEFAULT 0 NOT NULL,
    occurrence_type character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    monthly_limit_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date,
    valid_to date
);




--
-- Name: COLUMN reward_items.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reward_items.valid_from IS '適用開始年月日（報酬改定施行日）';


--
-- Name: COLUMN reward_items.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reward_items.valid_to IS '適用終了年月日（改定による廃止日。NULL: 継続中）';


--
-- Name: salary_closing_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_closing_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    closing_day smallint DEFAULT 20 NOT NULL,
    payment_month_type text DEFAULT 'next'::text NOT NULL,
    payment_day smallint DEFAULT 10 NOT NULL,
    valid_from date DEFAULT '2020-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT salary_closing_settings_closing_day_check CHECK ((((closing_day >= 1) AND (closing_day <= 28)) OR (closing_day = 99))),
    CONSTRAINT salary_closing_settings_payment_day_check CHECK ((((payment_day >= 1) AND (payment_day <= 28)) OR (payment_day = 99))),
    CONSTRAINT salary_closing_settings_payment_month_type_check CHECK ((payment_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text])))
);




--
-- Name: TABLE salary_closing_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.salary_closing_settings IS '給与基準日設定';


--
-- Name: COLUMN salary_closing_settings.closing_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.salary_closing_settings.closing_day IS '給与締め日（1〜28日、99:末日）';


--
-- Name: COLUMN salary_closing_settings.payment_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.salary_closing_settings.payment_month_type IS '給与支給月区分（current:当月, next:翌月, next_next:翌々月）';


--
-- Name: COLUMN salary_closing_settings.payment_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.salary_closing_settings.payment_day IS '給与支給日（1〜28日、99:末日）';


--
-- Name: COLUMN salary_closing_settings.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.salary_closing_settings.valid_from IS '適用開始日';


--
-- Name: COLUMN salary_closing_settings.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.salary_closing_settings.valid_to IS '適用終了日（NULL:継続適用中）';


--
-- Name: service_billing_snapshot_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_billing_snapshot_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid,
    reward_item_id uuid,
    service_code character varying(20),
    item_name text NOT NULL,
    item_category character varying(50) NOT NULL,
    unit_value numeric(12,2) DEFAULT 0 NOT NULL,
    count numeric(8,2) DEFAULT 1 NOT NULL,
    total_item_units numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE service_billing_snapshot_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_billing_snapshot_details IS 'サービス費明細スナップショット';


--
-- Name: service_billing_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.service_billing_details AS
 SELECT id,
    summary_id,
    reward_item_id,
    service_code,
    item_name,
    item_category,
    unit_value,
    count,
    total_item_units,
    created_at
   FROM public.service_billing_snapshot_details;




--
-- Name: service_billing_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_billing_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    member_id uuid,
    target_period character varying(7) NOT NULL,
    attendance_days integer DEFAULT 0 NOT NULL,
    base_reward_units numeric(12,2) DEFAULT 0 NOT NULL,
    addition_units numeric(12,2) DEFAULT 0 NOT NULL,
    subtraction_units numeric(12,2) DEFAULT 0 NOT NULL,
    total_units numeric(12,2) DEFAULT 0 NOT NULL,
    unit_price numeric(12,2) DEFAULT 10.00 NOT NULL,
    total_cost_amount numeric(12,2) DEFAULT 0 NOT NULL,
    calculated_copayment_amount numeric(12,2) DEFAULT 0 NOT NULL,
    copayment_limit_amount numeric(12,2) DEFAULT 0 NOT NULL,
    final_copayment_amount numeric(12,2) DEFAULT 0 NOT NULL,
    benefit_billing_amount numeric(12,2) DEFAULT 0 NOT NULL,
    actual_expense_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_member_billed_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE service_billing_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_billing_snapshot IS 'サービス費用総額スナップショット';


--
-- Name: service_billing_snapshot_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.service_billing_snapshot_summaries AS
 SELECT id,
    office_id,
    member_id,
    target_period,
    attendance_days,
    base_reward_units,
    addition_units,
    subtraction_units,
    total_units,
    unit_price,
    total_cost_amount,
    calculated_copayment_amount,
    copayment_limit_amount,
    final_copayment_amount,
    benefit_billing_amount,
    actual_expense_amount,
    total_member_billed_amount,
    status,
    created_at,
    updated_at
   FROM public.service_billing_snapshot;




--
-- Name: service_billing_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.service_billing_summaries AS
 SELECT id,
    office_id,
    member_id,
    target_period,
    attendance_days,
    base_reward_units,
    addition_units,
    subtraction_units,
    total_units,
    unit_price,
    total_cost_amount,
    calculated_copayment_amount,
    copayment_limit_amount,
    final_copayment_amount,
    benefit_billing_amount,
    actual_expense_amount,
    total_member_billed_amount,
    status,
    created_at,
    updated_at
   FROM public.service_billing_snapshot;




--
-- Name: service_items; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.service_items AS
 SELECT reward_items.id,
    '33333333-3333-3333-3333-333333333333'::uuid AS service_scheme_id,
    reward_items.name,
        CASE
            WHEN (reward_items.item_category = 'addition'::text) THEN 'reward_addition'::text
            WHEN (reward_items.item_category = 'subtraction'::text) THEN 'reward_subtraction'::text
            ELSE reward_items.item_category
        END AS item_category,
    reward_items.occurrence_type,
    reward_items.unit_value,
    reward_items.calc_rate,
        CASE
            WHEN (reward_items.calc_rate > (0)::numeric) THEN 'rate'::text
            ELSE 'unit'::text
        END AS value_type,
    reward_items.monthly_limit_count,
    true AS affects_reward_units,
    true AS is_auto_calculated,
    NULL::timestamp with time zone AS deleted_at,
    false AS is_deleted,
    reward_items.created_at,
    reward_items.updated_at
   FROM public.reward_items
UNION ALL
 SELECT allowance_deduction_items.id,
    allowance_deduction_items.office_id AS service_scheme_id,
    allowance_deduction_items.name,
    allowance_deduction_items.item_category,
    allowance_deduction_items.occurrence_type,
    allowance_deduction_items.unit_price AS unit_value,
    (0)::numeric(5,2) AS calc_rate,
    'yen'::character varying(20) AS value_type,
    NULL::integer AS monthly_limit_count,
    false AS affects_reward_units,
    false AS is_auto_calculated,
    allowance_deduction_items.deleted_at,
    allowance_deduction_items.is_deleted,
    allowance_deduction_items.created_at,
    allowance_deduction_items.updated_at
   FROM public.allowance_deduction_items;




--
-- Name: service_provision_system_snapshot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_provision_system_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    service_type_id uuid NOT NULL,
    target_period character varying(7) NOT NULL,
    target_year character varying(4) NOT NULL,
    operating_days integer DEFAULT 0 NOT NULL,
    total_utilization integer DEFAULT 0 NOT NULL,
    avg_members_per_day numeric(6,2) DEFAULT 0.00 NOT NULL,
    previous_year_avg_members numeric(6,2) DEFAULT 0.00 NOT NULL,
    capacity integer DEFAULT 20 NOT NULL,
    capacity_tier_id uuid,
    is_capacity_excess boolean DEFAULT false NOT NULL,
    direct_care_work_hours numeric(8,2) DEFAULT 0.00 NOT NULL,
    standard_monthly_hours numeric(8,2) DEFAULT 160.00 NOT NULL,
    direct_care_fte numeric(5,2) DEFAULT 0.00 NOT NULL,
    has_full_time_direct_care boolean DEFAULT true NOT NULL,
    actual_staffing_ratio numeric(6,2) DEFAULT 0.00 NOT NULL,
    determined_staffing_ratio character varying(50) DEFAULT '7.5:1配置'::character varying NOT NULL,
    staffing_ratio_tier_id uuid,
    is_staffing_shortage boolean DEFAULT false NOT NULL,
    annual_average_wage integer DEFAULT 0 NOT NULL,
    wage_achievement_tier_id uuid,
    determined_wage_tier character varying(100),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    confirmed_by uuid,
    confirmed_at timestamp with time zone,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT service_provision_system_snapshot_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'confirmed'::character varying])::text[])))
);




--
-- Name: TABLE service_provision_system_snapshot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_provision_system_snapshot IS 'サービス提供体制スナップショット（自動算定された人員配置・稼働・報酬算定基準の正本記録）';


--
-- Name: service_provision_system_snapshot_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_provision_system_snapshot_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    staff_role_id uuid,
    role_code character varying(50) NOT NULL,
    role_name character varying(100) NOT NULL,
    is_direct_care boolean DEFAULT false NOT NULL,
    total_actual_hours numeric(8,2) DEFAULT 0.00 NOT NULL,
    fte_value numeric(5,2) DEFAULT 0.00 NOT NULL,
    full_time_count integer DEFAULT 0 NOT NULL,
    part_time_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE service_provision_system_snapshot_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_provision_system_snapshot_details IS 'サービス提供体制スナップショット明細（職種別配置・実労働時間・FTE内訳）';


--
-- Name: service_schemes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.service_schemes AS
 SELECT id,
    id AS office_id,
    name,
    'type_b'::text AS service_type,
    '標準サービス体系'::text AS description,
    580.00::numeric(12,2) AS basic_reward_unit,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.offices;




--
-- Name: service_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    personnel_cost_ratio numeric(5,4) DEFAULT 0.5700 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    valid_from date DEFAULT '2006-10-01'::date,
    valid_to date
);




--
-- Name: COLUMN service_types.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_types.valid_from IS '適用開始年月日（制度施行・新設日）';


--
-- Name: COLUMN service_types.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.service_types.valid_to IS '適用終了年月日（制度廃止日。NULL: 継続中）';


--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: skill_categories_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.skill_categories_view AS
 SELECT id,
    office_id,
    name,
    description,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.skill_categories;




--
-- Name: skill_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    category_id uuid,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: skill_level_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_level_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    level_value integer NOT NULL,
    description text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: skill_levels; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.skill_levels AS
 SELECT id,
    office_id,
    level_value,
    description,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.skill_level_items;




--
-- Name: skills; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.skills AS
 SELECT id,
    office_id,
    category_id,
    name,
    description,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.skill_items;




--
-- Name: staff_attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    staff_id uuid,
    work_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_minutes integer DEFAULT 0 NOT NULL,
    assigned_role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    actual_work_hours numeric(4,2) DEFAULT NULL::numeric,
    remarks text
);




--
-- Name: TABLE staff_attendance_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_attendance_records IS '職員勤務レコード';


--
-- Name: COLUMN staff_attendance_records.remarks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_attendance_records.remarks IS '備考・特記事項';


--
-- Name: staff_basic_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_basic_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    is_work_day boolean DEFAULT true NOT NULL,
    start_time time without time zone DEFAULT '08:30:00'::time without time zone,
    end_time time without time zone DEFAULT '17:30:00'::time without time zone,
    break_minutes integer DEFAULT 60 NOT NULL,
    scheduled_hours numeric(4,2) DEFAULT NULL::numeric,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT staff_basic_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);




--
-- Name: TABLE staff_basic_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_basic_schedules IS '職員基本勤務予定';


--
-- Name: staff_exception_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_exception_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    target_date date NOT NULL,
    is_work_day boolean DEFAULT true NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_minutes integer DEFAULT 60 NOT NULL,
    scheduled_hours numeric(4,2) DEFAULT NULL::numeric,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: TABLE staff_exception_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_exception_schedules IS '職員例外勤務予定';


--
-- Name: staff_qualification_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_qualification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid,
    qualification_id uuid,
    license_number text,
    acquired_on date,
    valid_until date,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: staff_role_setting_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_role_setting_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary_id uuid NOT NULL,
    staff_role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    staff_role_id uuid,
    allocated_hours numeric(4,2) DEFAULT NULL::numeric
);




--
-- Name: TABLE staff_role_setting_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_role_setting_details IS '職員職種割当詳細';


--
-- Name: COLUMN staff_role_setting_details.allocated_hours; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_role_setting_details.allocated_hours IS '職種別週割当時間（複数職種兼務時の直接処遇時間按分用）';


--
-- Name: staff_role_setting_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_role_setting_summaries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employment_type character varying(20),
    duty_type character varying(20),
    weekly_working_hours numeric(5,2),
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    office_staff_setting_id uuid NOT NULL
);




--
-- Name: TABLE staff_role_setting_summaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_role_setting_summaries IS '職員職種割当概要';


--
-- Name: staff_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) DEFAULT '必置職種'::character varying NOT NULL,
    is_direct_care boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    valid_from date DEFAULT '2006-10-01'::date,
    valid_to date
);




--
-- Name: TABLE staff_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.staff_roles IS '職種';


--
-- Name: COLUMN staff_roles.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.id IS '職種ID';


--
-- Name: COLUMN staff_roles.code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.code IS '職種コード';


--
-- Name: COLUMN staff_roles.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.name IS '職種名';


--
-- Name: COLUMN staff_roles.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.category IS '職種区分（必置職種 / 加算職種 / 関連職種）';


--
-- Name: COLUMN staff_roles.is_direct_care; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.is_direct_care IS '直接処遇職員フラグ（常勤換算配置基準算定対象か否か）';


--
-- Name: COLUMN staff_roles.valid_from; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.valid_from IS '適用開始年月日（公定職種新設施行日）';


--
-- Name: COLUMN staff_roles.valid_to; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.staff_roles.valid_to IS '適用終了年月日（職種廃止日。NULL: 継続中）';


--
-- Name: staff_work_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.staff_work_records AS
 SELECT id,
    office_id,
    staff_id,
    work_date,
    start_time,
    end_time,
    break_minutes,
    assigned_role,
    created_at,
    updated_at,
    actual_work_hours,
    remarks
   FROM public.staff_attendance_records;




--
-- Name: staffing_ratio_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staffing_ratio_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    ratio_value numeric(5,2) NOT NULL,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: staffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    code text,
    name text NOT NULL,
    yomigana text,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: users; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.users AS
 SELECT id,
    email,
    role,
    user_type,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.auth_users;




--
-- Name: wage_achievement_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_achievement_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_type_id uuid,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    tier_rank integer NOT NULL,
    min_wage integer NOT NULL,
    max_wage integer,
    valid_from date DEFAULT '2024-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: wage_closing_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_closing_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid NOT NULL,
    closing_day smallint DEFAULT 25 NOT NULL,
    payment_month_type text DEFAULT 'next'::text NOT NULL,
    payment_day smallint DEFAULT 10 NOT NULL,
    average_wage_calc_basis text DEFAULT 'payment_date'::text NOT NULL,
    valid_from date DEFAULT '2020-04-01'::date NOT NULL,
    valid_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wage_closing_settings_average_wage_calc_basis_check CHECK ((average_wage_calc_basis = ANY (ARRAY['closing_date'::text, 'payment_date'::text]))),
    CONSTRAINT wage_closing_settings_closing_day_check CHECK ((((closing_day >= 1) AND (closing_day <= 28)) OR (closing_day = 99))),
    CONSTRAINT wage_closing_settings_payment_day_check CHECK ((((payment_day >= 1) AND (payment_day <= 28)) OR (payment_day = 99))),
    CONSTRAINT wage_closing_settings_payment_month_type_check CHECK ((payment_month_type = ANY (ARRAY['current'::text, 'next'::text, 'next_next'::text])))
);




--
-- Name: TABLE wage_closing_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.wage_closing_settings IS '工賃基準日設定';


--
-- Name: COLUMN wage_closing_settings.closing_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wage_closing_settings.closing_day IS '工賃締め日（1〜28日、99:末日）';


--
-- Name: COLUMN wage_closing_settings.payment_month_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wage_closing_settings.payment_month_type IS '工賃支給月区分（current:当月, next:翌月, next_next:翌々月）';


--
-- Name: COLUMN wage_closing_settings.payment_day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wage_closing_settings.payment_day IS '工賃支給日（1〜28日、99:末日）';


--
-- Name: COLUMN wage_closing_settings.average_wage_calc_basis; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wage_closing_settings.average_wage_calc_basis IS '平均工賃算出基準日区分（closing_date:工賃締め日, payment_date:工賃支給日）';


--
-- Name: wage_rate_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_rate_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    office_id uuid,
    wage numeric(12,2) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    is_deleted boolean GENERATED ALWAYS AS ((deleted_at IS NOT NULL)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: wage_rates; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.wage_rates AS
 SELECT id,
    office_id,
    wage,
    description,
    sort_order,
    deleted_at,
    is_deleted,
    created_at,
    updated_at
   FROM public.wage_rate_items;




--
-- Name: wage_snapshot_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.wage_snapshot_summaries AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    work_time,
    wage_rate,
    basic_wage,
    incentive_total,
    other_allowance_total,
    wage_total,
    service_fee_total,
    service_fee_copayment,
    is_copayment_limit_applied,
    managed_copayment_amount,
    deduction_total,
    payment,
    created_at,
    updated_at,
    service_fee_deduction,
    actual_expense_deduction,
    payment_date
   FROM public.wage_snapshot;




--
-- Name: wage_summaries; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.wage_summaries AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    work_time,
    wage_rate,
    basic_wage,
    incentive_total,
    other_allowance_total,
    wage_total,
    service_fee_total,
    service_fee_copayment,
    is_copayment_limit_applied,
    managed_copayment_amount,
    deduction_total,
    payment,
    created_at,
    updated_at
   FROM public.wage_snapshot;




--
-- Name: work_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.work_records AS
 SELECT id,
    office_id,
    target_period,
    member_id,
    task_id,
    work_time,
    work_location_id,
    created_at,
    updated_at
   FROM public.member_work_records;




--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: allowance_deduction_snapshot allowance_deduction_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_snapshot
    ADD CONSTRAINT allowance_deduction_details_pkey PRIMARY KEY (id);


--
-- Name: allowance_deduction_items allowance_deduction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_items
    ADD CONSTRAINT allowance_deduction_items_pkey PRIMARY KEY (id);


--
-- Name: allowance_deduction_records allowance_deduction_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_records
    ADD CONSTRAINT allowance_deduction_records_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: base_reward_items base_reward_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.base_reward_items
    ADD CONSTRAINT base_reward_items_pkey PRIMARY KEY (id);


--
-- Name: capacity_tiers capacity_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_tiers
    ADD CONSTRAINT capacity_tiers_pkey PRIMARY KEY (id);


--
-- Name: daily_closings daily_record_closings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_record_closings_pkey PRIMARY KEY (id);


--
-- Name: daily_closings daily_record_closings_target_period_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_record_closings_target_period_key UNIQUE (target_period);


--
-- Name: email_addresses email_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_addresses
    ADD CONSTRAINT email_addresses_pkey PRIMARY KEY (id);


--
-- Name: entity_address_settings entity_address_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_address_settings
    ADD CONSTRAINT entity_address_settings_pkey PRIMARY KEY (id);


--
-- Name: entity_email_settings entity_email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_email_settings
    ADD CONSTRAINT entity_email_settings_pkey PRIMARY KEY (id);


--
-- Name: entity_phone_settings entity_phone_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_phone_settings
    ADD CONSTRAINT entity_phone_settings_pkey PRIMARY KEY (id);


--
-- Name: financial_snapshot general_financial_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_snapshot
    ADD CONSTRAINT general_financial_details_pkey PRIMARY KEY (id);


--
-- Name: financial_records general_financial_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT general_financial_records_pkey PRIMARY KEY (id);


--
-- Name: incentive_snapshot incentive_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_snapshot
    ADD CONSTRAINT incentive_details_pkey PRIMARY KEY (id);


--
-- Name: incentive_records incentive_records_period_member_task_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_records
    ADD CONSTRAINT incentive_records_period_member_task_key UNIQUE (target_period, member_id, task_id);


--
-- Name: incentive_records incentive_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_records
    ADD CONSTRAINT incentive_records_pkey PRIMARY KEY (id);


--
-- Name: member_attendance_records member_attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_attendance_records
    ADD CONSTRAINT member_attendance_records_pkey PRIMARY KEY (id);


--
-- Name: member_attendance_records member_attendance_records_target_period_member_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_attendance_records
    ADD CONSTRAINT member_attendance_records_target_period_member_id_key UNIQUE (target_period, member_id);


--
-- Name: member_basic_schedules member_basic_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_basic_schedules
    ADD CONSTRAINT member_basic_schedules_pkey PRIMARY KEY (id);


--
-- Name: member_exception_schedules member_exception_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_exception_schedules
    ADD CONSTRAINT member_exception_schedules_pkey PRIMARY KEY (id);


--
-- Name: member_recipient_certificates member_recipient_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_recipient_certificates
    ADD CONSTRAINT member_recipient_certificates_pkey PRIMARY KEY (id);


--
-- Name: member_skill_setting_details member_skill_setting_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_details
    ADD CONSTRAINT member_skill_setting_details_pkey PRIMARY KEY (id);


--
-- Name: member_skill_setting_details member_skill_setting_details_summary_skill_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_details
    ADD CONSTRAINT member_skill_setting_details_summary_skill_key UNIQUE (summary_id, skill_id);


--
-- Name: member_skill_setting_summaries member_skill_setting_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_summaries
    ADD CONSTRAINT member_skill_setting_summaries_pkey PRIMARY KEY (id);


--
-- Name: member_skill_settings member_skill_settings_member_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_settings
    ADD CONSTRAINT member_skill_settings_member_id_skill_id_key UNIQUE (member_id, skill_id);


--
-- Name: member_skill_settings member_skill_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_settings
    ADD CONSTRAINT member_skill_settings_pkey PRIMARY KEY (id);


--
-- Name: member_wage_settings member_wage_settings_member_id_start_period_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_wage_settings
    ADD CONSTRAINT member_wage_settings_member_id_start_period_key UNIQUE (member_id, start_period);


--
-- Name: member_wage_settings member_wage_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_wage_settings
    ADD CONSTRAINT member_wage_settings_pkey PRIMARY KEY (id);


--
-- Name: member_work_records member_work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_work_records
    ADD CONSTRAINT member_work_records_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: monthly_closings monthly_closings_office_id_target_period_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_closings
    ADD CONSTRAINT monthly_closings_office_id_target_period_key UNIQUE (office_id, target_period);


--
-- Name: monthly_closings monthly_closings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_closings
    ADD CONSTRAINT monthly_closings_pkey PRIMARY KEY (id);


--
-- Name: office_member_setting_details office_member_setting_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_details
    ADD CONSTRAINT office_member_setting_details_pkey PRIMARY KEY (id);


--
-- Name: office_member_setting_summaries office_member_setting_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_summaries
    ADD CONSTRAINT office_member_setting_summaries_pkey PRIMARY KEY (id);


--
-- Name: office_reward_setting_details office_reward_setting_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_details
    ADD CONSTRAINT office_reward_setting_details_pkey PRIMARY KEY (id);


--
-- Name: office_reward_setting_summaries office_reward_setting_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_summaries
    ADD CONSTRAINT office_reward_setting_summaries_pkey PRIMARY KEY (id);


--
-- Name: office_service_type_setting_details office_service_type_setting_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_details
    ADD CONSTRAINT office_service_type_setting_details_pkey PRIMARY KEY (id);


--
-- Name: office_service_type_setting_summaries office_service_type_setting_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_summaries
    ADD CONSTRAINT office_service_type_setting_summaries_pkey PRIMARY KEY (id);


--
-- Name: staff_role_setting_details office_staff_setting_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_role_setting_details
    ADD CONSTRAINT office_staff_setting_details_pkey PRIMARY KEY (id);


--
-- Name: office_staff_setting_details office_staff_setting_details_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_details
    ADD CONSTRAINT office_staff_setting_details_pkey1 PRIMARY KEY (id);


--
-- Name: staff_role_setting_summaries office_staff_setting_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_role_setting_summaries
    ADD CONSTRAINT office_staff_setting_summaries_pkey PRIMARY KEY (id);


--
-- Name: office_staff_setting_summaries office_staff_setting_summaries_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_summaries
    ADD CONSTRAINT office_staff_setting_summaries_pkey1 PRIMARY KEY (id);


--
-- Name: offices offices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offices
    ADD CONSTRAINT offices_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: partner_contacts partner_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_contacts
    ADD CONSTRAINT partner_contacts_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: phone_numbers phone_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_numbers
    ADD CONSTRAINT phone_numbers_pkey PRIMARY KEY (id);


--
-- Name: project_budgets project_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_pkey PRIMARY KEY (id);


--
-- Name: project_tasks project_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_tasks
    ADD CONSTRAINT project_tasks_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: qualifications qualifications_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_code_key UNIQUE (code);


--
-- Name: qualifications qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qualifications
    ADD CONSTRAINT qualifications_pkey PRIMARY KEY (id);


--
-- Name: regional_grade_locations regional_grade_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regional_grade_locations
    ADD CONSTRAINT regional_grade_locations_pkey PRIMARY KEY (id);


--
-- Name: regional_grade_rates regional_grade_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regional_grade_rates
    ADD CONSTRAINT regional_grade_rates_pkey PRIMARY KEY (id);


--
-- Name: reserve_items reserve_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserve_items
    ADD CONSTRAINT reserve_items_pkey PRIMARY KEY (id);


--
-- Name: reward_items reward_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_items
    ADD CONSTRAINT reward_items_pkey PRIMARY KEY (id);


--
-- Name: salary_closing_settings salary_closing_settings_office_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_closing_settings
    ADD CONSTRAINT salary_closing_settings_office_valid_from_key UNIQUE (office_id, valid_from);


--
-- Name: salary_closing_settings salary_closing_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_closing_settings
    ADD CONSTRAINT salary_closing_settings_pkey PRIMARY KEY (id);


--
-- Name: service_billing_snapshot_details service_billing_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot_details
    ADD CONSTRAINT service_billing_details_pkey PRIMARY KEY (id);


--
-- Name: service_billing_snapshot service_billing_summaries_office_period_member_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot
    ADD CONSTRAINT service_billing_summaries_office_period_member_key UNIQUE (office_id, target_period, member_id);


--
-- Name: service_billing_snapshot service_billing_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot
    ADD CONSTRAINT service_billing_summaries_pkey PRIMARY KEY (id);


--
-- Name: service_provision_system_snapshot_details service_provision_system_snapshot_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot_details
    ADD CONSTRAINT service_provision_system_snapshot_details_pkey PRIMARY KEY (id);


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_pkey PRIMARY KEY (id);


--
-- Name: service_types service_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_code_key UNIQUE (code);


--
-- Name: service_types service_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: skill_items skill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_items
    ADD CONSTRAINT skill_items_pkey PRIMARY KEY (id);


--
-- Name: skill_level_items skill_level_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_level_items
    ADD CONSTRAINT skill_level_items_pkey PRIMARY KEY (id);


--
-- Name: staff_attendance_records staff_attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_attendance_records
    ADD CONSTRAINT staff_attendance_records_pkey PRIMARY KEY (id);


--
-- Name: staff_basic_schedules staff_basic_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_basic_schedules
    ADD CONSTRAINT staff_basic_schedules_pkey PRIMARY KEY (id);


--
-- Name: staff_exception_schedules staff_exception_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_exception_schedules
    ADD CONSTRAINT staff_exception_schedules_pkey PRIMARY KEY (id);


--
-- Name: staff_qualification_settings staff_qualification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_qualification_settings
    ADD CONSTRAINT staff_qualification_settings_pkey PRIMARY KEY (id);


--
-- Name: staff_roles staff_roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_code_key UNIQUE (code);


--
-- Name: staff_roles staff_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_pkey PRIMARY KEY (id);


--
-- Name: staffing_ratio_tiers staffing_ratio_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffing_ratio_tiers
    ADD CONSTRAINT staffing_ratio_tiers_pkey PRIMARY KEY (id);


--
-- Name: staffs staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_pkey PRIMARY KEY (id);


--
-- Name: task_assignee_settings task_assignee_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignee_settings
    ADD CONSTRAINT task_assignee_settings_pkey PRIMARY KEY (id);


--
-- Name: task_skill_settings task_skill_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_skill_settings
    ADD CONSTRAINT task_skill_settings_pkey PRIMARY KEY (id);


--
-- Name: task_skill_settings task_skill_settings_task_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_skill_settings
    ADD CONSTRAINT task_skill_settings_task_id_skill_id_key UNIQUE (task_id, skill_id);


--
-- Name: capacity_tiers uq_capacity_tiers_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_tiers
    ADD CONSTRAINT uq_capacity_tiers_code UNIQUE (code);


--
-- Name: member_basic_schedules uq_member_basic_schedules; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_basic_schedules
    ADD CONSTRAINT uq_member_basic_schedules UNIQUE (office_id, member_id, day_of_week);


--
-- Name: member_exception_schedules uq_member_exception_schedules; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_exception_schedules
    ADD CONSTRAINT uq_member_exception_schedules UNIQUE (office_id, member_id, target_date);


--
-- Name: office_member_setting_details uq_office_member_details; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_details
    ADD CONSTRAINT uq_office_member_details UNIQUE (summary_id, member_id);


--
-- Name: office_reward_setting_details uq_office_reward_setting_details_summary_item; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_details
    ADD CONSTRAINT uq_office_reward_setting_details_summary_item UNIQUE (summary_id, reward_item_id);


--
-- Name: office_service_type_setting_details uq_office_service_type_details; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_details
    ADD CONSTRAINT uq_office_service_type_details UNIQUE (summary_id, service_type_id);


--
-- Name: office_staff_setting_details uq_office_staff_details; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_details
    ADD CONSTRAINT uq_office_staff_details UNIQUE (summary_id, staff_id);


--
-- Name: staff_role_setting_details uq_office_staff_setting_details_summary_role; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_role_setting_details
    ADD CONSTRAINT uq_office_staff_setting_details_summary_role UNIQUE (summary_id, staff_role);


--
-- Name: regional_grade_locations uq_regional_grade_locations_pref_city; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regional_grade_locations
    ADD CONSTRAINT uq_regional_grade_locations_pref_city UNIQUE (prefecture, city);


--
-- Name: regional_grade_rates uq_regional_grade_rates_grade; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regional_grade_rates
    ADD CONSTRAINT uq_regional_grade_rates_grade UNIQUE (grade);


--
-- Name: service_provision_system_snapshot uq_service_provision_snapshot_period; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT uq_service_provision_snapshot_period UNIQUE (office_id, service_type_id, target_period);


--
-- Name: staff_basic_schedules uq_staff_basic_schedules; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_basic_schedules
    ADD CONSTRAINT uq_staff_basic_schedules UNIQUE (office_id, staff_id, day_of_week);


--
-- Name: staff_exception_schedules uq_staff_exception_schedules; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_exception_schedules
    ADD CONSTRAINT uq_staff_exception_schedules UNIQUE (office_id, staff_id, target_date);


--
-- Name: staffing_ratio_tiers uq_staffing_ratio_tiers_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffing_ratio_tiers
    ADD CONSTRAINT uq_staffing_ratio_tiers_code UNIQUE (code);


--
-- Name: wage_achievement_tiers uq_wage_achievement_tiers_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_achievement_tiers
    ADD CONSTRAINT uq_wage_achievement_tiers_code UNIQUE (code);


--
-- Name: wage_achievement_tiers wage_achievement_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_achievement_tiers
    ADD CONSTRAINT wage_achievement_tiers_pkey PRIMARY KEY (id);


--
-- Name: wage_closing_settings wage_closing_settings_office_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_closing_settings
    ADD CONSTRAINT wage_closing_settings_office_valid_from_key UNIQUE (office_id, valid_from);


--
-- Name: wage_closing_settings wage_closing_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_closing_settings
    ADD CONSTRAINT wage_closing_settings_pkey PRIMARY KEY (id);


--
-- Name: wage_rate_items wage_rate_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_rate_items
    ADD CONSTRAINT wage_rate_items_pkey PRIMARY KEY (id);


--
-- Name: wage_snapshot wage_summaries_office_id_target_period_member_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_snapshot
    ADD CONSTRAINT wage_summaries_office_id_target_period_member_id_key UNIQUE (office_id, target_period, member_id);


--
-- Name: wage_snapshot wage_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_snapshot
    ADD CONSTRAINT wage_summaries_pkey PRIMARY KEY (id);


--
-- Name: idx_allowance_deduction_details_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_allowance_deduction_details_category ON public.allowance_deduction_snapshot USING btree (summary_id, item_category);


--
-- Name: idx_allowance_deduction_details_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_allowance_deduction_details_item_id ON public.allowance_deduction_snapshot USING btree (item_id);


--
-- Name: idx_allowance_deduction_details_summary_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_allowance_deduction_details_summary_id ON public.allowance_deduction_snapshot USING btree (summary_id);


--
-- Name: idx_base_reward_items_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_base_reward_items_lookup ON public.base_reward_items USING btree (service_type_id, capacity_tier, staffing_ratio, wage_achievement_tier, valid_from);


--
-- Name: idx_member_basic_schedules_office_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_basic_schedules_office_member ON public.member_basic_schedules USING btree (office_id, member_id);


--
-- Name: idx_member_exception_schedules_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_exception_schedules_lookup ON public.member_exception_schedules USING btree (office_id, member_id, target_date);


--
-- Name: idx_member_skill_setting_details_skill_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_skill_setting_details_skill_id ON public.member_skill_setting_details USING btree (skill_id);


--
-- Name: idx_member_skill_setting_details_summary_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_skill_setting_details_summary_id ON public.member_skill_setting_details USING btree (summary_id);


--
-- Name: idx_member_skill_setting_summaries_member_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_skill_setting_summaries_member_id ON public.member_skill_setting_summaries USING btree (member_id);


--
-- Name: idx_member_skill_setting_summaries_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_skill_setting_summaries_period ON public.member_skill_setting_summaries USING btree (member_id, valid_from, valid_to);


--
-- Name: idx_member_work_records_work_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_member_work_records_work_location_id ON public.member_work_records USING btree (work_location_id);


--
-- Name: idx_office_member_setting_details_member; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_member_setting_details_member ON public.office_member_setting_details USING btree (member_id);


--
-- Name: idx_office_member_setting_details_summary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_member_setting_details_summary ON public.office_member_setting_details USING btree (summary_id);


--
-- Name: idx_office_member_setting_summaries_office_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_member_setting_summaries_office_period ON public.office_member_setting_summaries USING btree (office_id, valid_from, valid_to);


--
-- Name: idx_office_reward_setting_details_reward_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_reward_setting_details_reward_item_id ON public.office_reward_setting_details USING btree (reward_item_id);


--
-- Name: idx_office_reward_setting_details_summary_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_reward_setting_details_summary_id ON public.office_reward_setting_details USING btree (summary_id);


--
-- Name: idx_office_reward_setting_summaries_office_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_reward_setting_summaries_office_id ON public.office_reward_setting_summaries USING btree (office_id);


--
-- Name: idx_office_reward_setting_summaries_service_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_reward_setting_summaries_service_type_id ON public.office_reward_setting_summaries USING btree (service_type_id);


--
-- Name: idx_office_reward_setting_summaries_valid_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_reward_setting_summaries_valid_period ON public.office_reward_setting_summaries USING btree (office_id, valid_from, valid_to);


--
-- Name: idx_office_service_type_setting_details_summary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_service_type_setting_details_summary ON public.office_service_type_setting_details USING btree (summary_id);


--
-- Name: idx_office_service_type_setting_summaries_office_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_service_type_setting_summaries_office_period ON public.office_service_type_setting_summaries USING btree (office_id, valid_from, valid_to);


--
-- Name: idx_office_staff_setting_details_staff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_staff_setting_details_staff ON public.office_staff_setting_details USING btree (staff_id);


--
-- Name: idx_office_staff_setting_details_summary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_staff_setting_details_summary ON public.office_staff_setting_details USING btree (summary_id);


--
-- Name: idx_office_staff_setting_summaries_office_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_office_staff_setting_summaries_office_period ON public.office_staff_setting_summaries USING btree (office_id, valid_from, valid_to);


--
-- Name: idx_regional_grade_locations_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_regional_grade_locations_grade ON public.regional_grade_locations USING btree (grade);


--
-- Name: idx_regional_grade_locations_pref_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_regional_grade_locations_pref_city ON public.regional_grade_locations USING btree (prefecture, city);


--
-- Name: idx_service_provision_details_summary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_provision_details_summary ON public.service_provision_system_snapshot_details USING btree (summary_id);


--
-- Name: idx_service_provision_snapshot_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_provision_snapshot_lookup ON public.service_provision_system_snapshot USING btree (office_id, target_period);


--
-- Name: idx_staff_basic_schedules_office_staff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_basic_schedules_office_staff ON public.staff_basic_schedules USING btree (office_id, staff_id);


--
-- Name: idx_staff_exception_schedules_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_exception_schedules_lookup ON public.staff_exception_schedules USING btree (office_id, staff_id, target_date);


--
-- Name: idx_staff_role_setting_details_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_role_setting_details_role_id ON public.staff_role_setting_details USING btree (staff_role_id);


--
-- Name: idx_staff_role_setting_details_staff_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_role_setting_details_staff_role ON public.staff_role_setting_details USING btree (staff_role);


--
-- Name: idx_staff_role_setting_details_summary_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_role_setting_details_summary_id ON public.staff_role_setting_details USING btree (summary_id);


--
-- Name: idx_staff_role_setting_summaries_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_role_setting_summaries_period ON public.staff_role_setting_summaries USING btree (office_staff_setting_id, valid_from, valid_to);


--
-- Name: idx_staff_role_setting_summaries_setting_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_role_setting_summaries_setting_id ON public.staff_role_setting_summaries USING btree (office_staff_setting_id);


--
-- Name: idx_staff_roles_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_roles_category ON public.staff_roles USING btree (category);


--
-- Name: idx_staff_roles_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_roles_code ON public.staff_roles USING btree (code);


--
-- Name: member_basic_schedules trg_member_basic_schedules_calc_hours; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_member_basic_schedules_calc_hours BEFORE INSERT OR UPDATE ON public.member_basic_schedules FOR EACH ROW EXECUTE FUNCTION public.calc_member_service_hours();


--
-- Name: member_exception_schedules trg_member_exception_schedules_calc_hours; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_member_exception_schedules_calc_hours BEFORE INSERT OR UPDATE ON public.member_exception_schedules FOR EACH ROW EXECUTE FUNCTION public.calc_member_service_hours();


--
-- Name: office_member_settings trg_office_member_settings_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_member_settings_delete INSTEAD OF DELETE ON public.office_member_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_delete();


--
-- Name: office_member_settings trg_office_member_settings_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_member_settings_insert INSTEAD OF INSERT ON public.office_member_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_insert();


--
-- Name: office_member_settings trg_office_member_settings_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_member_settings_update INSTEAD OF UPDATE ON public.office_member_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_member_settings_update();


--
-- Name: office_staff_settings trg_office_staff_settings_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_staff_settings_delete INSTEAD OF DELETE ON public.office_staff_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_delete();


--
-- Name: office_staff_settings trg_office_staff_settings_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_staff_settings_insert INSTEAD OF INSERT ON public.office_staff_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_insert();


--
-- Name: office_staff_settings trg_office_staff_settings_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_office_staff_settings_update INSTEAD OF UPDATE ON public.office_staff_settings FOR EACH ROW EXECUTE FUNCTION public.handle_office_staff_settings_update();


--
-- Name: staff_basic_schedules trg_staff_basic_schedules_calc_hours; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_staff_basic_schedules_calc_hours BEFORE INSERT OR UPDATE ON public.staff_basic_schedules FOR EACH ROW EXECUTE FUNCTION public.calc_staff_scheduled_hours();


--
-- Name: staff_exception_schedules trg_staff_exception_schedules_calc_hours; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_staff_exception_schedules_calc_hours BEFORE INSERT OR UPDATE ON public.staff_exception_schedules FOR EACH ROW EXECUTE FUNCTION public.calc_staff_scheduled_hours();


--
-- Name: users users_view_insert_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_view_insert_trigger INSTEAD OF INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_users_view_insert();


--
-- Name: users users_view_update_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_view_update_trigger INSTEAD OF UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_users_view_update();


--
-- Name: allowance_deduction_snapshot allowance_deduction_details_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_snapshot
    ADD CONSTRAINT allowance_deduction_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.allowance_deduction_items(id) ON DELETE SET NULL;


--
-- Name: allowance_deduction_snapshot allowance_deduction_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_snapshot
    ADD CONSTRAINT allowance_deduction_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.wage_snapshot(id) ON DELETE CASCADE;


--
-- Name: allowance_deduction_items allowance_deduction_items_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_items
    ADD CONSTRAINT allowance_deduction_items_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: allowance_deduction_records allowance_deduction_records_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_records
    ADD CONSTRAINT allowance_deduction_records_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.allowance_deduction_items(id) ON DELETE RESTRICT;


--
-- Name: allowance_deduction_records allowance_deduction_records_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.allowance_deduction_records
    ADD CONSTRAINT allowance_deduction_records_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: base_reward_items base_reward_items_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.base_reward_items
    ADD CONSTRAINT base_reward_items_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: capacity_tiers capacity_tiers_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capacity_tiers
    ADD CONSTRAINT capacity_tiers_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: daily_closings daily_record_closings_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_record_closings_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: entity_address_settings entity_address_settings_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_address_settings
    ADD CONSTRAINT entity_address_settings_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE CASCADE;


--
-- Name: entity_email_settings entity_email_settings_email_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_email_settings
    ADD CONSTRAINT entity_email_settings_email_address_id_fkey FOREIGN KEY (email_address_id) REFERENCES public.email_addresses(id) ON DELETE CASCADE;


--
-- Name: entity_phone_settings entity_phone_settings_phone_number_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entity_phone_settings
    ADD CONSTRAINT entity_phone_settings_phone_number_id_fkey FOREIGN KEY (phone_number_id) REFERENCES public.phone_numbers(id) ON DELETE CASCADE;


--
-- Name: regional_grade_locations fk_regional_grade_locations_grade; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.regional_grade_locations
    ADD CONSTRAINT fk_regional_grade_locations_grade FOREIGN KEY (grade) REFERENCES public.regional_grade_rates(grade) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: financial_snapshot general_financial_details_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_snapshot
    ADD CONSTRAINT general_financial_details_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: financial_snapshot general_financial_details_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_snapshot
    ADD CONSTRAINT general_financial_details_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: financial_snapshot general_financial_details_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_snapshot
    ADD CONSTRAINT general_financial_details_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: financial_snapshot general_financial_details_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_snapshot
    ADD CONSTRAINT general_financial_details_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: financial_records general_financial_records_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT general_financial_records_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: financial_records general_financial_records_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT general_financial_records_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: financial_records general_financial_records_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT general_financial_records_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: financial_records general_financial_records_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT general_financial_records_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: incentive_snapshot incentive_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_snapshot
    ADD CONSTRAINT incentive_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.wage_snapshot(id) ON DELETE CASCADE;


--
-- Name: incentive_snapshot incentive_details_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_snapshot
    ADD CONSTRAINT incentive_details_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE SET NULL;


--
-- Name: incentive_records incentive_records_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_records
    ADD CONSTRAINT incentive_records_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: incentive_records incentive_records_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incentive_records
    ADD CONSTRAINT incentive_records_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE SET NULL;


--
-- Name: member_attendance_records member_attendance_records_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_attendance_records
    ADD CONSTRAINT member_attendance_records_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_attendance_records member_attendance_records_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_attendance_records
    ADD CONSTRAINT member_attendance_records_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: member_basic_schedules member_basic_schedules_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_basic_schedules
    ADD CONSTRAINT member_basic_schedules_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_basic_schedules member_basic_schedules_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_basic_schedules
    ADD CONSTRAINT member_basic_schedules_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: member_exception_schedules member_exception_schedules_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_exception_schedules
    ADD CONSTRAINT member_exception_schedules_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_exception_schedules member_exception_schedules_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_exception_schedules
    ADD CONSTRAINT member_exception_schedules_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: member_recipient_certificates member_recipient_certificates_copayment_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_recipient_certificates
    ADD CONSTRAINT member_recipient_certificates_copayment_office_id_fkey FOREIGN KEY (copayment_office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: member_recipient_certificates member_recipient_certificates_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_recipient_certificates
    ADD CONSTRAINT member_recipient_certificates_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_skill_setting_details member_skill_setting_details_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_details
    ADD CONSTRAINT member_skill_setting_details_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill_items(id) ON DELETE CASCADE;


--
-- Name: member_skill_setting_details member_skill_setting_details_skill_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_details
    ADD CONSTRAINT member_skill_setting_details_skill_level_id_fkey FOREIGN KEY (skill_level_id) REFERENCES public.skill_level_items(id) ON DELETE CASCADE;


--
-- Name: member_skill_setting_details member_skill_setting_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_details
    ADD CONSTRAINT member_skill_setting_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.member_skill_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: member_skill_setting_summaries member_skill_setting_summaries_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_setting_summaries
    ADD CONSTRAINT member_skill_setting_summaries_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_skill_settings member_skill_settings_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_settings
    ADD CONSTRAINT member_skill_settings_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_skill_settings member_skill_settings_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_settings
    ADD CONSTRAINT member_skill_settings_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill_items(id) ON DELETE CASCADE;


--
-- Name: member_skill_settings member_skill_settings_skill_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_skill_settings
    ADD CONSTRAINT member_skill_settings_skill_level_id_fkey FOREIGN KEY (skill_level_id) REFERENCES public.skill_level_items(id) ON DELETE CASCADE;


--
-- Name: member_wage_settings member_wage_settings_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_wage_settings
    ADD CONSTRAINT member_wage_settings_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_wage_settings member_wage_settings_wage_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_wage_settings
    ADD CONSTRAINT member_wage_settings_wage_rate_id_fkey FOREIGN KEY (wage_rate_id) REFERENCES public.wage_rate_items(id) ON DELETE CASCADE;


--
-- Name: member_work_records member_work_records_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_work_records
    ADD CONSTRAINT member_work_records_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_work_records member_work_records_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_work_records
    ADD CONSTRAINT member_work_records_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: member_work_records member_work_records_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_work_records
    ADD CONSTRAINT member_work_records_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;


--
-- Name: member_work_records member_work_records_work_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_work_records
    ADD CONSTRAINT member_work_records_work_location_id_fkey FOREIGN KEY (work_location_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: members members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: monthly_closings monthly_closings_financial_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_closings
    ADD CONSTRAINT monthly_closings_financial_confirmed_by_fkey FOREIGN KEY (financial_confirmed_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: monthly_closings monthly_closings_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_closings
    ADD CONSTRAINT monthly_closings_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: monthly_closings monthly_closings_settlement_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_closings
    ADD CONSTRAINT monthly_closings_settlement_confirmed_by_fkey FOREIGN KEY (settlement_confirmed_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: office_member_setting_details office_member_setting_details_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_details
    ADD CONSTRAINT office_member_setting_details_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: office_member_setting_details office_member_setting_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_details
    ADD CONSTRAINT office_member_setting_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.office_member_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: office_member_setting_summaries office_member_setting_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_member_setting_summaries
    ADD CONSTRAINT office_member_setting_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: office_reward_setting_details office_reward_setting_details_reward_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_details
    ADD CONSTRAINT office_reward_setting_details_reward_item_id_fkey FOREIGN KEY (reward_item_id) REFERENCES public.reward_items(id) ON DELETE CASCADE;


--
-- Name: office_reward_setting_details office_reward_setting_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_details
    ADD CONSTRAINT office_reward_setting_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.office_reward_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: office_reward_setting_summaries office_reward_setting_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_summaries
    ADD CONSTRAINT office_reward_setting_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: office_reward_setting_summaries office_reward_setting_summaries_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_reward_setting_summaries
    ADD CONSTRAINT office_reward_setting_summaries_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: office_service_type_setting_details office_service_type_setting_details_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_details
    ADD CONSTRAINT office_service_type_setting_details_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE RESTRICT;


--
-- Name: office_service_type_setting_details office_service_type_setting_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_details
    ADD CONSTRAINT office_service_type_setting_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.office_service_type_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: office_service_type_setting_summaries office_service_type_setting_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_service_type_setting_summaries
    ADD CONSTRAINT office_service_type_setting_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: office_staff_setting_details office_staff_setting_details_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_details
    ADD CONSTRAINT office_staff_setting_details_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE CASCADE;


--
-- Name: staff_role_setting_details office_staff_setting_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_role_setting_details
    ADD CONSTRAINT office_staff_setting_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.staff_role_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: office_staff_setting_details office_staff_setting_details_summary_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_details
    ADD CONSTRAINT office_staff_setting_details_summary_id_fkey1 FOREIGN KEY (summary_id) REFERENCES public.office_staff_setting_summaries(id) ON DELETE CASCADE;


--
-- Name: office_staff_setting_summaries office_staff_setting_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.office_staff_setting_summaries
    ADD CONSTRAINT office_staff_setting_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: partner_contacts partner_contacts_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_contacts
    ADD CONSTRAINT partner_contacts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: project_budgets project_budgets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_budgets project_budgets_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_budgets
    ADD CONSTRAINT project_budgets_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;


--
-- Name: project_tasks project_tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_tasks
    ADD CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: projects projects_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: reserve_items reserve_items_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserve_items
    ADD CONSTRAINT reserve_items_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: reward_items reward_items_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reward_items
    ADD CONSTRAINT reward_items_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: salary_closing_settings salary_closing_settings_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_closing_settings
    ADD CONSTRAINT salary_closing_settings_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: service_billing_snapshot_details service_billing_details_reward_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot_details
    ADD CONSTRAINT service_billing_details_reward_item_id_fkey FOREIGN KEY (reward_item_id) REFERENCES public.reward_items(id) ON DELETE SET NULL;


--
-- Name: service_billing_snapshot_details service_billing_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot_details
    ADD CONSTRAINT service_billing_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.service_billing_snapshot(id) ON DELETE CASCADE;


--
-- Name: service_billing_snapshot service_billing_summaries_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot
    ADD CONSTRAINT service_billing_summaries_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: service_billing_snapshot service_billing_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_billing_snapshot
    ADD CONSTRAINT service_billing_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_capacity_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_capacity_tier_id_fkey FOREIGN KEY (capacity_tier_id) REFERENCES public.capacity_tiers(id) ON DELETE SET NULL;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: service_provision_system_snapshot_details service_provision_system_snapshot_details_staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot_details
    ADD CONSTRAINT service_provision_system_snapshot_details_staff_role_id_fkey FOREIGN KEY (staff_role_id) REFERENCES public.staff_roles(id) ON DELETE SET NULL;


--
-- Name: service_provision_system_snapshot_details service_provision_system_snapshot_details_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot_details
    ADD CONSTRAINT service_provision_system_snapshot_details_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.service_provision_system_snapshot(id) ON DELETE CASCADE;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_staffing_ratio_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_staffing_ratio_tier_id_fkey FOREIGN KEY (staffing_ratio_tier_id) REFERENCES public.staffing_ratio_tiers(id) ON DELETE SET NULL;


--
-- Name: service_provision_system_snapshot service_provision_system_snapshot_wage_achievement_tier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provision_system_snapshot
    ADD CONSTRAINT service_provision_system_snapshot_wage_achievement_tier_id_fkey FOREIGN KEY (wage_achievement_tier_id) REFERENCES public.wage_achievement_tiers(id) ON DELETE SET NULL;


--
-- Name: skill_categories skill_categories_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: skill_items skill_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_items
    ADD CONSTRAINT skill_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.skill_categories(id) ON DELETE SET NULL;


--
-- Name: skill_items skill_items_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_items
    ADD CONSTRAINT skill_items_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: skill_level_items skill_level_items_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_level_items
    ADD CONSTRAINT skill_level_items_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: staff_attendance_records staff_attendance_records_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_attendance_records
    ADD CONSTRAINT staff_attendance_records_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE SET NULL;


--
-- Name: staff_attendance_records staff_attendance_records_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_attendance_records
    ADD CONSTRAINT staff_attendance_records_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE CASCADE;


--
-- Name: staff_basic_schedules staff_basic_schedules_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_basic_schedules
    ADD CONSTRAINT staff_basic_schedules_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: staff_basic_schedules staff_basic_schedules_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_basic_schedules
    ADD CONSTRAINT staff_basic_schedules_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE CASCADE;


--
-- Name: staff_exception_schedules staff_exception_schedules_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_exception_schedules
    ADD CONSTRAINT staff_exception_schedules_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: staff_exception_schedules staff_exception_schedules_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_exception_schedules
    ADD CONSTRAINT staff_exception_schedules_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE CASCADE;


--
-- Name: staff_qualification_settings staff_qualification_settings_qualification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_qualification_settings
    ADD CONSTRAINT staff_qualification_settings_qualification_id_fkey FOREIGN KEY (qualification_id) REFERENCES public.qualifications(id) ON DELETE CASCADE;


--
-- Name: staff_qualification_settings staff_qualification_settings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_qualification_settings
    ADD CONSTRAINT staff_qualification_settings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE CASCADE;


--
-- Name: staff_role_setting_details staff_role_details_staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_role_setting_details
    ADD CONSTRAINT staff_role_details_staff_role_id_fkey FOREIGN KEY (staff_role_id) REFERENCES public.staff_roles(id) ON DELETE CASCADE;


--
-- Name: staffing_ratio_tiers staffing_ratio_tiers_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffing_ratio_tiers
    ADD CONSTRAINT staffing_ratio_tiers_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: staffs staffs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: task_assignee_settings task_assignee_settings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignee_settings
    ADD CONSTRAINT task_assignee_settings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.partners(id) ON DELETE SET NULL;


--
-- Name: task_assignee_settings task_assignee_settings_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignee_settings
    ADD CONSTRAINT task_assignee_settings_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: task_assignee_settings task_assignee_settings_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignee_settings
    ADD CONSTRAINT task_assignee_settings_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON DELETE SET NULL;


--
-- Name: task_assignee_settings task_assignee_settings_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignee_settings
    ADD CONSTRAINT task_assignee_settings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;


--
-- Name: task_skill_settings task_skill_settings_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_skill_settings
    ADD CONSTRAINT task_skill_settings_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill_items(id) ON DELETE CASCADE;


--
-- Name: task_skill_settings task_skill_settings_skill_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_skill_settings
    ADD CONSTRAINT task_skill_settings_skill_level_id_fkey FOREIGN KEY (skill_level_id) REFERENCES public.skill_level_items(id) ON DELETE SET NULL;


--
-- Name: task_skill_settings task_skill_settings_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_skill_settings
    ADD CONSTRAINT task_skill_settings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;


--
-- Name: wage_achievement_tiers wage_achievement_tiers_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_achievement_tiers
    ADD CONSTRAINT wage_achievement_tiers_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: wage_closing_settings wage_closing_settings_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_closing_settings
    ADD CONSTRAINT wage_closing_settings_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: wage_rate_items wage_rate_items_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_rate_items
    ADD CONSTRAINT wage_rate_items_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: wage_snapshot wage_summaries_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_snapshot
    ADD CONSTRAINT wage_summaries_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: wage_snapshot wage_summaries_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wage_snapshot
    ADD CONSTRAINT wage_summaries_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.offices(id) ON DELETE CASCADE;


--
-- Name: addresses Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.addresses USING (true) WITH CHECK (true);


--
-- Name: allowance_deduction_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.allowance_deduction_items USING (true) WITH CHECK (true);


--
-- Name: allowance_deduction_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.allowance_deduction_records USING (true) WITH CHECK (true);


--
-- Name: allowance_deduction_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.allowance_deduction_snapshot USING (true) WITH CHECK (true);


--
-- Name: auth_users Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.auth_users USING (true) WITH CHECK (true);


--
-- Name: base_reward_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.base_reward_items USING (true) WITH CHECK (true);


--
-- Name: capacity_tiers Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.capacity_tiers USING (true) WITH CHECK (true);


--
-- Name: daily_closings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.daily_closings USING (true) WITH CHECK (true);


--
-- Name: email_addresses Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.email_addresses USING (true) WITH CHECK (true);


--
-- Name: entity_address_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.entity_address_settings USING (true) WITH CHECK (true);


--
-- Name: entity_email_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.entity_email_settings USING (true) WITH CHECK (true);


--
-- Name: entity_phone_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.entity_phone_settings USING (true) WITH CHECK (true);


--
-- Name: financial_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.financial_records USING (true) WITH CHECK (true);


--
-- Name: financial_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.financial_snapshot USING (true) WITH CHECK (true);


--
-- Name: incentive_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.incentive_records USING (true) WITH CHECK (true);


--
-- Name: incentive_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.incentive_snapshot USING (true) WITH CHECK (true);


--
-- Name: member_attendance_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_attendance_records USING (true) WITH CHECK (true);


--
-- Name: member_basic_schedules Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_basic_schedules USING (true) WITH CHECK (true);


--
-- Name: member_exception_schedules Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_exception_schedules USING (true) WITH CHECK (true);


--
-- Name: member_recipient_certificates Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_recipient_certificates USING (true) WITH CHECK (true);


--
-- Name: member_skill_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_skill_setting_details USING (true) WITH CHECK (true);


--
-- Name: member_skill_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_skill_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: member_skill_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_skill_settings USING (true) WITH CHECK (true);


--
-- Name: member_wage_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_wage_settings USING (true) WITH CHECK (true);


--
-- Name: member_work_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.member_work_records USING (true) WITH CHECK (true);


--
-- Name: members Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.members USING (true) WITH CHECK (true);


--
-- Name: monthly_closings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.monthly_closings USING (true) WITH CHECK (true);


--
-- Name: office_member_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_member_setting_details USING (true) WITH CHECK (true);


--
-- Name: office_member_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_member_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: office_reward_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_reward_setting_details USING (true) WITH CHECK (true);


--
-- Name: office_reward_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_reward_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: office_service_type_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_service_type_setting_details USING (true) WITH CHECK (true);


--
-- Name: office_service_type_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_service_type_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: office_staff_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_staff_setting_details USING (true) WITH CHECK (true);


--
-- Name: office_staff_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.office_staff_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: offices Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.offices USING (true) WITH CHECK (true);


--
-- Name: organizations Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.organizations USING (true) WITH CHECK (true);


--
-- Name: partner_contacts Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.partner_contacts USING (true) WITH CHECK (true);


--
-- Name: partners Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.partners USING (true) WITH CHECK (true);


--
-- Name: phone_numbers Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.phone_numbers USING (true) WITH CHECK (true);


--
-- Name: project_budgets Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.project_budgets USING (true) WITH CHECK (true);


--
-- Name: project_tasks Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.project_tasks USING (true) WITH CHECK (true);


--
-- Name: projects Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.projects USING (true) WITH CHECK (true);


--
-- Name: qualifications Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.qualifications USING (true) WITH CHECK (true);


--
-- Name: regional_grade_locations Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.regional_grade_locations USING (true) WITH CHECK (true);


--
-- Name: regional_grade_rates Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.regional_grade_rates USING (true) WITH CHECK (true);


--
-- Name: reserve_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.reserve_items USING (true) WITH CHECK (true);


--
-- Name: reward_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.reward_items USING (true) WITH CHECK (true);


--
-- Name: salary_closing_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.salary_closing_settings USING (true) WITH CHECK (true);


--
-- Name: service_billing_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.service_billing_snapshot USING (true) WITH CHECK (true);


--
-- Name: service_billing_snapshot_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.service_billing_snapshot_details USING (true) WITH CHECK (true);


--
-- Name: service_provision_system_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.service_provision_system_snapshot USING (true) WITH CHECK (true);


--
-- Name: service_provision_system_snapshot_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.service_provision_system_snapshot_details USING (true) WITH CHECK (true);


--
-- Name: service_types Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.service_types USING (true) WITH CHECK (true);


--
-- Name: skill_categories Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.skill_categories USING (true) WITH CHECK (true);


--
-- Name: skill_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.skill_items USING (true) WITH CHECK (true);


--
-- Name: skill_level_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.skill_level_items USING (true) WITH CHECK (true);


--
-- Name: staff_attendance_records Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_attendance_records USING (true) WITH CHECK (true);


--
-- Name: staff_basic_schedules Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_basic_schedules USING (true) WITH CHECK (true);


--
-- Name: staff_exception_schedules Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_exception_schedules USING (true) WITH CHECK (true);


--
-- Name: staff_qualification_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_qualification_settings USING (true) WITH CHECK (true);


--
-- Name: staff_role_setting_details Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_role_setting_details USING (true) WITH CHECK (true);


--
-- Name: staff_role_setting_summaries Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_role_setting_summaries USING (true) WITH CHECK (true);


--
-- Name: staff_roles Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staff_roles USING (true) WITH CHECK (true);


--
-- Name: staffing_ratio_tiers Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staffing_ratio_tiers USING (true) WITH CHECK (true);


--
-- Name: staffs Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.staffs USING (true) WITH CHECK (true);


--
-- Name: task_assignee_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.task_assignee_settings USING (true) WITH CHECK (true);


--
-- Name: task_skill_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.task_skill_settings USING (true) WITH CHECK (true);


--
-- Name: wage_achievement_tiers Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.wage_achievement_tiers USING (true) WITH CHECK (true);


--
-- Name: wage_closing_settings Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.wage_closing_settings USING (true) WITH CHECK (true);


--
-- Name: wage_rate_items Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.wage_rate_items USING (true) WITH CHECK (true);


--
-- Name: wage_snapshot Allow all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access" ON public.wage_snapshot USING (true) WITH CHECK (true);


--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: allowance_deduction_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.allowance_deduction_items ENABLE ROW LEVEL SECURITY;

--
-- Name: allowance_deduction_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.allowance_deduction_records ENABLE ROW LEVEL SECURITY;

--
-- Name: allowance_deduction_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.allowance_deduction_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

--
-- Name: base_reward_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.base_reward_items ENABLE ROW LEVEL SECURITY;

--
-- Name: capacity_tiers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.capacity_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_closings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

--
-- Name: email_addresses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_address_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entity_address_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_email_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entity_email_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: entity_phone_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.entity_phone_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: incentive_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.incentive_records ENABLE ROW LEVEL SECURITY;

--
-- Name: incentive_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.incentive_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: member_attendance_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: member_basic_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_basic_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: member_exception_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_exception_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: member_recipient_certificates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_recipient_certificates ENABLE ROW LEVEL SECURITY;

--
-- Name: member_skill_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_skill_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: member_skill_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_skill_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: member_skill_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_skill_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: member_wage_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_wage_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: member_work_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.member_work_records ENABLE ROW LEVEL SECURITY;

--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

--
-- Name: monthly_closings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

--
-- Name: office_member_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_member_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: office_member_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_member_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: office_reward_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_reward_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: office_reward_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_reward_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: office_service_type_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_service_type_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: office_service_type_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_service_type_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: office_staff_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_staff_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: office_staff_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.office_staff_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: offices; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_contacts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.partner_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: phone_numbers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

--
-- Name: project_budgets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: project_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: qualifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;

--
-- Name: regional_grade_locations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.regional_grade_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: regional_grade_rates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.regional_grade_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: reserve_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reserve_items ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

--
-- Name: salary_closing_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.salary_closing_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: service_billing_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.service_billing_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: service_billing_snapshot_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.service_billing_snapshot_details ENABLE ROW LEVEL SECURITY;

--
-- Name: service_provision_system_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.service_provision_system_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: service_provision_system_snapshot_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.service_provision_system_snapshot_details ENABLE ROW LEVEL SECURITY;

--
-- Name: service_types; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

--
-- Name: skill_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: skill_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.skill_items ENABLE ROW LEVEL SECURITY;

--
-- Name: skill_level_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.skill_level_items ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_attendance_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_attendance_records ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_basic_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_basic_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_exception_schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_exception_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_qualification_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_qualification_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_role_setting_details; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_role_setting_details ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_role_setting_summaries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_role_setting_summaries ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: staffing_ratio_tiers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staffing_ratio_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: staffs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

--
-- Name: task_assignee_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_assignee_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: task_skill_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_skill_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: wage_achievement_tiers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wage_achievement_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: wage_closing_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wage_closing_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: wage_rate_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wage_rate_items ENABLE ROW LEVEL SECURITY;

--
-- Name: wage_snapshot; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.wage_snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--







--
-- Name: FUNCTION calc_member_service_hours(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION calc_staff_scheduled_hours(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_member_settings_delete(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_member_settings_insert(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_member_settings_update(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_service_type_settings_delete(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_service_type_settings_insert(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_service_type_settings_update(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_staff_settings_delete(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_staff_settings_insert(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_office_staff_settings_update(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_users_view_insert(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION handle_users_view_update(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE addresses; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_deduction_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_deduction_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_deduction_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_deduction_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_deduction_snapshot_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowance_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE allowances; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_attendance_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE attendance_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE auth_users; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE base_reward_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE capacity_tiers; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_allowance_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_closings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_deduction_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE financial_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_financial_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_record_closings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_work_confirmations; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_work_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE daily_work_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE deduction_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE deduction_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE deduction_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE deductions; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE email_addresses; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE entity_address_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE entity_email_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE entity_phone_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE financial_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE general_financial_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE general_financial_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE general_financial_snapshot_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE incentive_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE incentive_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE incentive_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE incentive_snapshot_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_basic_schedules; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_exception_schedules; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_recipient_certificates; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_skill_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_skill_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_skill_evaluations; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_skill_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_wage_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE member_wage_evaluations; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE members; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_allowance_deduction_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_allowance_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_closings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_confirmation_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_deduction_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_financial_closings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_financial_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_incentive_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_incentive_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_record_closings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE monthly_wage_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_member_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_member_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_member_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_reward_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_reward_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_reward_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE offices; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_service_scheme_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_service_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_service_type_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_service_type_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_service_type_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_staff_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_staff_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE office_staff_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE partner_contacts; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE partners; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE phone_numbers; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE project_budgets; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE task_assignee_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE project_task_assignees; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE task_skill_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE project_task_skills; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE project_tasks; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE projects; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE qualifications; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE regional_grade_locations; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE regional_grade_rates; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE regional_grades; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE reserve_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE reserve_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE reward_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE salary_closing_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_billing_snapshot_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_billing_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_billing_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_billing_snapshot_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_billing_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_provision_system_snapshot; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_provision_system_snapshot_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_schemes; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE service_types; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skill_categories; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skill_categories_view; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skill_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skill_level_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skill_levels; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE skills; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_attendance_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_basic_schedules; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_exception_schedules; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_qualification_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_role_setting_details; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_role_setting_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_roles; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staff_work_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staffing_ratio_tiers; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE staffs; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_achievement_tiers; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_closing_settings; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_rate_items; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_rates; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_snapshot_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE wage_summaries; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: TABLE work_records; Type: ACL; Schema: public; Owner: postgres
--






--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--







--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--







--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--







--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--







--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--







--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--







--
-- PostgreSQL database dump complete
--

-- ==========================================
-- 後方互換ビュー (Backward Compatibility Views)
-- ==========================================

CREATE OR REPLACE VIEW "public"."member_reward_settings" AS
SELECT * FROM "public"."office_reward_settings";

CREATE OR REPLACE VIEW "public"."staff_role_summaries" AS
SELECT * FROM "public"."staff_role_setting_summaries";

CREATE OR REPLACE VIEW "public"."staff_role_details" AS
SELECT * FROM "public"."staff_role_setting_details";

CREATE OR REPLACE VIEW "public"."staff_work_style_summaries" AS
SELECT * FROM "public"."staff_role_setting_summaries";

CREATE OR REPLACE VIEW "public"."staff_work_style_details" AS
SELECT * FROM "public"."staff_role_setting_details";

CREATE OR REPLACE VIEW "public"."monthly_wage_confirmations" AS
SELECT
    id,
    target_period,
    office_id,
    is_financial_confirmed,
    financial_confirmed_at,
    financial_confirmed_by,
    created_at,
    updated_at
FROM "public"."monthly_closings";
