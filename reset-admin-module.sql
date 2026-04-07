-- =========================================================================
-- SCRIPT DE REINICIO DEL MÓDULO ADMINISTRATIVO (PUESTA A CERO)
-- =========================================================================

-- 1. Eliminar todas las transacciones de Egresos e Ingresos
TRUNCATE TABLE public.expenses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.income_payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.incomes RESTART IDENTITY CASCADE;

-- 2. Colocar todos los saldos de las Cuentas Bancarias registradas en 0.00
UPDATE public.bank_accounts SET balance = 0;

-- =========================================================================
-- OPCIONAL: Si también quieres BORRAR los Bancos y Proveedores de prueba
-- (quitales los guiones del principio para ejecutar estas lineas)
-- =========================================================================
-- TRUNCATE TABLE public.expense_recipients RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.bank_accounts RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.banks RESTART IDENTITY CASCADE;
