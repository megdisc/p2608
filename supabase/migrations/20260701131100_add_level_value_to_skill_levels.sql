-- migration: 20260701131100_add_level_value_to_skill_levels.sql
ALTER TABLE public.skill_levels
ADD COLUMN level_value INTEGER NOT NULL DEFAULT 1;
