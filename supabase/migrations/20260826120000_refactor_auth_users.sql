-- Migration: Refactor authentication table (users) for Supabase Auth integration

-- 1. Create public.users table (認証テーブル)
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "email" TEXT UNIQUE,
    "role" TEXT DEFAULT '職員' NOT NULL,
    "user_type" TEXT DEFAULT 'staff' NOT NULL CHECK ("user_type" IN ('staff', 'member')),
    "is_deleted" BOOLEAN DEFAULT false NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for updated_at on public.users
DROP TRIGGER IF EXISTS "update_users_updated_at" ON "public"."users";
CREATE TRIGGER "update_users_updated_at"
    BEFORE UPDATE ON "public"."users"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- 2. Add user_id column to staffs and members tables
ALTER TABLE "public"."staffs" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."members" ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- 3. Data migration: Migrate existing email and role from staffs and members into public.users
DO $$
DECLARE
    s RECORD;
    new_user_id UUID;
BEGIN
    FOR s IN SELECT * FROM "public"."staffs" WHERE "user_id" IS NULL LOOP
        SELECT id INTO new_user_id FROM "public"."users" WHERE id = s.id OR (s.email IS NOT NULL AND email = s.email);
        IF new_user_id IS NULL THEN
            INSERT INTO "public"."users" (id, email, role, user_type, is_deleted, created_at, updated_at)
            VALUES (s.id, s.email, COALESCE(s.role, '職員'), 'staff', s.is_deleted, s.created_at, s.updated_at)
            RETURNING id INTO new_user_id;
        END IF;
        UPDATE "public"."staffs" SET "user_id" = new_user_id WHERE id = s.id;
    END LOOP;
END $$;

DO $$
DECLARE
    m RECORD;
    new_user_id UUID;
BEGIN
    FOR m IN SELECT * FROM "public"."members" WHERE "user_id" IS NULL LOOP
        SELECT id INTO new_user_id FROM "public"."users" WHERE id = m.id OR (m.email IS NOT NULL AND email = m.email);
        IF new_user_id IS NULL THEN
            INSERT INTO "public"."users" (id, email, role, user_type, is_deleted, created_at, updated_at)
            VALUES (m.id, m.email, COALESCE(m.role, '利用者'), 'member', m.is_deleted, m.created_at, m.updated_at)
            RETURNING id INTO new_user_id;
        END IF;
        UPDATE "public"."members" SET "user_id" = new_user_id WHERE id = m.id;
    END LOOP;
END $$;

-- 4. Remove email and role columns from staffs and members
ALTER TABLE "public"."staffs" DROP COLUMN IF EXISTS "email";
ALTER TABLE "public"."staffs" DROP COLUMN IF EXISTS "role";

ALTER TABLE "public"."members" DROP COLUMN IF EXISTS "email";
ALTER TABLE "public"."members" DROP COLUMN IF EXISTS "role";

-- 5. RLS security for users table
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."users";
CREATE POLICY "Allow all access" ON "public"."users" FOR ALL USING (true) WITH CHECK (true);
