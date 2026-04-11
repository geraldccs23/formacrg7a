import { supabase } from './supabase';
import { Product, Supplier, PurchaseLine, SalesLine, SyncLog, Seller, Courier, CasheaInstallment, BankTransfer, SupportTicket } from '../types';

export const dbService = {
  // Products with calculated stock (DEPRECATED - Use getLatestStock for snapshot-based stock)
  async getProducts(): Promise<Product[]> {
    // ... (logic remains for legacy but main stock source is now snapshots)
    return [];
  },

  // Latest Stock Snapshot by Branch
  async getLatestStock(branch: string, search?: string, page = 0, limit = 15): Promise<{ data: any[], count: number }> {
    let query = supabase.from('v_latest_stock_by_branch').select('*', { count: 'exact' });

    if (branch && branch !== 'ALL') {
      query = query.eq('branch', branch);
    } else {
      query = query.in('branch', ['01', '03']);
    }

    if (search) {
      query = query.or(`codigo_producto.ilike.%${search}%,descripcion.ilike.%${search}%,modelo.ilike.%${search}%`);
    }

    const { data: stockData, error, count } = await query
      .order('codigo_producto', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    // Use prices directly from snapshot
    const enrichedData = (stockData || []).map(s => ({
      ...s,
      price: Number(s.precio_usd) || 0
    }));

    return { data: enrichedData, count: count || 0 };
  },

  // Fordmac Ranking
  async getFordmacRanking(): Promise<Supplier[]> {
    const { data: suppliers, error: sError } = await supabase.from('suppliers').select('*');
    if (sError) throw sError;

    const { data: receipts } = await supabase.from('purchase_lines').select('*').order('fecha_hora', { ascending: true });

    let config = null;
    try {
      const { data } = await supabase.from('fordmac_config').select('*').single();
      config = data;
    } catch (e) {
      console.warn('fordmac_config table missing');
    }

    const weights = config || { weight_lead_time: 0.4, weight_fill_rate: 0.35, weight_punctuality: 0.25 };

    return (suppliers || []).map(s => {
      const sReceipts = receipts?.filter(r => r.proveedor_codigo === s.supplier_code) || [];
      if (sReceipts.length === 0) return { ...s, avgLeadTime: 0, fillRate: 0, punctuality: 0, stars: 0 };

      // Calculate Frequency (Avg days between unique receipt dates)
      const uniqueDates = [...new Set(sReceipts.map(r => new Date(r.fecha_hora).toDateString()))]
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

      let avgFrequencyDays = 0;
      if (uniqueDates.length > 1) {
        const totalDiff = uniqueDates[uniqueDates.length - 1].getTime() - uniqueDates[0].getTime();
        avgFrequencyDays = (totalDiff / (1000 * 60 * 60 * 24)) / (uniqueDates.length - 1);
      }

      // Fill Rate (Placeholder as we don't have POs yet for historical data, 
      // but we keep the structure for when POs start being generated)
      const fillRate = 1.0; // Assume 100% if no PO to compare against

      // Frequency Score: 0-1 (e.g., delivery every 7 days is 1.0, > 30 days is 0)
      const frequencyScore = avgFrequencyDays === 0 ? 0.5 : Math.max(0, 1 - (avgFrequencyDays / 30));

      const rawScore = (0.5 * weights.weight_lead_time) + // Lead time neutral without PO
        (fillRate * weights.weight_fill_rate) +
        (frequencyScore * weights.weight_punctuality); // Reuse punctuality weight for frequency

      const stars = Math.min(5, Math.max(0, rawScore * 5));

      return {
        supplier_code: s.supplier_code,
        supplier_name: s.supplier_name,
        is_active: s.is_active,
        avgLeadTime: avgFrequencyDays, // Using this field to store frequency for now
        fillRate,
        punctuality: uniqueDates.length / 12, // Deliveries per month (approx)
        stars
      };
    });
  },

  async getFordmacConfig() {
    try {
      const { data, error } = await supabase.from('fordmac_config').select('*').single();
      if (error) throw error;
      return data;
    } catch (error) {
      return { weight_lead_time: 0.4, weight_fill_rate: 0.35, weight_punctuality: 0.25 };
    }
  },

  async updateFordmacConfig(config: any) {
    const { error } = await supabase
      .from('fordmac_config')
      .update({ ...config, last_updated: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw error;
  },

  // Sales (Delivery Notes) with server-side filters
  async getDeliveryNotes(page = 0, limit = 50, filters: any = {}): Promise<SalesLine[]> {
    // Narrow selection to reduce payload size
    let query = supabase.from('v_sales_lines').select(`
      id, 
      numero_documento, 
      codigo_producto, 
      descripcion, 
      nombre_cliente, 
      sucursal, 
      fecha_hora, 
      total_usd, 
      cantidad,
      vendedor,
      fuente,
      tipo_documento
    `);

    if (filters.sucursal) query = query.eq('sucursal', filters.sucursal);
    if (filters.vendedor) query = query.eq('vendedor', filters.vendedor);
    if (filters.date) query = query.gte('fecha_hora', `${filters.date}T00:00:00`).lte('fecha_hora', `${filters.date}T23:59:59`);
    if (filters.search) {
      query = query.or(`numero_documento.ilike.%${filters.search}%,nombre_cliente.ilike.%${filters.search}%,codigo_producto.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .order('fecha_hora', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;
    return data || [];
  },

  // Document Details (Sales)
  async getSalesDetails(numero_documento: string): Promise<SalesLine[]> {
    const { data, error } = await supabase
      .from('v_sales_lines')
      .select('*')
      .eq('numero_documento', numero_documento);

    if (error) throw error;
    return data || [];
  },

  // Purchase Lines with server-side filters
  async getPurchaseLines(page = 0, limit = 50, filters: any = {}): Promise<{ data: PurchaseLine[], error: any }> {
    let query = supabase.from('purchase_lines').select(`
      id,
      numero_documento,
      proveedor_nombre,
      sucursal,
      fecha_hora,
      costo_usd,
      tasa_final,
      codigo_producto,
      descripcion,
      cantidad,
      fuente,
      tipo_documento
    `);

    if (filters.sucursal) query = query.eq('sucursal', filters.sucursal);
    if (filters.proveedor) query = query.eq('proveedor_nombre', filters.proveedor);
    if (filters.date) query = query.gte('fecha_hora', `${filters.date}T00:00:00`).lte('fecha_hora', `${filters.date}T23:59:59`);
    if (filters.search) {
      query = query.or(`numero_documento.ilike.%${filters.search}%,proveedor_nombre.ilike.%${filters.search}%,codigo_producto.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .order('fecha_hora', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    return { data: data || [], error };
  },

  // Document Details (Purchases)
  async getPurchaseDetails(numero_documento: string): Promise<PurchaseLine[]> {
    const { data, error } = await supabase
      .from('purchase_lines')
      .select('*')
      .eq('numero_documento', numero_documento);

    if (error) throw error;
    return data || [];
  },

  // Unique filter values - Optimized with Views
  async getFilterOptions() {
    // Attempt to use optimized views
    const [sSales, sPurch] = await Promise.all([
      supabase.from('v_sales_filters').select('*'),
      supabase.from('v_purchase_filters').select('*')
    ]);

    if (!sSales.error && !sPurch.error) {
      return {
        sucursales: Array.from(new Set([
          ...(sSales.data?.map(d => d.sucursal) || []),
          ...(sPurch.data?.map(d => d.sucursal) || [])
        ])).filter(Boolean).sort(),
        vendedores: Array.from(new Set(sSales.data?.map(d => d.vendedor).filter(Boolean) || [])).sort(),
        proveedores: Array.from(new Set(sPurch.data?.map(d => d.proveedor_nombre).filter(Boolean) || [])).sort()
      };
    }

    console.warn('Filter views missing or unreachable, falling back to limited scan');
    // Fallback to limited scan to avoid performance crash
    const [sSalesFallback, sPurchFallback] = await Promise.all([
      supabase.from('v_sales_lines').select('sucursal, vendedor').limit(1000),
      supabase.from('purchase_lines').select('sucursal, proveedor_nombre').limit(1000)
    ]);

    return {
      sucursales: Array.from(new Set([
        ...(sSalesFallback.data?.map(d => d.sucursal) || []),
        ...(sPurchFallback.data?.map(d => d.sucursal) || [])
      ])).filter(Boolean).sort(),
      vendedores: Array.from(new Set(sSalesFallback.data?.map(d => d.vendedor).filter(Boolean) || [])).sort(),
      proveedores: Array.from(new Set(sPurchFallback.data?.map(d => d.proveedor_nombre).filter(Boolean) || [])).sort()
    };
  },

  // Sales Lines (Legacy/Alias for internal use)
  async getSalesLines(page = 0, limit = 50, filters: any = {}): Promise<{ data: SalesLine[], error: any }> {
    const data = await this.getDeliveryNotes(page, limit, filters);
    return { data, error: null };
  },

  // Helper to map numeric codes to DB sucursal names
  _mapBranch(code: string): string {
    const map: Record<string, string> = {
      '01': 'BOLEITA',
      '03': 'SABANA GRANDE'
    };
    return map[code] || code;
  },

  // Run FORDMAC Replenishment Analysis
  async runFordmacAnalysis(params: {
    branch: string,
    lookbackDays: number,
    leadTimeDays: number,
    reviewDays: number,
    safetyFactor: number,
    prefixes?: string[],
    search?: string,
    subCategory?: string
  }): Promise<any[]> {
    const { branch, lookbackDays, leadTimeDays, reviewDays, safetyFactor, prefixes, search, subCategory } = params;
    const dbBranch = this._mapBranch(branch);

    // 1. Get Stock Snapshots
    let stockQuery = supabase
      .from('v_latest_stock_by_branch')
      .select('branch, codigo_producto, stock, descripcion, modelo, ref, precio_usd');

    if (branch && branch !== 'ALL') {
      stockQuery = stockQuery.eq('branch', branch);
    } else {
      // For ALL, we want all snapshots from the branches we track
      stockQuery = stockQuery.in('branch', ['01', '03']);
    }

    if (prefixes && prefixes.length > 0) {
      const filterStr = prefixes.map(p => `codigo_producto.ilike.${p}%`).join(',');
      stockQuery = stockQuery.or(filterStr);
    }

    if (search) {
      stockQuery = stockQuery.or(`codigo_producto.ilike.%${search}%,descripcion.ilike.%${search}%,ref.ilike.%${search}%`);
    }

    if (subCategory && subCategory !== 'ALL') {
      stockQuery = stockQuery.ilike('codigo_producto', `%-${subCategory}-%`);
    }

    const { data: stockData, error: sError } = await stockQuery;
    if (sError) throw sError;

    // 2. Get Sales for activity check
    const activityStartDate = new Date();
    activityStartDate.setDate(activityStartDate.getDate() - 365);
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    const lookbackStartDate = new Date();
    lookbackStartDate.setDate(lookbackStartDate.getDate() - lookbackDays);

    let salesQuery = supabase
      .from('v_sales_lines')
      .select('sucursal, codigo_producto, cantidad, fecha_hora, precio_usd')
      .gte('fecha_hora', activityStartDate.toISOString());

    if (branch && branch !== 'ALL') {
      salesQuery = salesQuery.eq('sucursal', dbBranch);
    }

    if (prefixes && prefixes.length > 0) {
      const filterStr = prefixes.map(p => `codigo_producto.ilike.${p}%`).join(',');
      salesQuery = salesQuery.or(filterStr);
    }

    if (search) {
      salesQuery = salesQuery.or(`codigo_producto.ilike.%${search}%,descripcion.ilike.%${search}%,barra_referencia.ilike.%${search}%`);
    }

    if (subCategory && subCategory !== 'ALL') {
      salesQuery = salesQuery.ilike('codigo_producto', `%-${subCategory}-%`);
    }

    const { data: salesData, error: salesError } = await salesQuery;
    if (salesError) throw salesError;

    // 3. Aggregate Data
    const movement45d = new Set<string>();
    const lastSaleMap: Record<string, string> = {};
    const demandMap: Record<string, number> = {};
    const lookbackCutoff = lookbackStartDate.getTime();
    const fortyFiveDaysCutoff = fortyFiveDaysAgo.getTime();

    salesData?.forEach(s => {
      const saleDate = new Date(s.fecha_hora).getTime();
      if (saleDate >= fortyFiveDaysCutoff) movement45d.add(s.codigo_producto);
      if (!lastSaleMap[s.codigo_producto] || saleDate > new Date(lastSaleMap[s.codigo_producto]).getTime()) {
        lastSaleMap[s.codigo_producto] = s.fecha_hora;
      }
      if (saleDate >= lookbackCutoff) {
        demandMap[s.codigo_producto] = (demandMap[s.codigo_producto] || 0) + Number(s.cantidad);
      }
    });

    // Aggregate stock by product and branch
    const productMap: Record<string, any> = {};
    stockData?.forEach(item => {
      const code = item.codigo_producto;
      if (!productMap[code]) {
        productMap[code] = {
          codigo_producto: code,
          descripcion: item.descripcion,
          modelo: item.modelo,
          ref: item.ref,
          stock: 0,
          price: Number(item.precio_usd) || 0,
          breakdown: {} as Record<string, number>
        };
      }
      const bName = this._mapBranch(item.branch);
      productMap[code].stock += Number(item.stock);
      productMap[code].breakdown[bName] = (productMap[code].breakdown[bName] || 0) + Number(item.stock);
      // Keep highest price
      const itemPrice = Number(item.precio_usd) || 0;
      if (itemPrice > productMap[code].price) productMap[code].price = itemPrice;
    });

    // 4. Compute Results
    return Object.values(productMap).map(item => {
      const hasMovement = movement45d.has(item.codigo_producto);
      const lastSaleDate = lastSaleMap[item.codigo_producto] || null;
      const totalSalesInWindow = demandMap[item.codigo_producto] || 0;
      const dailyAvg = totalSalesInWindow / lookbackDays;

      const reorderPoint = dailyAvg * (leadTimeDays + reviewDays) * (1 + safetyFactor);
      const stock = item.stock;

      let suggested = 0;
      if (stock <= reorderPoint) {
        const targetStock = reorderPoint * 2;
        suggested = Math.max(0, Math.ceil(targetStock - stock));
      }

      return {
        ...item,
        avg_demand: dailyAvg,
        reorder: reorderPoint,
        suggested: suggested,
        min: dailyAvg * leadTimeDays,
        max: reorderPoint * 2,
        has_movement: hasMovement,
        last_sale: lastSaleDate,
        stock_breakdown: Object.entries(item.breakdown)
          .map(([b, s]) => `${b}: ${s}`)
          .join(' | ')
      };
    });

  },

  // Dashboard Metrics
  async getDashboardMetrics(branch: string, period: { month?: number, year?: number } = {}): Promise<any> {
    const isConsolidated = branch === 'ALL';
    const dbBranch = !isConsolidated ? this._mapBranch(branch) : null;
    
    let startDate: string;
    let endDate: string | undefined;

    if (period.month && period.year) {
        const start = new Date(period.year, period.month - 1, 1);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
        
        const end = new Date(period.year, period.month, 0);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
    } else {
        startDate = new Date().toISOString().split('T')[0];
    }

    // 1. Critical Stock Count (always current)
    const stockQuery = supabase
      .from('v_latest_stock_by_branch')
      .select('codigo_producto, stock, branch');
    if (!isConsolidated) stockQuery.eq('branch', branch);
    const { data: stockData } = await stockQuery;

    const criticalCount = stockData?.filter(s => Number(s.stock) < 7).length || 0;

    // 2. Top Products
    const topRotationStart = period.month ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const topRotQuery = supabase
      .from('v_sales_lines')
      .select('codigo_producto, cantidad, total_usd')
      .gte('fecha_hora', topRotationStart)
      .lte('fecha_hora', endDate || new Date().toISOString());
    if (!isConsolidated) topRotQuery.eq('sucursal', dbBranch);
    const { data: salesData } = await topRotQuery;

    const rotationMap: Record<string, { qty: number, usd: number }> = {};
    salesData?.forEach(s => {
      if (!rotationMap[s.codigo_producto]) rotationMap[s.codigo_producto] = { qty: 0, usd: 0 };
      rotationMap[s.codigo_producto].qty += Number(s.cantidad);
      rotationMap[s.codigo_producto].usd += Number(s.total_usd);
    });

    const topProducts = Object.entries(rotationMap)
      .map(([code, data]) => ({ codigo_producto: code, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 3. Sales NE Aggregation
    const salesQuery = supabase
      .from('v_sales_lines')
      .select('total_usd, sucursal, fecha_hora, num_nota')
      .gte('fecha_hora', startDate);
    if (endDate) salesQuery.lte('fecha_hora', endDate);
    if (!isConsolidated) salesQuery.eq('sucursal', dbBranch);
    const { data: todaySales } = await salesQuery;

    const totalToday = todaySales?.reduce((acc, s) => acc + Number(s.total_usd), 0) || 0;

    // 4. Purchases (Saint)
    const purchaseQuery = supabase
      .from('purchase_lines')
      .select('costo_usd')
      .gte('fecha_hora', startDate);
    if (endDate) purchaseQuery.lte('fecha_hora', endDate);
    if (!isConsolidated) purchaseQuery.eq('sucursal', dbBranch);
    const { data: recentPurchases } = await purchaseQuery;
    const totalPurchasesToday = recentPurchases?.reduce((acc, p) => acc + Number(p.costo_usd), 0) || 0;

    // 5. Purchase Orders
    const poQuery = supabase
      .from('purchase_orders')
      .select('total_amount_usd')
      .eq('status', 'PENDING');
    if (!isConsolidated) poQuery.eq('branch', branch);
    const { data: pendingPOs } = await poQuery;
    const totalPendingPOs = pendingPOs?.reduce((acc, o) => acc + Number(o.total_amount_usd || 0), 0) || 0;

    // 6. Cashier closing (Incomes)
    const incomeQuery = supabase
      .from('incomes')
      .select('*, sellers(name)')
      .gte('created_at', startDate);
    if (endDate) incomeQuery.lte('created_at', endDate);
    if (!isConsolidated) incomeQuery.eq('branch', branch);
    const { data: incomes } = await incomeQuery;
    const totalIncomeToday = incomes?.reduce((acc, i) => acc + Number(i.total_amount), 0) || 0;

    // 7. Sales by Seller aggregation (Detailed by Branch)
    const salesBySellerMap: Record<string, { [key: string]: number, total: number }> = {};
    const salesByBranchMap: Record<string, { income: number, salesNE: number }> = {
      'Boleita': { income: 0, salesNE: 0 },
      'Sabana Grande': { income: 0, salesNE: 0 }
    };
    
    incomes?.forEach(i => {
      const sellerName = i.sellers?.name || 'Varios / Otros';
      if (!salesBySellerMap[sellerName]) {
        salesBySellerMap[sellerName] = { 'Boleita': 0, 'Sabana Grande': 0, 'total': 0 };
      }
      if (salesByBranchMap[i.branch]) {
        salesBySellerMap[sellerName][i.branch] += Number(i.total_amount);
      }
      salesBySellerMap[sellerName].total += Number(i.total_amount);
      
      if (salesByBranchMap[i.branch]) salesByBranchMap[i.branch].income += Number(i.total_amount);
    });

    todaySales?.forEach(s => {
      const branchName = s.sucursal === '01' ? 'Boleita' : 'Sabana Grande';
      if (salesByBranchMap[branchName]) salesByBranchMap[branchName].salesNE += Number(s.total_usd);
    });

    const salesBySeller = Object.entries(salesBySellerMap)
      .map(([name, branches]) => ({ name, ...branches }))
      .sort((a, b) => b.total - a.total);

    const salesByBranch = Object.entries(salesByBranchMap)
      .map(([name, totals]) => ({ name, ...totals }));

    return {
      criticalCount,
      topProducts,
      totalToday,
      totalCountToday: todaySales?.length || 0,
      totalPurchasesToday,
      totalPendingPOs,
      totalIncomeToday,
      salesBySeller,
      salesByBranch,
      rawIncomes: incomes || [],
      rawSalesNE: todaySales || []
    };
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

    return (data || []).map(log => ({
      id: log.id.toString(),
      eventType: log.event_type,
      payload: log.payload,
      status: log.status as 'PENDING' | 'SENT' | 'ERROR',
      lastError: log.last_error,
      createdAt: log.created_at
    }));
  },

  // Get Latest Exchange Rate from Dolar API with DB fallback
  async getLatestExchangeRate(): Promise<number> {
    try {
      // Try Dolar API first (Official rate for Venezuela)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.promedio) {
          return Number(data.promedio);
        }
      }
    } catch (e) {
      console.warn('Dolar API fetch failed, falling back to DB rate:', e);
    }

    // Fallback to database rate
    try {
      const { data, error } = await supabase
        .from('stock_snapshot_lines')
        .select('tasa_ref')
        .gt('tasa_ref', 0)
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? Number(data[0].tasa_ref) : 1;
    } catch (e) {
      console.error('Error fetching exchange rate from DB:', e);
      return 1; // absolute fallback
    }
  },

  // Sellers
  async getSellers(): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) {
      console.error('Error in getSellers:', error);
      throw error;
    }
    return data || [];
  },

  // Couriers
  async getCouriers(): Promise<Courier[]> {
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) {
      console.error('Error in getCouriers:', error);
      throw error;
    }
    return data || [];
  },

  async createCourier(name: string, phone?: string): Promise<Courier> {
    const { data, error } = await supabase
      .from('couriers')
      .insert([{ name, phone }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Cashea
  async getPendingCasheaInstallments(): Promise<(CasheaInstallment & { incomes: { customer_name: string, customer_id: string, branch: string } })[]> {
    const { data, error } = await supabase
      .from('cashea_installments')
      .select('*, incomes(customer_name, customer_id, branch)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as any;
  },

  async markCasheaInstallmentAsPaid(id: number): Promise<void> {
    const { error } = await supabase
      .from('cashea_installments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // Customers
  async getCustomerById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsertCustomer(customer: { id: string, name: string, phone?: string }) {
    const { error } = await supabase
      .from('customers')
      .upsert(customer);
    if (error) throw error;
  },

  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*, incomes(total_amount), cashea_installments(amount_usd, status)')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Bank Transfers (NUEVO COMIENZO v4 - Bypassing persistent cache)
  async getBankTransfers(): Promise<(BankTransfer & { from: any, to: any })[]> {
    const { data, error } = await supabase
      .from('v_transferencias_final_v4')
      .select('*');
    if (error) throw error;
    return data as any;
  },

  async createBankTransfer(transfer: Omit<BankTransfer, 'id' | 'created_at'>): Promise<BankTransfer> {
    const { data, error } = await supabase
      .from('transferencias_internas_v4')
      .insert([{
        from_account_id: transfer.from_account_id,
        to_account_id: transfer.to_account_id,
        amount: transfer.amount,
        reference: transfer.reference,
        notes: transfer.notes
      }])
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  // Support Tickets
  async getSupportTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('v_support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createSupportTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([{
        title: ticket.title,
        description: ticket.description,
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        category: ticket.category || 'support',
        user_id: user.id,
        branch: ticket.branch
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: updates.status,
        priority: updates.priority,
        assigned_to: updates.assigned_to,
        description: updates.description
      })
      .eq('id', id);
    if (error) throw error;
  },

  async getWeeklyCommissionMetrics(month: number, year: number, branch: string = 'ALL'): Promise<any[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    
    const query = supabase
      .from('incomes')
      .select('*, sellers(name)')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());
    
    if (branch !== 'ALL') query.eq('branch', branch);
    
    const { data: incomes } = await query;
    const sellersMap: Record<string, any> = {};

    incomes?.forEach(i => {
      const name = i.sellers?.name || 'Varios / Otros';
      if (!sellersMap[name]) {
        sellersMap[name] = { name, w1: 0, w2: 0, w3: 0, w4: 0, total: 0 };
      }
      
      const date = new Date(i.created_at).getDate();
      const amount = Number(i.total_amount);
      
      if (date <= 7) sellersMap[name].w1 += amount;
      else if (date <= 14) sellersMap[name].w2 += amount;
      else if (date <= 21) sellersMap[name].w3 += amount;
      else sellersMap[name].w4 += amount;
      
      sellersMap[name].total += amount;
    });

    return Object.values(sellersMap).sort((a, b) => b.total - a.total);
  },

  async getSellers() {
    const { data } = await supabase.from('sellers').select('*').eq('active', true).order('name');
    return data || [];
  }
};
