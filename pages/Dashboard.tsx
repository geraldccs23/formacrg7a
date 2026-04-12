import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { SyncLog } from '../types';
import { AlertTriangle, TrendingUp, AlertCircle, RefreshCw, Package, ShoppingCart, ArrowUpRight, Target, Wallet, Building2, X } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, subValue, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-black text-gray-800 tracking-tighter">{value}</span>
      <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-tight">{subValue}</span>
    </div>
  </div>
);

export function Dashboard({ userRole }: { userRole?: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>(''); 
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [sellerMonth, setSellerMonth] = useState<number | ''>('');
  const [sellerYear, setSellerYear] = useState<number>(new Date().getFullYear());
  const [sellerMetrics, setSellerMetrics] = useState<any[]>([]);
  const [sellerRawData, setSellerRawData] = useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(false);

  const [auditModal, setAuditModal] = useState<{ open: boolean, title: string, data: any[], type: 'income' | 'sales_ne' | 'mixed' }>({
    open: false, title: '', data: [], type: 'income'
  });

  const months = [
    { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
    { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
    { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
    { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
  ];

  useEffect(() => {
    loadDashboard();
    loadSellerMetrics();
  }, [selectedBranch, selectedMonth, selectedYear]);

  useEffect(() => {
    loadSellerMetrics();
  }, [sellerMonth, sellerYear, selectedBranch]);

  async function loadSellerMetrics() {
    setLoadingSellers(true);
    try {
        const period = sellerMonth ? { month: Number(sellerMonth), year: sellerYear } : {};
        const data = await dbService.getDashboardMetrics(selectedBranch, period);
        setSellerMetrics(data.salesBySeller || []);
        setSellerRawData(data.rawIncomes || []);
    } catch (e) { console.error(e); }
    finally { setLoadingSellers(false); }
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const period = selectedMonth ? { month: Number(selectedMonth), year: selectedYear } : {};
      const [m, s] = await Promise.all([
        dbService.getDashboardMetrics(selectedBranch, period),
        dbService.getSyncLogs()
      ]);
      setMetrics(m);
      setSyncLogs(s);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Analizando Red de Datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Branch Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Dashboard <span className="text-[#D40000]">RG7</span></h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${selectedMonth ? 'bg-orange-500' : 'bg-green-500'}`}></span>
            Vista: {selectedMonth ? `${months.find(m => m.id === selectedMonth)?.name} ${selectedYear}` : 'Hoy (Tiempo Real)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month/Year Filter */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none px-2 py-1 text-gray-600 focus:text-[#D40000] cursor-pointer"
            >
              <option value="">-- Hoy --</option>
              {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="w-px h-4 bg-gray-200"></div>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none px-2 py-1 text-gray-600 focus:text-[#D40000] cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex bg-gray-50 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
            {[{ id: 'ALL', l: 'Consolidado' }, { id: '01', l: 'Boleita' }, { id: '03', l: 'Sabana G' }].map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedBranch === b.id ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {b.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales by Branch Widget */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b flex items-center justify-between bg-blue-50/20">
            <h2 className="font-black text-gray-800 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
              <Building2 className="text-blue-600" size={18} />
              Distribución por Sucursal ({selectedMonth ? months.find(m => m.id === selectedMonth)?.name : 'Hoy'})
            </h2>
            <p className="text-[10px] text-blue-500 font-black flex items-center gap-2">Haga click en un monto para auditar <ArrowUpRight size={14}/></p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-x-0 md:divide-x divide-gray-100">
            {metrics.salesByBranch?.map((b: any) => (
              <div key={b.name} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-[10px]">{b.name.substring(0,2).toUpperCase()}</div>
                  <span className="font-black text-gray-800 uppercase tracking-tighter text-lg">{b.name}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div 
                    onClick={() => {
                        const localIncomes = metrics.rawIncomes.filter((i: any) => i.branch === b.name).map((i: any) => ({...i, unified_type: 'income'}));
                        const externalSales = metrics.rawSalesNE.filter((s: any) => (s.sucursal === '01' ? 'Boleita' : 'Sabana Grande') === b.name).map((s: any) => ({...s, unified_type: 'sales_ne'}));
                        setAuditModal({ 
                          open: true, 
                          title: `Detalle Ventas Totales: ${b.name}`, 
                          data: [...localIncomes, ...externalSales].sort((x, y) => new Date(y.unified_type === 'income' ? y.created_at : y.fecha_hora).getTime() - new Date(x.unified_type === 'income' ? x.created_at : x.fecha_hora).getTime()),
                          type: 'mixed'
                        });
                    }}
                    className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-all group"
                  >
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Ventas Totales</span>
                    <span className="text-2xl font-black text-emerald-900 tracking-tighter">${(b.income + b.salesNE).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
            title={selectedMonth ? "Ventas Totales Mes" : "Ventas Totales Hoy"} 
            value={`$${(metrics.totalToday + metrics.totalIncomeToday).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
            subValue={`${metrics.totalCountToday + metrics.rawIncomes.length} Transacciones`} 
            icon={TrendingUp} 
            color="bg-emerald-600" 
        />
        <StatCard title={selectedMonth ? "Compras Mes" : "Compras Hoy"} value={`$${metrics.totalPurchasesToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subValue="Entradas de Mercancía" icon={ShoppingCart} color="bg-orange-600" />
        <StatCard title="Total en Ordenes" value={`$${metrics.totalPendingPOs.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subValue="Pedidos Pendientes" icon={Target} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Rotation Widget */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b flex items-center justify-between bg-gray-50/30">
            <h2 className="font-black text-gray-800 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              Top Rotación (30d)
            </h2>
            <ArrowUpRight className="text-gray-300" size={18} />
          </div>
          <div className="p-0 overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="text-[9px] font-black text-gray-400 uppercase border-b border-gray-50">
                  <th className="px-4 md:px-6 py-3 text-left">Producto</th>
                  <th className="px-4 md:px-6 py-3 text-center">Unidades</th>
                  <th className="px-4 md:px-6 py-3 text-right">Monto USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.topProducts.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-[11px] font-bold text-gray-700 font-mono">{p.codigo_producto}</td>
                    <td className="px-4 md:px-6 py-4 text-center font-black text-gray-800 text-xs">{p.qty}</td>
                    <td className="px-4 md:px-6 py-4 text-right font-black text-[#D40000] text-xs">$ {p.usd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Monitor */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b flex items-center justify-between bg-gray-50/30">
            <h2 className="font-black text-gray-800 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="text-orange-500" size={18} />
              Últimos Eventos del Servidor
            </h2>
          </div>
          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            {syncLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${log.status === 'SENT' ? 'bg-emerald-500' : log.status === 'ERROR' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-[11px] font-black text-gray-700 uppercase tracking-tight">{log.eventType}</span>
                    <span className="text-[8px] md:text-[9px] text-gray-400 font-bold font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded ${log.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status === 'SENT' ? 'Sync' : 'Error'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {userRole === 'director' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-red-50/10">
            <h2 className="font-black text-gray-800 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="text-[#D40000]" size={18} />
              Ventas por Vendedor
            </h2>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Filtro Local:</span>
                <select 
                    value={sellerMonth} 
                    onChange={e => setSellerMonth(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-[#D40000]"
                >
                    <option value="">-- Hoy --</option>
                    {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="w-px h-3 bg-gray-200"></div>
                <select 
                    value={sellerYear} 
                    onChange={e => setSellerYear(Number(e.target.value))}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-gray-600"
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Vendedor</th>
                        <th className="py-4 px-4 text-[10px] font-black text-blue-500 uppercase tracking-widest text-right">Boleita</th>
                        <th className="py-4 px-4 text-[10px] font-black text-purple-500 uppercase tracking-widest text-right">Sabana G.</th>
                        <th className="py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Total</th>
                        <th className="py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 relative">
                    {loadingSellers && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <RefreshCw className="animate-spin text-[#D40000]" size={20} />
                        </div>
                    )}
                    {sellerMetrics.map((s: any, i: number) => (
                        <tr 
                            key={i} 
                            onClick={() => setAuditModal({ 
                                open: true, 
                                title: `Ventas: ${s.name}`, 
                                data: sellerRawData.filter((i: any) => (i.sellers?.name || 'Varios / Otros') === s.name),
                                type: 'income'
                            })}
                            className="group hover:bg-red-50/50 cursor-pointer transition-all border-l-4 border-transparent hover:border-l-[#D40000]"
                        >
                            <td className="py-5 px-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 group-hover:bg-[#D40000] group-hover:text-white transition-all">{s.name.substring(0,2)}</div>
                                    <span className="font-black text-gray-800 uppercase tracking-tight text-sm group-hover:text-[#D40000]">{s.name}</span>
                                </div>
                            </td>
                            <td className="py-5 px-4 text-right">
                                <span className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors">${Number(s.Boleita || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="py-5 px-4 text-right">
                                <span className="text-sm font-bold text-gray-500 group-hover:text-purple-600 transition-colors">${Number(s['Sabana Grande'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </td>
                            <td className="py-5 px-8 text-right">
                                <span className="text-lg font-black text-gray-700 tracking-tighter group-hover:text-gray-900">${s.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <ArrowUpRight className="inline ml-2 text-gray-300 group-hover:text-[#D40000] opacity-0 group-hover:opacity-100 transition-all" size={14} />
                            </td>
                            <td className="py-5 px-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {sellerMonth ? months.find(m => m.id === sellerMonth)?.name : 'Hoy'}
                            </td>
                        </tr>
                    ))}
                    {sellerMetrics.length === 0 && !loadingSellers && (
                        <tr>
                            <td colSpan={3} className="py-12 text-center text-gray-400 font-bold uppercase text-[10px] italic">No hay ventas para este periodo</td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {auditModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">{auditModal.title}</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Detalle de transacciones para auditoría</p>
              </div>
              <button 
                onClick={() => setAuditModal({ ...auditModal, open: false })}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalle</th>
                    <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditModal.data.map((item, idx) => {
                    const isIncome = auditModal.type === 'income' || item.unified_type === 'income';
                    const docType = isIncome ? item.document_type : 'Nota de Entrega';
                    const docNumber = isIncome ? item.document_number : item.num_nota;
                    const customer = isIncome ? (item.customer_name || 'Sin Cliente') : 'Venta Externa';
                    const date = new Date(isIncome ? item.created_at : item.fecha_hora);
                    const sellerSuffix = (isIncome && item.sellers) ? ` • ${item.sellers.name}` : '';
                    const rawTotal = isIncome ? item.total_amount : item.total_usd;
                    const amount = Number(rawTotal) || 0;

                    return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-black text-sm text-gray-800">
                          {docType}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">
                          #{docNumber}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="text-xs font-bold text-gray-600 uppercase">
                          {customer}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {date.toLocaleDateString()}
                          {sellerSuffix}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={`text-lg font-black ${amount < 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                          ${Math.abs(amount).toFixed(2)}
                          {amount < 0 && ' (DEV)'}
                        </span>
                      </td>
                    </tr>
                  )})}
                  {auditModal.data.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-gray-400 font-bold uppercase text-[10px]">No se encontraron registros en este periodo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Auditado ({auditModal.data.length} ítems)</span>
               <span className="text-3xl font-black text-gray-900 tracking-tighter">
                  ${auditModal.data.reduce((acc, curr) => acc + (Number((auditModal.type === 'income' || curr.unified_type === 'income') ? curr.total_amount : curr.total_usd)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
