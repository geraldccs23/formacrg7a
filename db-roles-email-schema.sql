-- =========================================================================
-- EXPANSION DE ROLES: AGREGANDO EMAIL PARA GESTIÓN DESDE LA UI
-- =========================================================================

-- Añadir columna email a la tabla de roles si no existe
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS email text;

-- Refrescar la caché de la API para que reaccione al nuevo campo
NOTIFY pgrst, 'reload schema';
