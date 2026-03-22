import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { SyncLog } from '../types';
import { AlertTriangle, TrendingUp, AlertCircle, RefreshCw, Package, ShoppingCart, ArrowUpRight, Target } from 'lucide-react';

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

export function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('01');

  useEffect(() => {
    loadDashboard();
  }, [selectedBranch]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        dbService.getDashboardMetrics(selectedBranch),
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
        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Dashboard <span className="text-[#D40000]">RG7</span></h2>
        <div className="flex bg-gray-50 p-1 rounded-2xl gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[{ id: '01', l: 'Boleita' }, { id: '03', l: 'Sabana G' }].map(b => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Ventas Hoy (NE)" value={`$${metrics.totalToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} subValue={`${metrics.totalCountToday} Transacciones`} icon={TrendingUp} color="bg-blue-600" />
        <StatCard title="Stock Crítico" value={metrics.criticalCount.toString()} subValue="SKUs bajo mínimo" icon={AlertCircle} color="bg-[#D40000]" />
        <StatCard title="Cola SAINT" value={syncLogs.filter(l => l.status === 'PENDING').length.toString()} subValue="Eventos Pendientes" icon={RefreshCw} color="bg-orange-500" />
        <StatCard title="Fill Rate Est." value="98.2%" subValue="Eficiencia de Surtido" icon={Target} color="bg-emerald-600" />
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
              Últimos Eventos SAINT
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
    </div>
  );
}
