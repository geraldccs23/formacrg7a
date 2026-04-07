-- Purchase Orders Table
CREATE TABLE public.purchase_orders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  provider_code text,
  provider_name text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'partial'::text, 'received'::text, 'cancelled'::text])),
  total_amount_usd numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sucursal text NOT NULL DEFAULT 'Boleita'::text,
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id)
);

-- Purchase Order Items Table
CREATE TABLE public.purchase_order_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  purchase_order_id bigint NOT NULL,
  product_code text NOT NULL,
  description text,
  quantity numeric NOT NULL,
  received_quantity numeric NOT NULL DEFAULT 0,
  unit_price_usd numeric NOT NULL,
  total_price_usd numeric NOT NULL,
  CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
