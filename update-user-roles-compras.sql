-- Adding 'compras' role and updating roles constraint
-- Run this in Supabase SQL Editor

-- If you have a constraint on the role column, you need to update it.
-- First, identifying the constraint name (usually something like user_roles_role_check)
-- If you don't know the name, you can drop and recreate the constraint.

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('director', 'supervisor', 'cajero', 'vendedor', 'compras'));

-- Optional: Update existing cajeros if needed, though usually they stay as is.
-- The app logic will now restrict their view based on the new definitions.

NOTIFY pgrst, 'reload schema';
