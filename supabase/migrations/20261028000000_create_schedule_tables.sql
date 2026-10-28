-- ==============================================================================
-- 20261028000000_create_schedule_tables.sql
-- 職員・利用者の基本予定および例外予定テーブルの作成
-- 1. 職員基本勤務予定 (staff_basic_schedules)
-- 2. 職員例外勤務予定 (staff_exception_schedules)
-- 3. 利用者基本利用予定 (member_basic_schedules)
-- 4. 利用者例外利用予定 (member_exception_schedules)
-- 5. 所定時間・サービス提供時間の自動算出トリガー
-- 6. インデックス、論理名コメント、RLSポリシー
-- ==============================================================================

-- 1. 職員基本勤務予定 (staff_basic_schedules)
CREATE TABLE IF NOT EXISTS "public"."staff_basic_schedules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "staff_id" UUID NOT NULL REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "day_of_week" INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    "is_work_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TIME DEFAULT '08:30:00',
    "end_time" TIME DEFAULT '17:30:00',
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "scheduled_hours" NUMERIC(4,2) DEFAULT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_staff_basic_schedules" UNIQUE ("office_id", "staff_id", "day_of_week")
);

-- 2. 職員例外勤務予定 (staff_exception_schedules)
CREATE TABLE IF NOT EXISTS "public"."staff_exception_schedules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "staff_id" UUID NOT NULL REFERENCES "public"."staffs"("id") ON DELETE CASCADE,
    "target_date" DATE NOT NULL,
    "is_work_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TIME DEFAULT NULL,
    "end_time" TIME DEFAULT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "scheduled_hours" NUMERIC(4,2) DEFAULT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_staff_exception_schedules" UNIQUE ("office_id", "staff_id", "target_date")
);

-- 3. 利用者基本利用予定 (member_basic_schedules)
CREATE TABLE IF NOT EXISTS "public"."member_basic_schedules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "member_id" UUID NOT NULL REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "day_of_week" INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    "is_scheduled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'present',
    "start_time" TIME DEFAULT '09:30:00',
    "end_time" TIME DEFAULT '15:30:00',
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "service_hours" NUMERIC(4,2) DEFAULT NULL,
    "has_meal" BOOLEAN NOT NULL DEFAULT true,
    "has_pickup" BOOLEAN NOT NULL DEFAULT false,
    "has_dropoff" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_member_basic_schedules" UNIQUE ("office_id", "member_id", "day_of_week")
);

-- 4. 利用者例外利用予定 (member_exception_schedules)
CREATE TABLE IF NOT EXISTS "public"."member_exception_schedules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "office_id" UUID NOT NULL REFERENCES "public"."offices"("id") ON DELETE CASCADE,
    "member_id" UUID NOT NULL REFERENCES "public"."members"("id") ON DELETE CASCADE,
    "target_date" DATE NOT NULL,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'present',
    "start_time" TIME DEFAULT NULL,
    "end_time" TIME DEFAULT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "service_hours" NUMERIC(4,2) DEFAULT NULL,
    "has_meal" BOOLEAN NOT NULL DEFAULT true,
    "has_pickup" BOOLEAN NOT NULL DEFAULT false,
    "has_dropoff" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "uq_member_exception_schedules" UNIQUE ("office_id", "member_id", "target_date")
);

-- 5. 所定時間・サービス提供時間の自動算出トリガー関数
-- 5.1 職員所定時間自動算出トリガー関数
CREATE OR REPLACE FUNCTION "public"."calc_staff_scheduled_hours"()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_staff_basic_schedules_calc_hours" ON "public"."staff_basic_schedules";
CREATE TRIGGER "trg_staff_basic_schedules_calc_hours"
BEFORE INSERT OR UPDATE ON "public"."staff_basic_schedules"
FOR EACH ROW EXECUTE FUNCTION "public"."calc_staff_scheduled_hours"();

DROP TRIGGER IF EXISTS "trg_staff_exception_schedules_calc_hours" ON "public"."staff_exception_schedules";
CREATE TRIGGER "trg_staff_exception_schedules_calc_hours"
BEFORE INSERT OR UPDATE ON "public"."staff_exception_schedules"
FOR EACH ROW EXECUTE FUNCTION "public"."calc_staff_scheduled_hours"();

-- 5.2 利用者サービス提供時間自動算出トリガー関数
CREATE OR REPLACE FUNCTION "public"."calc_member_service_hours"()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_member_basic_schedules_calc_hours" ON "public"."member_basic_schedules";
CREATE TRIGGER "trg_member_basic_schedules_calc_hours"
BEFORE INSERT OR UPDATE ON "public"."member_basic_schedules"
FOR EACH ROW EXECUTE FUNCTION "public"."calc_member_service_hours"();

DROP TRIGGER IF EXISTS "trg_member_exception_schedules_calc_hours" ON "public"."member_exception_schedules";
CREATE TRIGGER "trg_member_exception_schedules_calc_hours"
BEFORE INSERT OR UPDATE ON "public"."member_exception_schedules"
FOR EACH ROW EXECUTE FUNCTION "public"."calc_member_service_hours"();

-- 6. インデックス作成
CREATE INDEX IF NOT EXISTS "idx_staff_basic_schedules_office_staff" 
ON "public"."staff_basic_schedules"("office_id", "staff_id");

CREATE INDEX IF NOT EXISTS "idx_staff_exception_schedules_lookup" 
ON "public"."staff_exception_schedules"("office_id", "staff_id", "target_date");

CREATE INDEX IF NOT EXISTS "idx_member_basic_schedules_office_member" 
ON "public"."member_basic_schedules"("office_id", "member_id");

CREATE INDEX IF NOT EXISTS "idx_member_exception_schedules_lookup" 
ON "public"."member_exception_schedules"("office_id", "member_id", "target_date");

-- 7. 論理名コメント
COMMENT ON TABLE "public"."staff_basic_schedules" IS '職員基本勤務予定';
COMMENT ON TABLE "public"."staff_exception_schedules" IS '職員例外勤務予定';
COMMENT ON TABLE "public"."member_basic_schedules" IS '利用者基本利用予定';
COMMENT ON TABLE "public"."member_exception_schedules" IS '利用者例外利用予定';

-- 8. RLSポリシーの設定
ALTER TABLE "public"."staff_basic_schedules" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_basic_schedules";
CREATE POLICY "Allow all access" ON "public"."staff_basic_schedules" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."staff_exception_schedules" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_exception_schedules";
CREATE POLICY "Allow all access" ON "public"."staff_exception_schedules" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."member_basic_schedules" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."member_basic_schedules";
CREATE POLICY "Allow all access" ON "public"."member_basic_schedules" FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE "public"."member_exception_schedules" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."member_exception_schedules";
CREATE POLICY "Allow all access" ON "public"."member_exception_schedules" FOR ALL USING (true) WITH CHECK (true);

