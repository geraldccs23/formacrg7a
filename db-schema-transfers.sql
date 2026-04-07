-- =========================================================================
-- MÓDULO DE TRANSFERENCIAS INTERNAS (NUEVO COMIENZO v4)
-- =========================================================================

-- 1. LIMPIEZA TOTAL (IMPORTANTE: Ejecutar esto para limpiar la caché)
DROP VIEW IF EXISTS public.v_internal_transfers_v3;
DROP VIEW IF EXISTS public.v_internal_transfers;
DROP TABLE IF EXISTS public.bank_transfers_internal;
DROP TABLE IF EXISTS public.bank_transfers;

-- 2. CREACIÓN CON NOMBRE ÚNICO (Para evitar colisiones de caché)
CREATE TABLE public.transferencias_internas_v4 (
    id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    from_account_id bigint NOT NULL REFERENCES public.bank_accounts(id),
    to_account_id bigint NOT NULL REFERENCES public.bank_accounts(id),
    amount numeric NOT NULL CHECK (amount > 0),
    reference text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. PERMISOS EXPLÍCITOS
ALTER TABLE public.transferencias_internas_v4 ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.transferencias_internas_v4 TO postgres, anon, authenticated, service_role;

CREATE POLICY "Allow all for authenticated v4" ON public.transferencias_internas_v4 FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon v4" ON public.transferencias_internas_v4 FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. VISTA COMPENSATORIA (Para facilitar el SELECT con Joins)
CREATE OR REPLACE VIEW public.v_transferencias_final_v4 AS
SELECT 
    t.*,
    jsonb_build_object('reference', fa.reference, 'banks', jsonb_build_object('name', fb.name)) as "from",
    jsonb_build_object('reference', ta.reference, 'banks', jsonb_build_object('name', tb.name)) as "to"
FROM public.transferencias_internas_v4 t
JOIN public.bank_accounts fa ON t.from_account_id = fa.id
JOIN public.banks fb ON fa.bank_code = fb.code
JOIN public.bank_accounts ta ON t.to_account_id = ta.id
JOIN public.banks tb ON ta.bank_code = tb.code;

GRANT SELECT ON public.v_transferencias_final_v4 TO anon, authenticated, service_role;

-- 5. LÓGICA DE BALANCE (TRIGGER)
CREATE OR REPLACE FUNCTION public.process_v4_transfer()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bank_accounts SET balance = balance - NEW.amount WHERE id = NEW.from_account_id;
    UPDATE public.bank_accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_v4_transfer
AFTER INSERT ON public.transferencias_internas_v4
FOR EACH ROW EXECUTE FUNCTION public.process_v4_transfer();

-- 6. RECARGA FORZOSA
NOTIFY pgrst, 'reload schema';
