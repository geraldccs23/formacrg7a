-- FORDMAC Analytical Schema
-- This schema extends the existing system to provide supplier performance metrics.

-- 1. Purchase Orders Header (The "Request")
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    numero_orden text UNIQUE NOT NULL,
    supplier_code text REFERENCES public.suppliers(supplier_code),
    fecha_emision timestamp with time zone NOT NULL DEFAULT now(),
    fecha_prometida timestamp with time zone,
    es_urgente boolean DEFAULT false,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED')),
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Purchase Order Lines (The "Expected")
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    order_id bigint REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    codigo_producto text NOT NULL,
    cantidad_pedida numeric NOT NULL,
    precio_unitario_usd numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. FORDMAC Configuration (Weights)
CREATE TABLE IF NOT EXISTS public.fordmac_config (
    id integer PRIMARY KEY DEFAULT 1,
    weight_lead_time numeric DEFAULT 0.40,
    weight_fill_rate numeric DEFAULT 0.35,
    weight_punctuality numeric DEFAULT 0.25,
    last_updated timestamp with time zone DEFAULT now(),
    CONSTRAINT one_row CHECK (id = 1)
);

-- 4. Linking existing receipts (purchase_lines) to POs
-- This allows calculating Lead Time and Fill Rate.
ALTER TABLE public.purchase_lines 
ADD COLUMN IF NOT EXISTS order_id bigint REFERENCES public.purchase_orders(id);

-- Initialize default config if not exists
INSERT INTO public.fordmac_config (id, weight_lead_time, weight_fill_rate, weight_punctuality)
VALUES (1, 0.40, 0.35, 0.25)
ON CONFLICT (id) DO NOTHING;
