export interface Product {
  id: string;
  codigo_producto: string;
  descripcion?: string;
  brand_code?: number;
  brand_name?: string;
  supplier_code?: string;
  stock?: number;
  minStock: number;
}

export interface Supplier {
  supplier_code: string;
  supplier_name: string;
  is_active: boolean;
  avgLeadTime?: number;
  fillRate?: number;
  punctuality?: number;
  stars?: number;
}

export interface PurchaseLine {
  id: string;
  numero_documento: string;
  fecha_hora: string;
  proveedor_nombre: string;
  proveedor_codigo: string;
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  costo_usd: number;
  tipo_documento: string;
}

export interface SalesLine {
  id: string;
  numero_documento: string;
  fecha_hora: string;
  nombre_cliente: string;
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  total_usd: number;
  tipo_documento: string;
}

export interface SyncLog {
  id: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'ERROR';
  lastError?: string;
  createdAt: string;
}
