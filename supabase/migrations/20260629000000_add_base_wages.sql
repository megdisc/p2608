CREATE TABLE IF NOT EXISTS "public"."base_wages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wage" integer NOT NULL,
    "description" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."base_wages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."base_wages"
    ADD CONSTRAINT "base_wages_pkey" PRIMARY KEY ("id");

CREATE TRIGGER "update_base_wages_updated_at" BEFORE UPDATE ON "public"."base_wages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
