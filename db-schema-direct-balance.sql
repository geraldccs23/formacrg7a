-- Actualización: Saldos Iniciales Aplicados Directamente (Sin Aprobación)
-- Ahora se aplica el saldo inmediatamente en la inserción si el status es 'approved'

CREATE OR REPLACE FUNCTION public.process_initial_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Se aplica al insertar directamente como approved o al actualizar a approved
    IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status = 'pending') THEN
        
        -- Sobrescribimos el balance (Es un saldo INICIAL, re-setea la cuenta)
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
