-- ==========================================
-- マイグレーションファイル構成 (Table of Contents)
-- ==========================================
-- 0. PostgreSQL 動作環境の初期化 (環境依存エラーを防ぐ安全設定)
-- 1. 初期設定・拡張機能 (Config & Extensions)
-- 2. カスタム型 (Custom Types)
-- 3. 関数・RPC (Functions)
-- 4. テーブル定義 (Tables)
-- 5. ビュー定義 (Views)
-- 6. 主キー・制約 (Primary Keys & Constraints)
-- 7. 外部キー制約 (Foreign Keys)
-- 8. RLSポリシー (Row Level Security)
-- 9. 権限付与 (Grants)
-- 10. 検索パスの修正 (Search Path Fix)
-- ==========================================

-- ==========================================
-- 0. PostgreSQL 動作環境の初期化 (環境依存エラーを防ぐ安全設定)
-- ==========================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ==========================================
-- 1. 初期設定・拡張機能 (Config & Extensions)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";







-- ==========================================
-- 2. カスタム型 (Custom Types)
-- ==========================================

CREATE TYPE "public"."budget_category" AS ENUM (
    'revenue',
    'expense',
    'reserve'
);


ALTER TYPE "public"."budget_category" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    '受入',
    '払出'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";



-- ==========================================
-- 3. 関数・RPC (Functions)
-- ==========================================

CREATE OR REPLACE FUNCTION "public"."calculate_book_inventory"("p_item_id" "uuid", "p_location_id" "uuid", "p_target_date" timestamp with time zone) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_prev_qty NUMERIC := 0;
  v_prev_date TIMESTAMPTZ := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
  v_tx_qty NUMERIC := 0;
BEGIN
  -- Find the most recent stocktaking record for the item/location before the target date
  SELECT actual_qty, date 
  INTO v_prev_qty, v_prev_date 
  FROM stocktakings 
  WHERE item_id = p_item_id 
    AND location_id = p_location_id 
    AND date < p_target_date 
  ORDER BY date DESC 
  LIMIT 1;

  -- Default to 0 and '1970' if no previous record is found
  IF v_prev_date IS NULL THEN
    v_prev_qty := 0;
    v_prev_date := '1970-01-01 00:00:00+00'::TIMESTAMPTZ;
  END IF;

  -- Sum transactions after the previous stocktaking date up to the target date
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = '受入' THEN quantity 
      WHEN type = '払出' THEN -quantity 
      ELSE 0 
    END
  ), 0) 
  INTO v_tx_qty 
  FROM transactions 
  WHERE item_id = p_item_id 
    AND location_id = p_location_id 
    AND date > v_prev_date 
    AND date <= p_target_date;

  RETURN v_prev_qty + v_tx_qty;
END;
$$;


