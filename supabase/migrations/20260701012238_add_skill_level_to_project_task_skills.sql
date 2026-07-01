ALTER TABLE public.project_task_skills 
ADD COLUMN skill_level_id UUID REFERENCES public.skill_levels(id) ON DELETE SET NULL;
