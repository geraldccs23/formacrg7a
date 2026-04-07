-- Add exchange_rate and amount_bs to income_payments and expenses
-- This allows tracking the original amount in Bolivares and the rate used for conversion.

-- 1. Update income_payments
ALTER TABLE public.income_payments 
ADD COLUMN IF NOT EXISTS exchange_rate numeric,
ADD COLUMN IF NOT EXISTS amount_bs numeric;

-- 2. Update expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS exchange_rate numeric,
ADD COLUMN IF NOT EXISTS amount_bs numeric;

-- Update existing records (optional, set to 0 or null)
-- Currently, they'll be null for old records.
