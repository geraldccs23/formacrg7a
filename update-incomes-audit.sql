-- Track who created the income and from which cashier
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS created_by_email text,
ADD COLUMN IF NOT EXISTS created_by_id uuid;

-- Update existing records if possible (optional, but good for consistency)
-- UPDATE public.incomes SET created_by_email = 'system@rg7.com.ve' WHERE created_by_email IS NULL;

-- Reload schema
NOTIFY pgrst, 'reload schema';
