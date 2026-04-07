-- ========================================================
-- FUNCIONES CORREGIDAS PARA REVERTIR SALDOS EN ELIMINACIÓN
-- ========================================================

-- INCOMES: Update Bank Balance
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.bank_account_id;
      END IF;
      RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
      IF OLD.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance - OLD.amount
        WHERE id = OLD.bank_account_id;
      END IF;
      RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_income_payment_insert ON public.income_payments;
DROP TRIGGER IF EXISTS after_income_payment_action ON public.income_payments;

CREATE TRIGGER after_income_payment_action
AFTER INSERT OR DELETE ON public.income_payments
FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance();

-- EXPENSES: Deduct Bank Balance
CREATE OR REPLACE FUNCTION public.deduct_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance - NEW.amount
        WHERE id = NEW.bank_account_id;
      END IF;
      RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
      IF OLD.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance + OLD.amount
        WHERE id = OLD.bank_account_id;
      END IF;
      RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_expense_insert ON public.expenses;
DROP TRIGGER IF EXISTS after_expense_action ON public.expenses;

CREATE TRIGGER after_expense_action
AFTER INSERT OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.deduct_bank_balance();

-- Activar auditoría general para Incomes y Expenses en la traza
DROP TRIGGER IF EXISTS trg_audit_incomes ON public.incomes;
CREATE TRIGGER trg_audit_incomes
AFTER UPDATE OR DELETE ON public.incomes
FOR EACH ROW EXECUTE FUNCTION public.process_bank_audit();

DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
CREATE TRIGGER trg_audit_expenses
AFTER UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.process_bank_audit();

NOTIFY pgrst, 'reload schema';
