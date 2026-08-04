-- Convert start_date and end_date to varchar(7) in YYYY-MM format
ALTER TABLE "public"."projects"
  ALTER COLUMN "start_date" TYPE character varying(7) USING to_char("start_date", 'YYYY-MM'),
  ALTER COLUMN "end_date" TYPE character varying(7) USING to_char("end_date", 'YYYY-MM');
