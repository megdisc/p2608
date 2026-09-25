-- allowance_deduction_items から is_reward_linked と reward_item_id カラムを削除
ALTER TABLE "public"."allowance_deduction_items" 
DROP COLUMN IF EXISTS "is_reward_linked",
DROP COLUMN IF EXISTS "reward_item_id";
