export interface Product {
  id: string;
  codigo_producto: string;
  descripcion?: string;
  modelo?: string;
  ref?: string;
  precio_usd?: number;
  precio_bs?: number;
  tasa_ref?: number;
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
  fuente: string;
  fecha_hora: string;
  tipo_documento: string;
  numero_documento: string;
  sucursal: string;
  proveedor_codigo?: string;
  proveedor_nombre?: string;
  codigo_producto: string;
  descripcion?: string;
  cantidad: number;
  costo_bs?: number;
  costo_usd: number;
  tasa_original?: number;
  tasa_ref_dia?: number;
  tasa_final?: number;
  tasa_es_valida?: boolean;
}

export interface SalesLine {
  id: string;
  fuente: string;
  fecha_hora: string;
  tipo_documento: string;
  numero_documento: string;
  sucursal: string;
  codigo_cliente?: string;
  nombre_cliente?: string;
  codigo_vendedor?: string;
  vendedor?: string;
  codigo_producto: string;
  descripcion?: string;
  barra_referencia?: string;
  marca_producto?: string;
  categoria_mapeada?: string;
  categoria_tipo?: string;
  tasa?: number;
  precio_bs?: number;
  precio_usd?: number;
  cantidad: number;
  total_bs?: number;
  total_usd: number;
}

export interface SyncLog {
  id: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SENT' | 'ERROR';
  lastError?: string;
  createdAt: string;
}