ALTER FUNCTION "public"."calculate_book_inventory"("p_item_id" "uuid", "p_location_id" "uuid", "p_target_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_member_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ) RETURNING id INTO new_user_id;

  -- Insert into members
  INSERT INTO members (id, name, yomigana, email, role)
  VALUES (new_user_id, name, yomigana, email, role);

  RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."create_member_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_staff_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ) RETURNING id INTO new_user_id;

  -- Insert into staffs
  INSERT INTO staffs (id, name, yomigana, email, role)
  VALUES (new_user_id, name, yomigana, email, role);

  RETURN new_user_id;
END;
$$;


ALTER FUNCTION "public"."create_staff_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_inventory_summary"("p_target_date" timestamp with time zone) RETURNS TABLE("item_id" "uuid", "item_name" "text", "category_name" "text", "location_id" "uuid", "location_name" "text", "quantity" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
WITH item_locations AS (
  SELECT 
    i.id AS item_id, 
    i.name AS item_name,
    c.name AS category_name,
    l.id AS location_id,
    l.name AS location_name
  FROM items i
  LEFT JOIN categories c ON i.category_id = c.id
  CROSS JOIN locations l
  WHERE i.is_deleted = false AND l.is_deleted = false
),
latest_stocktakings AS (
  SELECT ls_inner.item_id, ls_inner.location_id, ls_inner.actual_qty, ls_inner.date
  FROM (
    SELECT s.item_id, s.location_id, s.actual_qty, s.date,
           ROW_NUMBER() OVER (PARTITION BY s.item_id, s.location_id ORDER BY s.date DESC) as rn
    FROM stocktakings s
    WHERE s.date <= p_target_date
  ) ls_inner
  WHERE ls_inner.rn = 1
),
recent_transactions AS (
  SELECT t.item_id, t.location_id,
         SUM(CASE WHEN t.type = '受入' THEN t.quantity WHEN t.type = '払出' THEN -t.quantity ELSE 0 END) as tx_qty
  FROM transactions t
  LEFT JOIN latest_stocktakings ls ON t.item_id = ls.item_id AND t.location_id = ls.location_id
  WHERE (ls.date IS NULL OR t.date > ls.date)
    AND t.date <= p_target_date
  GROUP BY t.item_id, t.location_id
)
SELECT 
  il.item_id,
  il.item_name,
  il.category_name,
  il.location_id,
  il.location_name,
  COALESCE(ls.actual_qty, 0) + COALESCE(rt.tx_qty, 0) AS quantity
FROM item_locations il
LEFT JOIN latest_stocktakings ls ON il.item_id = ls.item_id AND il.location_id = ls.location_id
LEFT JOIN recent_transactions rt ON il.item_id = rt.item_id AND il.location_id = rt.location_id;
$$;


ALTER FUNCTION "public"."get_inventory_summary"("p_target_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_backdated_transactions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_latest_stocktaking_date TIMESTAMPTZ;
  v_target_item_id UUID;
  v_target_location_id UUID;
BEGIN
  -- Determine target item and location based on operation
  IF TG_OP = 'DELETE' THEN
    v_target_item_id := OLD.item_id;
    v_target_location_id := OLD.location_id;
  ELSE
    v_target_item_id := NEW.item_id;
    v_target_location_id := NEW.location_id;
  END IF;

  -- Get the latest stocktaking date for this item and location
  SELECT date INTO v_latest_stocktaking_date
  FROM stocktakings
  WHERE item_id = v_target_item_id AND location_id = v_target_location_id
  ORDER BY date DESC LIMIT 1;

  -- Check DELETE
  IF TG_OP = 'DELETE' THEN
    IF v_latest_stocktaking_date IS NOT NULL AND OLD.date <= v_latest_stocktaking_date THEN
      RAISE EXCEPTION 'Cannot delete transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
    END IF;
    RETURN OLD;
  END IF;

  -- Check INSERT / UPDATE
  IF v_latest_stocktaking_date IS NOT NULL AND NEW.date <= v_latest_stocktaking_date THEN
    RAISE EXCEPTION 'Cannot insert or update transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
  END IF;

  -- Additional check for UPDATE: cannot modify an already locked old record
  IF TG_OP = 'UPDATE' AND v_latest_stocktaking_date IS NOT NULL AND OLD.date <= v_latest_stocktaking_date THEN
    RAISE EXCEPTION 'Cannot modify transaction on or before the latest stocktaking date (%)', v_latest_stocktaking_date;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_backdated_transactions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_member_password"("user_id" "uuid", "new_password" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."update_member_password"("user_id" "uuid", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_staff_password"("user_id" "uuid", "new_password" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."update_staff_password"("user_id" "uuid", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";



-- ==========================================
-- 4. テーブル定義 (Tables)
-- ==========================================

-- ------------------------------------------
-- テーブル: categories (カテゴリ)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "yomigana" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: clients (顧客)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "yomigana" character varying,
    "contact_person" character varying,
    "phone" character varying,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: daily_work_records (日次作業記録)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."daily_work_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "task_id" "uuid" NOT NULL,
    "work_time" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_work_records_work_time_check" CHECK (("work_time" >= (0)::numeric))
);


ALTER TABLE "public"."daily_work_records" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: items (品目・在庫品)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "supplier_id" "uuid",
    "standard_price" numeric NOT NULL,
    "standard_purchase_qty" numeric NOT NULL,
    "category_id" "uuid",
    "location_id" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "yomigana" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: locations (保管場所)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "yomigana" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: members (利用者)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "yomigana" character varying,
    "role" character varying DEFAULT '利用者'::character varying NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" character varying
);


ALTER TABLE "public"."members" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: monthly_member_contributions (月次利用者貢献度)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."monthly_member_contributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year_month" character varying(7) NOT NULL,
    "member_id" "uuid",
    "task_id" "uuid" NOT NULL,
    "contribution_ratio" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "staff_id" "uuid",
    "client_id" "uuid",
    CONSTRAINT "check_contribution_assignee_type" CHECK (((("member_id" IS NOT NULL) AND ("staff_id" IS NULL) AND ("client_id" IS NULL)) OR (("member_id" IS NULL) AND ("staff_id" IS NOT NULL) AND ("client_id" IS NULL)) OR (("member_id" IS NULL) AND ("staff_id" IS NULL) AND ("client_id" IS NOT NULL)))),
    CONSTRAINT "monthly_progress_records_contribution_ratio_check" CHECK ((("contribution_ratio" >= (0)::numeric) AND ("contribution_ratio" <= (100)::numeric)))
);


ALTER TABLE "public"."monthly_member_contributions" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: monthly_task_progress (月次タスク進捗)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."monthly_task_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year_month" character varying(7) NOT NULL,
    "task_id" "uuid" NOT NULL,
    "current_progress" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monthly_task_progress_current_progress_check" CHECK ((("current_progress" >= (0)::numeric) AND ("current_progress" <= (100)::numeric)))
);


ALTER TABLE "public"."monthly_task_progress" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: project_budget_items (案件予算項目)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_budget_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "category" "public"."budget_category" NOT NULL,
    "subject" "text" NOT NULL,
    "task_id" "uuid",
    "amount" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_budget_items" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: project_task_assignees (タスク担当者)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_task_assignees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "member_id" "uuid",
    "client_id" "uuid",
    "staff_id" "uuid",
    CONSTRAINT "check_assignee_type" CHECK (((("member_id" IS NOT NULL) AND ("client_id" IS NULL) AND ("staff_id" IS NULL)) OR (("member_id" IS NULL) AND ("client_id" IS NOT NULL) AND ("staff_id" IS NULL)) OR (("member_id" IS NULL) AND ("client_id" IS NULL) AND ("staff_id" IS NOT NULL))))
);


