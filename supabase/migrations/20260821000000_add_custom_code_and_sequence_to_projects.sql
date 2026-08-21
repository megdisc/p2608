-- Migration: Ensure UNIQUE indexes on code columns across all master tables (projects, members, staffs, partners)

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code_all ON public.projects (code) WHERE code IS NOT NULL AND code <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_code_all ON public.members (code) WHERE code IS NOT NULL AND code <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_staffs_code_all ON public.staffs (code) WHERE code IS NOT NULL AND code <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_code_all ON public.partners (code) WHERE code IS NOT NULL AND code <> '';
