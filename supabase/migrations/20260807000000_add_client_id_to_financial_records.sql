ALTER TABLE "public"."financial_records" ADD COLUMN "client_id" uuid REFERENCES "public"."clients"("id");
