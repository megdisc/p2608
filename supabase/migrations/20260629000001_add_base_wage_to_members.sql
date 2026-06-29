ALTER TABLE "public"."members"
ADD COLUMN "base_wage_id" "uuid" REFERENCES "public"."base_wages"("id") ON DELETE SET NULL;
