-- Tablas para el módulo de Bancos

CREATE TABLE IF NOT EXISTS public.banks (
  code text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT banks_pkey PRIMARY KEY (code)
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  bank_code text NOT NULL,
  reference text NOT NULL,
  payment_type text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bank_accounts_bank_code_fkey FOREIGN KEY (bank_code) REFERENCES public.banks(code)
);
