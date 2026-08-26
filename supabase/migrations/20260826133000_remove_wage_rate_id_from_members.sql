-- 利用者テーブル (members) から冗長な工賃単価ID (wage_rate_id) カラムを削除
ALTER TABLE "public"."members" DROP COLUMN IF EXISTS "wage_rate_id";
