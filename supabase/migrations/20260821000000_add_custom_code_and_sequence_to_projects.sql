-- Migration: Ensure UNIQUE index on projects(code) across all rows including soft-deleted ones

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_all ON public.projects (code) WHERE code IS NOT NULL AND code <> '';
