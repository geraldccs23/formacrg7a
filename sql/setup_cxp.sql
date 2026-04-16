/* 
  SQL para Cuentas por Pagar (CxP) e Ingresos Extraordinarios
  Ejecutar este script en el Editor SQL de Supabase
*/

-- 1. Tabla de Cuentas por Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
    id BIGSERIAL PRIMARY KEY,
    branch TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    amount NUMERIC(20, 2) NOT NULL, -- Siempre almacenamos en USD para referencia contable
    amount_bs NUMERIC(20, 2) NOT NULL, -- Monto real en Bs al momento de adquirir la deuda
    concept TEXT NOT NULL,
    bank_account_id BIGINT REFERENCES bank_accounts(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    exchange_rate NUMERIC(20, 2) NOT NULL, -- Tasa del día de la deuda
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Pagos de Cuotas (CxP)
CREATE TABLE IF NOT EXISTS payable_payments (
    id BIGSERIAL PRIMARY KEY,
    payable_id BIGINT REFERENCES accounts_payable(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL, -- Monto en USD
    amount_bs NUMERIC(20, 2) NOT NULL, -- Monto en Bs real pagado
    payment_type TEXT NOT NULL,
    bank_account_id BIGINT REFERENCES bank_accounts(id),
    exchange_rate NUMERIC(20, 2) NOT NULL, -- Tasa aplicada al pago
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Opcional según tu configuración)
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE payable_payments ENABLE ROW LEVEL SECURITY;

-- Políticas simples para acceso total (ajustar según sea necesario)
CREATE POLICY "Allow all on accounts_payable" ON accounts_payable FOR ALL USING (true);
CREATE POLICY "Allow all on payable_payments" ON payable_payments FOR ALL USING (true);
