-- El truco de renombrar para forzar a la API a darse cuenta de que existen
ALTER TABLE public.sellers RENAME TO sellers_old;
ALTER TABLE public.sellers_old RENAME TO sellers;

ALTER TABLE public.couriers RENAME TO couriers_old;
ALTER TABLE public.couriers_old RENAME TO couriers;

-- Notificar de nuevo por si acaso
NOTIFY pgrst, 'reload schema';
