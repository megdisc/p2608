-- 制度系テーブルのカラム整理・公定コード追加
-- 1. 支援種別 (service_types) の description カラム削除
ALTER TABLE "public"."service_types" DROP COLUMN IF EXISTS "description";

-- 2. 資格 (qualifications) の description カラム削除
ALTER TABLE "public"."qualifications" DROP COLUMN IF EXISTS "description";

-- 3. 職種 (staff_roles) の description カラム削除
ALTER TABLE "public"."staff_roles" DROP COLUMN IF EXISTS "description";

-- 4. 所在地級数 (regional_grade_rates) の display_order カラム削除
DROP INDEX IF EXISTS "public"."idx_regional_grade_rates_display_order";
ALTER TABLE "public"."regional_grade_rates" DROP COLUMN IF EXISTS "display_order";

-- 5. 基本報酬 (base_reward_items) に公定サービスコード (service_code) カラム追加
ALTER TABLE "public"."base_reward_items" ADD COLUMN IF NOT EXISTS "service_code" VARCHAR(20);
COMMENT ON COLUMN "public"."base_reward_items"."service_code" IS 'サービスコード（国保連公定6桁コード。例: 111111）';

-- 既存の就労継続支援B型基準報酬に公定サービスコードを割り当て
UPDATE "public"."base_reward_items" SET "service_code" = '111111' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '4万5千円以上';
UPDATE "public"."base_reward_items" SET "service_code" = '111112' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '4万円以上4万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111113' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '3万5千円以上4万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111114' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '3万円以上3万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111115' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '2万5千円以上3万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111116' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '2万円以上2万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111117' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '1万5千円以上2万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111118' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '1万円以上1万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111119' WHERE "staffing_ratio" = '7.5:1' AND "wage_achievement_tier" = '1万円未満';

UPDATE "public"."base_reward_items" SET "service_code" = '111211' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '4万5千円以上';
UPDATE "public"."base_reward_items" SET "service_code" = '111212' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '4万円以上4万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111213' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '3万5千円以上4万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111214' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '3万円以上3万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111215' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '2万5千円以上3万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111216' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '2万円以上2万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111217' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '1万5千円以上2万円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111218' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '1万円以上1万5千円未満';
UPDATE "public"."base_reward_items" SET "service_code" = '111219' WHERE "staffing_ratio" = '10:1' AND "wage_achievement_tier" = '1万円未満';
