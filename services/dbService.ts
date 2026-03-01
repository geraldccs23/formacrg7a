import { supabase } from './supabase';
import { Product, Supplier, PurchaseLine, SalesLine, SyncLog } from '../types';

export const dbService = {
  // Products with calculated stock
  async getProducts(): Promise<Product[]> {
    const { data: products, error: pError } = await supabase
      .from('products')
      .select('*, brands(brand_name)');
    
    if (pError) throw pError;

    // Calculate stock from purchase_lines and sales_lines
    const { data: purchases } = await supabase.from('purchase_lines').select('codigo_producto, cantidad');
    const { data: sales } = await supabase.from('sales_lines').select('codigo_producto, cantidad');

    const stockMap: Record<string, number> = {};
    purchases?.forEach(p => {
      stockMap[p.codigo_producto] = (stockMap[p.codigo_producto] || 0) + Number(p.cantidad);
    });
    sales?.forEach(s => {
      stockMap[s.codigo_producto] = (stockMap[s.codigo_producto] || 0) - Number(s.cantidad);
    });

    return (products || []).map(p => ({
      id: p.id.toString(),
      codigo_producto: p.codigo_producto,
      descripcion: p.descripcion || 'Sin descripción',
      brand_code: p.brand_code,
      brand_name: p.brands?.brand_name,
      supplier_code: p.supplier_code,
      stock: stockMap[p.codigo_producto] || 0,
      minStock: 7 // Default for RG7
    }));
  },

  // Fordmac Ranking
  async getFordmacRanking(): Promise<Supplier[]> {
    const { data: suppliers, error: sError } = await supabase.from('suppliers').select('*');
    if (sError) throw sError;

    const { data: lines } = await supabase.from('purchase_lines').select('*');
    
    return (suppliers || []).map(s => {
      const sLines = lines?.filter(l => l.proveedor_codigo === s.supplier_code) || [];
      
      // Lead Time logic: compare 'ORDEN' vs 'COMPRA' for same product/quantity if possible
      // This is a simplified version for the ranking view
      const avgLeadTime = 7.5; // Placeholder for complex logic
      const fillRate = 0.92; // Placeholder
      const punctuality = 0.88; // Placeholder
      const stars = ((fillRate * 0.4) + (punctuality * 0.4) + 0.2) * 5;

      return {
        supplier_code: s.supplier_code,
        supplier_name: s.supplier_name,
        is_active: s.is_active,
        avgLeadTime,
        fillRate,
        punctuality,
        stars
      };
    });
  },

  // Sales (Delivery Notes)
  async getDeliveryNotes(): Promise<SalesLine[]> {
    const { data, error } = await supabase
      .from('sales_lines')
      .select('*')
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Purchase Lines
  async getPurchaseLines(): Promise<{ data: PurchaseLine[], error: any }> {
    const { data, error } = await supabase
      .from('purchase_lines')
      .select('*')
      .order('fecha_hora', { ascending: false });
    
    return { data: data || [], error };
  },

  // Sales Lines
  async getSalesLines(): Promise<{ data: SalesLine[], error: any }> {
    const { data, error } = await supabase
      .from('sales_lines')
      .select('*')
      .order('fecha_hora', { ascending: false });
    
    return { data: data || [], error };
  },

  // Sync Logs
  async getSyncLogs(): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.warn('sync_logs table might not exist yet');
      return [];
    }
    return data || [];
  }
};
