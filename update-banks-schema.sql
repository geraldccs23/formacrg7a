-- =========================================================================
-- MIGRACIÓN BLINDADA: MULTIPLES FORMAS DE PAGO POR CUENTA
-- =========================================================================

-- 1. Eliminamos cualquier rastro de la columna vieja (si existe)
ALTER TABLE public.bank_accounts DROP COLUMN IF EXISTS payment_type;

-- 2. Eliminamos la columna nueva por si quedó atascada a medias en un error anterior
ALTER TABLE public.bank_accounts DROP COLUMN IF EXISTS payment_types;

-- 3. Creamos la columna definitivamente como un Arreglo de Textos (text[])
ALTER TABLE public.bank_accounts ADD COLUMN payment_types text[] NOT NULL DEFAULT '{}';

-- 4. RECARGAR LA MEMORIA CACHÉ DE LA API (SUPABASE)
-- ¡Esto es vital para que la página web reconozca el nuevo nombre instantáneamente!
NOTIFY pgrst, 'reload schema';
