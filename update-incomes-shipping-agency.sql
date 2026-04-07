-- Adding shipping_agency column to incomes table
-- This allows tracking national shipments (ZOOM, MRW, TEALCA)

ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS shipping_agency text;

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
