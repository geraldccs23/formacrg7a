-- Add cash_register column to incomes table
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS cash_register text;

-- Optional: Re-notify schema cache
NOTIFY pgrst, 'reload schema';
