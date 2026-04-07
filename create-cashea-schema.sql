-- Create Cashea Installments Table
CREATE TABLE IF NOT EXISTS public.cashea_installments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    income_id bigint REFERENCES public.incomes(id) ON DELETE CASCADE,
    installment_number int NOT NULL,
    amount_usd numeric NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone
);

-- Ensure due_date exists if table was created previously without it
ALTER TABLE public.cashea_installments ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Enable RLS
ALTER TABLE public.cashea_installments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and update
DROP POLICY IF EXISTS "Allow authenticated read for cashea" ON public.cashea_installments;
CREATE POLICY "Allow authenticated read for cashea" ON public.cashea_installments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated update for cashea" ON public.cashea_installments;
CREATE POLICY "Allow authenticated update for cashea" ON public.cashea_installments
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert for cashea" ON public.cashea_installments;
CREATE POLICY "Allow authenticated insert for cashea" ON public.cashea_installments
    FOR INSERT TO authenticated WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cashea_income_id ON public.cashea_installments(income_id);
CREATE INDEX IF NOT EXISTS idx_cashea_status ON public.cashea_installments(status);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
