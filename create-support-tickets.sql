-- ========================================================
-- SCHEMA PARA TICKETS DE SOPORTE Y REQUERIMIENTOS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    category text NOT NULL CHECK (category IN ('bug', 'feature_request', 'support', 'other')) DEFAULT 'support',
    user_id uuid NOT NULL REFERENCES auth.users(id),
    assigned_to uuid REFERENCES auth.users(id),
    branch text, -- Para saber de qué sucursal viene el requerimiento
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger para actualizar el campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_support_tickets_modtime') THEN
        CREATE TRIGGER update_support_tickets_modtime
            BEFORE UPDATE ON public.support_tickets
            FOR EACH ROW
            EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;

-- Vista para ver los tickets con el email de quien los creó y a quién se asignó
CREATE OR REPLACE VIEW v_support_tickets AS
SELECT 
    t.*,
    u_creator.email as creator_email,
    u_assigned.email as assigned_email
FROM public.support_tickets t
LEFT JOIN auth.users u_creator ON t.user_id = u_creator.id
LEFT JOIN auth.users u_assigned ON t.assigned_to = u_assigned.id;

NOTIFY pgrst, 'reload schema';
