-- 1. skills テーブルから yomigana を削除
ALTER TABLE "public"."skills" DROP COLUMN IF EXISTS "yomigana";

-- 2. wage_rates テーブルから member_id, effective_from を削除
ALTER TABLE "public"."wage_rates" DROP COLUMN IF EXISTS "member_id";
ALTER TABLE "public"."wage_rates" DROP COLUMN IF EXISTS "effective_from";

-- 3. members テーブルから contract_status, contract_type を削除
ALTER TABLE "public"."members" DROP COLUMN IF EXISTS "contract_status";
ALTER TABLE "public"."members" DROP COLUMN IF EXISTS "contract_type";

-- 4. member_skill_evaluations テーブルから evaluated_at を削除
ALTER TABLE "public"."member_skill_evaluations" DROP COLUMN IF EXISTS "evaluated_at";

-- 5. member_wage_evaluations テーブルから evaluated_at を削除
ALTER TABLE "public"."member_wage_evaluations" DROP COLUMN IF EXISTS "evaluated_at";
