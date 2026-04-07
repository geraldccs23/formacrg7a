-- Actualización: Columna 'user_email' para trazabilidad en saldos iniciales directos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_initial_balances' AND column_name='user_email') THEN
        ALTER TABLE public.bank_initial_balances ADD COLUMN user_email text;
    END IF;
END $$;

-- Funciones actualizadas para re-setear saldo sin aprobación previa
CREATE OR REPLACE FUNCTION public.process_initial_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status = 'pending') THEN
        
        -- Saldo inicial: Re-setea el balance a la cifra indicada
        UPDATE public.bank_accounts
        SET balance = NEW.amount
        WHERE id = NEW.bank_account_id;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_initial_balance_approval ON public.bank_initial_balances;
CREATE TRIGGER trg_initial_balance_approval
AFTER INSERT OR UPDATE ON public.bank_initial_balances
FOR EACH ROW
EXECUTE FUNCTION public.process_initial_balance();

NOTIFY pgrst, 'reload schema';
