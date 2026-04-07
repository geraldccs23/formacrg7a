-- =========================================================================
-- CREACIÓN DE TABLA DE ROLES PARA CONTROL DE ACCESO (RBAC)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('director', 'supervisor', 'cajero')) DEFAULT 'cajero',
    created_at timestamptz DEFAULT now()
);

-- Habilitar a la API a hacer POST para que los propios usuarios nuevos se auto-registren su rol por defecto a cajero
-- Como la base de datos de RG7 tiene RLS globalmente desactivado (Unrestricted), no declaramos políticas adicionales.

-- Refrescar caché por si acaso
NOTIFY pgrst, 'reload schema';
