-- offices テーブルに通称 (short_name) カラムを追加
ALTER TABLE "public"."offices" 
ADD COLUMN IF NOT EXISTS "short_name" TEXT;
