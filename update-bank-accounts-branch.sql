-- =========================================================================
-- MIGRACIÓN: ASIGNAR CUENTAS BANCARIAS POR SUCURSAL
-- =========================================================================

-- 1. Agregar la columna sucursal a bank_accounts
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS sucursal text NOT NULL DEFAULT 'Boleita';

-- 2. Asegurarse de que el valor sea uno de los permitidos (Boleita o Sabana Grande)
-- (Opcional, pero recomendado para integridad)
-- ALTER TABLE public.bank_accounts ADD CONSTRAINT check_sucursal CHECK (sucursal IN ('Boleita', 'Sabana Grande'));

-- 3. RECARGAR LA MEMORIA CACHÉ DE LA API
NOTIFY pgrst, 'reload schema';
