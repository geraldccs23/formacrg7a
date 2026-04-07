-- =========================================================================
-- ACTUALIZACIÓN DE RESTRICCIÓN DE ROLES PARA INCLUIR 'VENDEDOR'
-- =========================================================================

-- 1. Eliminar la restricción actual
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

-- 2. Volver a crearla incluyendo 'vendedor'
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('director', 'supervisor', 'cajero', 'vendedor'));

-- 3. Refrescar caché de PostgREST
NOTIFY pgrst, 'reload schema';
