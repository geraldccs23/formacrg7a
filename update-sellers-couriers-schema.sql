-- 1. Create Sellers Table
CREATE TABLE IF NOT EXISTS public.sellers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text UNIQUE NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Sellers
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Sellers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for sellers') THEN
        CREATE POLICY "Allow public read for sellers" ON public.sellers
            FOR SELECT TO authenticated USING (true);
    END IF;
END
$$;

-- 2. Seed Sellers Table
INSERT INTO public.sellers (name) VALUES
('ANAITZA FUENTES'), ('Vendedor'), ('LUIS DELGADO'), ('ML'), ('ROBERTO ARRIOJA'), 
('ENGERLYNT BELLO'), ('Antoan Ysea'), ('DANIELA ESCALONA'), ('TIENDA BOLEITA'), 
('CARLOS VALBUENA'), ('VENTAS MOTOSIETE'), ('MARKETPLACE'), ('YESENIA ACOSTA'), 
('VENTAS INTERNAS A MOTOSIETE'), ('TIENDA CHACAO'), ('TIENDA SABANA GRANDE'), 
('OSCAR PEREZ'), ('VENTAS INTERNAS A CHACAO'), ('YUKKAZO')
ON CONFLICT (name) DO NOTHING;

-- 3. Create Couriers Table
CREATE TABLE IF NOT EXISTS public.couriers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text UNIQUE NOT NULL,
    phone text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for Couriers
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Couriers
DO $$
BEGIN
    -- Read policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read for couriers') THEN
        CREATE POLICY "Allow public read for couriers" ON public.couriers
            FOR SELECT TO authenticated USING (true);
    END IF;
    
    -- Insert policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert for couriers') THEN
        CREATE POLICY "Allow authenticated insert for couriers" ON public.couriers
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END
$$;

-- 4. Update Incomes Table
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS seller_id bigint REFERENCES public.sellers(id),
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'Retira en Tienda',
ADD COLUMN IF NOT EXISTS courier_id bigint REFERENCES public.couriers(id);

-- 5. Force Schema Cache Reload (Manual notify if supported/needed)
NOTIFY pgrst, 'reload schema';
