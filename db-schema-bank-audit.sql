CREATE TABLE IF NOT EXISTS public.bank_audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    user_email text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Enable read for admin on bank_audit_logs" ON public.bank_audit_logs;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Enable read for admin on bank_audit_logs" 
ON public.bank_audit_logs FOR SELECT TO authenticated USING (true);


CREATE OR REPLACE FUNCTION public.process_bank_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email text;
    v_record_id text;
BEGIN
    SELECT email INTO v_user_email FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
    
    IF v_user_email IS NULL THEN
        v_user_email := 'Sistema / Desconocido';
    END IF;

    -- Extraer el ID o Código dependiendo de la tabla
    IF (TG_TABLE_NAME = 'banks') THEN
        IF (TG_OP = 'DELETE') THEN
            v_record_id := OLD.code;
        ELSE
            v_record_id := NEW.code;
        END IF;
    ELSE
        IF (TG_OP = 'DELETE') THEN
            v_record_id := OLD.id::text;
        ELSE
            v_record_id := NEW.id::text;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.bank_audit_logs (table_name, record_id, action, old_data, user_email)
        VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', row_to_json(OLD)::jsonb, v_user_email);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.bank_audit_logs (table_name, record_id, action, old_data, new_data, user_email)
        VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_email);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.bank_audit_logs (table_name, record_id, action, new_data, user_email)
        VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', row_to_json(NEW)::jsonb, v_user_email);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_banks ON public.banks;
CREATE TRIGGER trg_audit_banks
AFTER UPDATE OR DELETE ON public.banks
FOR EACH ROW EXECUTE FUNCTION public.process_bank_audit();

DROP TRIGGER IF EXISTS trg_audit_bank_accounts ON public.bank_accounts;
CREATE TRIGGER trg_audit_bank_accounts
AFTER UPDATE OR DELETE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.process_bank_audit();

GRANT ALL ON public.bank_audit_logs TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
