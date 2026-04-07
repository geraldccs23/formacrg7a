-- 1. Forzar recarga de la caché de PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Hacer un cambio trivial (con literales, sin expresiones)
COMMENT ON TABLE public.sellers IS 'Lista de vendedores';
COMMENT ON TABLE public.couriers IS 'Lista de motorizados';

-- 3. Verificamos desde SQL si las tablas existen realmente
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('sellers', 'couriers');
