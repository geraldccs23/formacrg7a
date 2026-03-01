-- Esquema de base de datos RG7 ERP
-- Compatible con integración SAINT

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    unit VARCHAR(20),
    stock_tienda INTEGER DEFAULT 0,
    stock_deposito INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100),
    payload JSONB,
    status VARCHAR(20),
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);