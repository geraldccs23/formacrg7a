-- Tabla principal de Ingresos
CREATE TABLE IF NOT EXISTS public.incomes (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  branch text NOT NULL CHECK (branch IN ('Boleita', 'Sabana Grande')),
  document_type text NOT NULL,
  document_number text NOT NULL,
  payment_condition text NOT NULL CHECK (payment_condition IN ('Contado', 'Inicial de Cashea', 'Credito')),
  customer_id text,
  customer_name text,
  customer_phone text,
  total_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla de los pagos (detalles) del ingreso
CREATE TABLE IF NOT EXISTS public.income_payments (
  id bigint NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  income_id bigint NOT NULL,
  payment_type text NOT NULL,
  amount numeric NOT NULL,
  bank_account_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT income_payments_income_id_fkey FOREIGN KEY (income_id) REFERENCES public.incomes(id) ON DELETE CASCADE,
  CONSTRAINT income_payments_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id)
);

-- Función para actualizar el balance del banco
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el pago está asociado a una cuenta bancaria sumamos el monto
  IF NEW.bank_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.bank_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se dispara despues de insertar un pago de ingreso
DROP TRIGGER IF EXISTS after_income_payment_insert ON public.income_payments;
CREATE TRIGGER after_income_payment_insert
AFTER INSERT ON public.income_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_bank_balance();
