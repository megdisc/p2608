-- Drop regional_grade and unit_price_per_point from office_service_type_settings
-- as they are now derived dynamically from regional_grades and service_types.personnel_cost_ratio

ALTER TABLE public.office_service_type_settings
  DROP COLUMN IF EXISTS regional_grade,
  DROP COLUMN IF EXISTS unit_price_per_point;
