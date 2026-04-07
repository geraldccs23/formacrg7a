-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id text PRIMARY KEY, -- Cédula or RIF
    name text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read for authenticated users
DROP POLICY IF EXISTS "Allow public read for customers" ON public.customers;
CREATE POLICY "Allow public read for customers"
ON public.customers FOR SELECT
USING (true);

-- Allow all for authenticated users (insert/update)
DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
CREATE POLICY "Allow all for customers"
ON public.customers FOR ALL
USING (true)
WITH CHECK (true);

-- Comment for PostgREST cache reload
COMMENT ON TABLE public.customers IS 'Agenda de clientes';
NOTIFY pgrst, 'reload schema';
