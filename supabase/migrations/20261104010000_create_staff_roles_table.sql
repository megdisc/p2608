-- ==============================================================================
-- 20261104010000_create_staff_roles_table.sql
-- 職種マスタ (staff_roles) テーブルの新設および職員職種詳細への割当カラム追加
-- ==============================================================================

-- 1. 職種マスタテーブル作成
CREATE TABLE IF NOT EXISTS "public"."staff_roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) UNIQUE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT '必置職種',
    "is_direct_care" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE "public"."staff_roles" IS '職種';
COMMENT ON COLUMN "public"."staff_roles"."id" IS '職種ID';
COMMENT ON COLUMN "public"."staff_roles"."code" IS '職種コード';
COMMENT ON COLUMN "public"."staff_roles"."name" IS '職種名';
COMMENT ON COLUMN "public"."staff_roles"."category" IS '職種区分（必置職種 / 加算職種 / 関連職種）';
COMMENT ON COLUMN "public"."staff_roles"."is_direct_care" IS '直接処遇職員フラグ（常勤換算配置基準算定対象か否か）';
COMMENT ON COLUMN "public"."staff_roles"."description" IS '職種説明・役割定義';
COMMENT ON COLUMN "public"."staff_roles"."sort_order" IS '表示並び順';

CREATE INDEX IF NOT EXISTS "idx_staff_roles_code" ON "public"."staff_roles"("code");
CREATE INDEX IF NOT EXISTS "idx_staff_roles_category" ON "public"."staff_roles"("category");
CREATE INDEX IF NOT EXISTS "idx_staff_roles_sort_order" ON "public"."staff_roles"("sort_order");

ALTER TABLE "public"."staff_roles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON "public"."staff_roles";
CREATE POLICY "Allow all access" ON "public"."staff_roles" FOR ALL USING (true) WITH CHECK (true);

-- 2. 職種マスタの初期データ登録（就労継続支援B型基準職種）
INSERT INTO "public"."staff_roles" ("id", "code", "name", "category", "is_direct_care", "description", "sort_order") VALUES
('33333333-0000-0000-0000-000000000001', 'manager', '管理者', '必置職種', false, '事業所全体の管理・業務統括を行う管理責任者', 1),
('33333333-0000-0000-0000-000000000002', 'service_admin', 'サービス管理責任者', '必置職種', false, '個別支援計画の作成・評価・技術指導等を行う障害福祉事業所の必置人員', 2),
('33333333-0000-0000-0000-000000000003', 'vocational_instructor', '職業指導員', '必置職種', true, '生産活動や作業技術の指導・支援を行う人員配置基準職種', 3),
('33333333-0000-0000-0000-000000000004', 'life_supporter', '生活支援員', '必置職種', true, '日常生活支援・体調管理・相談援助を行う人員配置基準職種', 4),
('33333333-0000-0000-0000-000000000005', 'target_evaluator', '目標工賃達成指導員', '加算職種', true, '工賃向上計画の推進・販路開拓等を行う目標工賃達成指導員配置加算用職種', 5),
('33333333-0000-0000-0000-000000000006', 'employment_supporter', '就労支援員', '関連職種', true, '一般就労に向けた実習先開拓・求職活動・定着支援等を担当する職種', 6),
('33333333-0000-0000-0000-000000000007', 'peer_supporter', 'ピアサポート専門員', '加算職種', true, '自らの障害経験を活かした相談・支援を担当するピアサポート体制加算用職種', 7)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "category" = EXCLUDED."category",
    "is_direct_care" = EXCLUDED."is_direct_care",
    "description" = EXCLUDED."description",
    "sort_order" = EXCLUDED."sort_order";

-- 3. 職員職種詳細テーブルへの staff_role_id カラム追加
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_role_details') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff_role_details' AND column_name = 'staff_role_id') THEN
            ALTER TABLE "public"."staff_role_details" ADD COLUMN "staff_role_id" UUID REFERENCES "public"."staff_roles"("id") ON DELETE CASCADE;
        END IF;

        -- 既存コードから staff_role_id を更新
        UPDATE "public"."staff_role_details" srd
        SET "staff_role_id" = sr."id"
        FROM "public"."staff_roles" sr
        WHERE srd."staff_role" = sr."code" AND srd."staff_role_id" IS NULL;

        CREATE INDEX IF NOT EXISTS "idx_staff_role_details_role_id" ON "public"."staff_role_details"("staff_role_id");
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_work_style_details') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff_work_style_details' AND column_name = 'staff_role_id') THEN
            ALTER TABLE "public"."staff_work_style_details" ADD COLUMN "staff_role_id" UUID REFERENCES "public"."staff_roles"("id") ON DELETE CASCADE;
        END IF;

        UPDATE "public"."staff_work_style_details" swsd
        SET "staff_role_id" = sr."id"
        FROM "public"."staff_roles" sr
        WHERE swsd."staff_role" = sr."code" AND swsd."staff_role_id" IS NULL;

        CREATE INDEX IF NOT EXISTS "idx_staff_work_style_details_role_id" ON "public"."staff_work_style_details"("staff_role_id");
    END IF;
END $$;