ALTER TABLE "public"."project_task_assignees" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: project_task_skills (タスク要求スキル)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_task_skills" (
    "task_id" "uuid" NOT NULL,
    "skill_id" "uuid" NOT NULL
);


ALTER TABLE "public"."project_task_skills" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: project_tasks (案件タスク)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "yomigana" character varying
);


ALTER TABLE "public"."project_tasks" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: projects (案件)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "yomigana" character varying,
    "client_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_type" character varying DEFAULT 'one-off'::character varying NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: skills (スキル)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "yomigana" character varying,
    "description" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: staffs (職員)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."staffs" (
    "id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "role" character varying NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" character varying,
    "yomigana" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "public"."staffs" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: stocktakings (棚卸記録)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."stocktakings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "system_qty" numeric NOT NULL,
    "actual_qty" numeric NOT NULL,
    "difference" numeric NOT NULL,
    "staff_id" "uuid",
    "location_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stocktakings" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: suppliers (仕入先)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying NOT NULL,
    "name" character varying NOT NULL,
    "contact_person" character varying,
    "phone" character varying,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "yomigana" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


-- ------------------------------------------
-- テーブル: transactions (入出庫履歴)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "quantity" numeric NOT NULL,
    "location_id" "uuid" NOT NULL,
    "staff_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";



-- ==========================================
-- 5. ビュー定義 (Views)
-- ==========================================

CREATE OR REPLACE VIEW "public"."v_current_inventory" AS
 WITH "item_locations" AS (
         SELECT "i"."id" AS "item_id",
            "i"."name" AS "item_name",
            "c"."name" AS "category_name",
            "l"."id" AS "location_id",
            "l"."name" AS "location_name"
           FROM (("public"."items" "i"
             LEFT JOIN "public"."categories" "c" ON (("i"."category_id" = "c"."id")))
             CROSS JOIN "public"."locations" "l")
          WHERE (("i"."is_deleted" = false) AND ("l"."is_deleted" = false))
        ), "latest_stocktakings" AS (
         SELECT "s"."item_id",
            "s"."location_id",
            "s"."actual_qty",
            "s"."date"
           FROM ( SELECT "stocktakings"."item_id",
                    "stocktakings"."location_id",
                    "stocktakings"."actual_qty",
                    "stocktakings"."date",
                    "row_number"() OVER (PARTITION BY "stocktakings"."item_id", "stocktakings"."location_id" ORDER BY "stocktakings"."date" DESC) AS "rn"
                   FROM "public"."stocktakings") "s"
          WHERE ("s"."rn" = 1)
        ), "recent_transactions" AS (
         SELECT "t"."item_id",
            "t"."location_id",
            "sum"(
                CASE
                    WHEN ("t"."type" = '受入'::"public"."transaction_type") THEN "t"."quantity"
                    WHEN ("t"."type" = '払出'::"public"."transaction_type") THEN (- "t"."quantity")
                    ELSE (0)::numeric
                END) AS "tx_qty"
           FROM ("public"."transactions" "t"
             LEFT JOIN "latest_stocktakings" "ls_1" ON ((("t"."item_id" = "ls_1"."item_id") AND ("t"."location_id" = "ls_1"."location_id"))))
          WHERE (("ls_1"."date" IS NULL) OR ("t"."date" > "ls_1"."date"))
          GROUP BY "t"."item_id", "t"."location_id"
        )
 SELECT "il"."item_id",
    "il"."item_name",
    "il"."category_name",
    "il"."location_id",
    "il"."location_name",
    (COALESCE("ls"."actual_qty", (0)::numeric) + COALESCE("rt"."tx_qty", (0)::numeric)) AS "quantity"
   FROM (("item_locations" "il"
     LEFT JOIN "latest_stocktakings" "ls" ON ((("il"."item_id" = "ls"."item_id") AND ("il"."location_id" = "ls"."location_id"))))
     LEFT JOIN "recent_transactions" "rt" ON ((("il"."item_id" = "rt"."item_id") AND ("il"."location_id" = "rt"."location_id"))));


ALTER VIEW "public"."v_current_inventory" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."categories"

-- ==========================================
-- 6. 主キー・制約 (Primary Keys & Constraints)
-- ==========================================

    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_work_records"
    ADD CONSTRAINT "daily_work_records_date_member_id_task_id_key" UNIQUE ("date", "member_id", "task_id");



ALTER TABLE ONLY "public"."daily_work_records"
    ADD CONSTRAINT "daily_work_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."members"
    ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_member_contributions"
    ADD CONSTRAINT "monthly_member_contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_task_progress"
    ADD CONSTRAINT "monthly_task_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_task_progress"
    ADD CONSTRAINT "monthly_task_progress_year_month_task_id_key" UNIQUE ("year_month", "task_id");



ALTER TABLE ONLY "public"."project_budget_items"
    ADD CONSTRAINT "project_budget_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task_assignees"
    ADD CONSTRAINT "project_task_assignees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task_skills"
    ADD CONSTRAINT "project_task_skills_pkey" PRIMARY KEY ("task_id", "skill_id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staffs"
    ADD CONSTRAINT "staffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stocktakings"
    ADD CONSTRAINT "stocktakings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_monthly_contrib_client" ON "public"."monthly_member_contributions" USING "btree" ("year_month", "task_id", "client_id") WHERE ("client_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_monthly_contrib_member" ON "public"."monthly_member_contributions" USING "btree" ("year_month", "task_id", "member_id") WHERE ("member_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_monthly_contrib_staff" ON "public"."monthly_member_contributions" USING "btree" ("year_month", "task_id", "staff_id") WHERE ("staff_id" IS NOT NULL);



CREATE INDEX "idx_project_budget_items_project_id" ON "public"."project_budget_items" USING "btree" ("project_id");



CREATE OR REPLACE TRIGGER "check_transaction_date" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_backdated_transactions"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_daily_work_records_modtime" BEFORE UPDATE ON "public"."daily_work_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_items_updated_at" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_members_updated_at" BEFORE UPDATE ON "public"."members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_monthly_member_contributions_modtime" BEFORE UPDATE ON "public"."monthly_member_contributions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_monthly_task_progress_modtime" BEFORE UPDATE ON "public"."monthly_task_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_budget_items_updated_at" BEFORE UPDATE ON "public"."project_budget_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_tasks_updated_at" BEFORE UPDATE ON "public"."project_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_skills_updated_at" BEFORE UPDATE ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staffs_updated_at" BEFORE UPDATE ON "public"."staffs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."daily_work_records"

-- ==========================================
-- 7. 外部キー制約 (Foreign Keys)
-- ==========================================

    ADD CONSTRAINT "daily_work_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_work_records"
    ADD CONSTRAINT "daily_work_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."monthly_member_contributions"
    ADD CONSTRAINT "monthly_member_contributions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_member_contributions"
    ADD CONSTRAINT "monthly_member_contributions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_member_contributions"
    ADD CONSTRAINT "monthly_progress_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_member_contributions"
    ADD CONSTRAINT "monthly_progress_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monthly_task_progress"
    ADD CONSTRAINT "monthly_task_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budget_items"
    ADD CONSTRAINT "project_budget_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_budget_items"
    ADD CONSTRAINT "project_budget_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_assignees"
    ADD CONSTRAINT "project_task_assignees_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_assignees"
    ADD CONSTRAINT "project_task_assignees_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_assignees"
    ADD CONSTRAINT "project_task_assignees_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_assignees"
    ADD CONSTRAINT "project_task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_skills"
    ADD CONSTRAINT "project_task_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_skills"
    ADD CONSTRAINT "project_task_skills_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."staffs"
    ADD CONSTRAINT "staffs_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stocktakings"
    ADD CONSTRAINT "stocktakings_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."stocktakings"
    ADD CONSTRAINT "stocktakings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."stocktakings"
    ADD CONSTRAINT "stocktakings_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id");




-- ==========================================
-- 8. RLSポリシー (Row Level Security)
-- ==========================================

CREATE POLICY "Enable all operations for all users" ON "public"."project_budget_items" USING (true) WITH CHECK (true);



ALTER TABLE "public"."project_budget_items" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






-- ==========================================
-- 9. 権限付与 (Grants)
-- ==========================================

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































GRANT ALL ON FUNCTION "public"."calculate_book_inventory"("p_item_id" "uuid", "p_location_id" "uuid", "p_target_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_book_inventory"("p_item_id" "uuid", "p_location_id" "uuid", "p_target_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_book_inventory"("p_item_id" "uuid", "p_location_id" "uuid", "p_target_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_member_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_member_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_member_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_staff_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_staff_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_staff_user"("email" "text", "password" "text", "name" "text", "yomigana" "text", "role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_target_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_target_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_inventory_summary"("p_target_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_backdated_transactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_backdated_transactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_backdated_transactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_member_password"("user_id" "uuid", "new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_member_password"("user_id" "uuid", "new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_member_password"("user_id" "uuid", "new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_staff_password"("user_id" "uuid", "new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_staff_password"("user_id" "uuid", "new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_staff_password"("user_id" "uuid", "new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."daily_work_records" TO "anon";
GRANT ALL ON TABLE "public"."daily_work_records" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_work_records" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."members" TO "anon";
GRANT ALL ON TABLE "public"."members" TO "authenticated";
GRANT ALL ON TABLE "public"."members" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_member_contributions" TO "anon";
GRANT ALL ON TABLE "public"."monthly_member_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_member_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_task_progress" TO "anon";
GRANT ALL ON TABLE "public"."monthly_task_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_task_progress" TO "service_role";



GRANT ALL ON TABLE "public"."project_budget_items" TO "anon";
GRANT ALL ON TABLE "public"."project_budget_items" TO "authenticated";
GRANT ALL ON TABLE "public"."project_budget_items" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_assignees" TO "anon";
GRANT ALL ON TABLE "public"."project_task_assignees" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_assignees" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_skills" TO "anon";
GRANT ALL ON TABLE "public"."project_task_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_skills" TO "service_role";



GRANT ALL ON TABLE "public"."project_tasks" TO "anon";
GRANT ALL ON TABLE "public"."project_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."project_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "anon";
GRANT ALL ON TABLE "public"."skills" TO "authenticated";
GRANT ALL ON TABLE "public"."skills" TO "service_role";



GRANT ALL ON TABLE "public"."staffs" TO "anon";
GRANT ALL ON TABLE "public"."staffs" TO "authenticated";
GRANT ALL ON TABLE "public"."staffs" TO "service_role";



GRANT ALL ON TABLE "public"."stocktakings" TO "anon";
GRANT ALL ON TABLE "public"."stocktakings" TO "authenticated";
GRANT ALL ON TABLE "public"."stocktakings" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."v_current_inventory" TO "anon";
GRANT ALL ON TABLE "public"."v_current_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."v_current_inventory" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

SET search_path = public, extensions;

-- ==========================================
-- 10. 検索パスの修正 (Search Path Fix)
-- ==========================================
SET search_path = public, extensions;
