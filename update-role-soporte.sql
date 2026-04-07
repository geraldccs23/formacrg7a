-- Update user_roles constraint to include 'soporte'
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role = ANY (ARRAY['director'::text, 'supervisor'::text, 'cajero'::text, 'vendedor'::text, 'compras'::text, 'soporte'::text]));

-- Reload schema
NOTIFY pgrst, 'reload schema';
