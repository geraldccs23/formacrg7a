-- ========================================================
-- FUNCIONES CORREGIDAS PARA SOPORTAR EDICION (UPDATE)
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
  ELSIF (TG_OP = 'UPDATE') THEN
      -- Si cambio el banco, reversamos en el viejo y sumamos en el nuevo
      IF OLD.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts SET balance = balance - OLD.amount WHERE id = OLD.bank_account_id;
      END IF;
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts SET balance = balance + NEW.amount WHERE id = NEW.bank_account_id;
      END IF;
      RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_income_payment_action ON public.income_payments;
CREATE TRIGGER after_income_payment_action
AFTER INSERT OR DELETE OR UPDATE ON public.income_payments
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
  ELSIF (TG_OP = 'UPDATE') THEN
      -- Si cambio el banco de egreso, reversamos (sumamos) en el viejo y restamos en el nuevo
      IF OLD.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts SET balance = balance + OLD.amount WHERE id = OLD.bank_account_id;
      END IF;
      IF NEW.bank_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts SET balance = balance - NEW.amount WHERE id = NEW.bank_account_id;
      END IF;
      RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_expense_action ON public.expenses;
CREATE TRIGGER after_expense_action
AFTER INSERT OR DELETE OR UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.deduct_bank_balance();

NOTIFY pgrst, 'reload schema';
