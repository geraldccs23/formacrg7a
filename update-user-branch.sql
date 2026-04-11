-- Add branch column to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS branch text DEFAULT 'Boleita';

-- Optional: Update valid branches constraint if needed
-- For now, let's just make sure it exists.

NOTIFY pgrst, 'reload schema';
