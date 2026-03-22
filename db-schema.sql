-- Esquema de base de datos RG7 ERP (Actualizado desde Supabase)

CREATE TABLE public.brands (
  brand_code integer NOT NULL,
  brand_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (brand_code)
);

CREATE TABLE public.product_brands (
  brand_code integer NOT NULL,
  brand_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_brands_pkey PRIMARY KEY (brand_code)
);

CREATE TABLE public.suppliers (
  supplier_code text NOT NULL,
  supplier_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_code)
);

CREATE TABLE public.brand_default_suppliers (
  brand_code integer NOT NULL,
  supplier_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brand_default_suppliers_pkey PRIMARY KEY (brand_code),
  CONSTRAINT brand_default_suppliers_brand_code_fkey FOREIGN KEY (brand_code) REFERENCES public.brands(brand_code),
  CONSTRAINT brand_default_suppliers_supplier_code_fkey FOREIGN KEY (supplier_code) REFERENCES public.suppliers(supplier_code)
);

CREATE TABLE public.products (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  codigo_producto text NOT NULL UNIQUE,
  vehicle_brand_code text DEFAULT split_part(codigo_producto, '-'::text, 1),
  category_code text DEFAULT split_part(codigo_producto, '-'::text, 2),
  supplier_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  brand_code integer,
  CONSTRAINT products_supplier_fk FOREIGN KEY (supplier_code) REFERENCES public.suppliers(supplier_code),
  CONSTRAINT products_brand_code_fk FOREIGN KEY (brand_code) REFERENCES public.brands(brand_code)
);

CREATE TABLE public.purchase_lines (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fuente text NOT NULL,
  fecha_hora timestamp without time zone NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  sucursal text NOT NULL,
  proveedor_codigo text,
  proveedor_nombre text,
  codigo_producto text NOT NULL,
  descripcion text,
  cantidad numeric,
  costo_bs numeric,
  costo_usd numeric,
  tasa_original numeric,
  tasa_ref_dia numeric,
  tasa_final numeric,
  tasa_es_valida boolean,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_at timestamp with time zone NOT NULL DEFAULT now(),
  uniq_key text NOT NULL UNIQUE,
  line_seq integer
);

CREATE TABLE public.sales_lines (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  fuente text NOT NULL,
  fecha_hora timestamp without time zone NOT NULL,
  tipo_documento text NOT NULL,
  numero_documento text NOT NULL,
  sucursal text NOT NULL,
  codigo_cliente text,
  nombre_cliente text,
  codigo_vendedor text,
  vendedor text,
  codigo_producto text NOT NULL,
  descripcion text,
  barra_referencia text,
  marca_producto text,
  categoria_mapeada text,
  categoria_tipo text,
  tasa numeric,
  precio_bs numeric,
  precio_usd numeric,
  cantidad numeric,
  total_bs numeric,
  total_usd numeric,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_at timestamp with time zone NOT NULL DEFAULT now(),
  uniq_key text NOT NULL
);

-- TO BE CREATED: Missing table required by SyncLogs component
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id bigint primary key generated always as identity,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    status text not null check (status in ('PENDING', 'SENT', 'ERROR')),
    last_error text,
    created_at timestamp with time zone not null default now()
);