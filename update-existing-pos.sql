-- Adapt existing Purchase Orders tables to the new functionality
-- 1. Update purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS sucursal text DEFAULT 'Boleita'::text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS total_amount_usd numeric DEFAULT 0;

-- 2. Update purchase_order_lines
ALTER TABLE public.purchase_order_lines
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS cantidad_recibida numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_linea_usd numeric DEFAULT 0;

-- 3. Ensure the status CHECK is correct (Uppercase vs Lowercase)
-- The existing schema has PENDING, PARTIAL, COMPLETED, CANCELLED.
-- I'll keep those but ensure the code matches.

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
