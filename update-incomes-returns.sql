-- Añadir columna 'type' a la tabla de incomes para manejar devoluciones
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS type text DEFAULT 'Venta' CHECK (type IN ('Venta', 'Devolucion'));

-- Actualizar registros existentes si es necesario (ya tienen el default 'Venta')

-- Opcional: Agregar comentarios para documentación
COMMENT ON COLUMN public.incomes.type IS 'Tipo de registro: Venta (ingreso normal) o Devolucion (egreso por reversión)';
