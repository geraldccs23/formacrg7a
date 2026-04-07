CREATE TABLE IF NOT EXISTS public.bank_initial_balances (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bank_account_id bigint NOT NULL REFERENCES public.bank_accounts(id),
    amount numeric(15,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_initial_balances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Enable all admin on bank_initial_balances" ON public.bank_initial_balances;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Enable all admin on bank_initial_balances" 
ON public.bank_initial_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.process_initial_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE public.bank_accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_initial_balance_approval ON public.bank_initial_balances;
CREATE TRIGGER trg_initial_balance_approval
AFTER UPDATE ON public.bank_initial_balances
FOR EACH ROW
EXECUTE FUNCTION public.process_initial_balance();

GRANT ALL ON public.bank_initial_balances TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
