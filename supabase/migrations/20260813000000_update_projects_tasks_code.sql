-- ==========================================
-- 案件・タスクのふりがな削除および案件番号・タスク番号 (code) の追加とシードデータ定義
-- ==========================================

-- 1. カラムの削除 (yomigana)
ALTER TABLE "public"."projects" DROP COLUMN IF EXISTS "yomigana";
ALTER TABLE "public"."project_tasks" DROP COLUMN IF EXISTS "yomigana";

-- 2. カラムの追加 (code)
ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS "code" character varying;
ALTER TABLE "public"."project_tasks" ADD COLUMN IF NOT EXISTS "code" character varying;

-- 3. 既存データおよびシステム予約データに対するシードコードの自動発番

-- 3.1 システム予約データ（その他プロジェクト・タスク）へのシードコード割り当て
UPDATE "public"."projects"
SET "code" = 'P-00A000'
WHERE "id" = '00000000-0000-0000-0000-000000000001' AND ("code" IS NULL OR "code" = '');

UPDATE "public"."project_tasks"
SET "code" = 'T-00A000'
WHERE "id" = '00000000-0000-0000-0000-000000000002' AND ("code" IS NULL OR "code" = '');

-- 3.2 一般案件データへのシードコード発番 (例: P-26H001 〜)
DO $$
DECLARE
    p RECORD;
    seq INT := 1;
    code_str TEXT;
BEGIN
    FOR p IN 
        SELECT id, created_at 
        FROM "public"."projects" 
        WHERE "code" IS NULL OR "code" = '' 
        ORDER BY created_at ASC, id ASC 
    LOOP
        code_str := 'P-26H' || LPAD(seq::text, 3, '0');
        UPDATE "public"."projects" SET "code" = code_str WHERE id = p.id;
        seq := seq + 1;
    END LOOP;
END $$;

-- 3.3 一般タスクデータへのシードコード発番 (例: T-26H001 〜)
DO $$
DECLARE
    t RECORD;
    seq INT := 1;
    code_str TEXT;
BEGIN
    FOR t IN 
        SELECT id, created_at 
        FROM "public"."project_tasks" 
        WHERE "code" IS NULL OR "code" = '' 
        ORDER BY created_at ASC, id ASC 
    LOOP
        code_str := 'T-26H' || LPAD(seq::text, 3, '0');
        UPDATE "public"."project_tasks" SET "code" = code_str WHERE id = t.id;
        seq := seq + 1;
    END LOOP;
END $$;
