-- Tabla para guardar a los receptores, proveedores o personas que recibiran egresos
CREATE TABLE IF NOT EXISTS public.expense_recipients (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type text NOT NULL CHECK (type IN ('Proveedor', 'Servicios', 'Persona Natural', 'Nómina', 'Otro')),
  name text NOT NULL,
  document_id text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla para guardar los egresos realizados
CREATE TABLE IF NOT EXISTS public.expenses (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  branch text NOT NULL CHECK (branch IN ('Boleita', 'Sabana Grande')),
  recipient_id bigint NOT NULL,
  concept text NOT NULL,
  payment_type text NOT NULL,
  bank_account_id bigint,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expenses_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.expense_recipients(id),
  CONSTRAINT expenses_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id)
);

-- Función para DESCONTAR el balance del banco tras un egreso
CREATE OR REPLACE FUNCTION public.deduct_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el egreso afecta a una cuenta bancaria restamos el monto
  IF NEW.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
    SET balance = balance - NEW.amount
    WHERE id = NEW.bank_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara despues de insertar un egreso
DROP TRIGGER IF EXISTS after_expense_insert ON public.expenses;
CREATE TRIGGER after_expense_insert
AFTER INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.deduct_bank_balance();
