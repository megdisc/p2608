-- organizations (法人) および offices (事業所) テーブルから yomigana (ふりがな) カラムを削除
ALTER TABLE "public"."organizations" DROP COLUMN IF EXISTS "yomigana";
ALTER TABLE "public"."offices" DROP COLUMN IF EXISTS "yomigana";
