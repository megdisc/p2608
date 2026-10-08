-- Migration to add office_id to finance-related tables

ALTER TABLE public.general_financial_records 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL;

ALTER TABLE public.general_financial_details 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE SET NULL;

ALTER TABLE public.monthly_record_closings 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE;

ALTER TABLE public.wage_summaries 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE;

ALTER TABLE public.monthly_financial_closings 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES public.offices(id) ON DELETE CASCADE;

-- Update unique constraints if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monthly_record_closings_target_period_key'
    ) THEN
        ALTER TABLE public.monthly_record_closings DROP CONSTRAINT monthly_record_closings_target_period_key;
        ALTER TABLE public.monthly_record_closings ADD CONSTRAINT monthly_record_closings_office_id_target_period_key UNIQUE (office_id, target_period);
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wage_summaries_target_period_member_id_key'
    ) THEN
        ALTER TABLE public.wage_summaries DROP CONSTRAINT wage_summaries_target_period_member_id_key;
        ALTER TABLE public.wage_summaries ADD CONSTRAINT wage_summaries_office_id_target_period_member_id_key UNIQUE (office_id, target_period, member_id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monthly_financial_closings_target_period_key'
    ) THEN
        ALTER TABLE public.monthly_financial_closings DROP CONSTRAINT monthly_financial_closings_target_period_key;
        ALTER TABLE public.monthly_financial_closings ADD CONSTRAINT monthly_financial_closings_office_id_target_period_key UNIQUE (office_id, target_period);
    END IF;
END $$;
