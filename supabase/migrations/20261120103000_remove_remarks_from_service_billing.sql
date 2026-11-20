-- 20261120103000_remove_remarks_from_service_billing.sql
-- サービス費用画面およびスナップショットにおいて備考カラムは不要（入力UIなし）のため、
-- 万が一 remarks カラムが存在していた場合に備えて安全に削除

ALTER TABLE IF EXISTS "public"."service_billing_snapshot" DROP COLUMN IF EXISTS "remarks";
