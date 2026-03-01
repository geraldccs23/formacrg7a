import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Product, SyncLog, Supplier } from '../types';
import { AlertTriangle, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, subValue, icon: Icon, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-black text-gray-800 tracking-tighter">{value}</span>
      <span className="text-xs text-gray-500 font-medium mt-1">{subValue}</span>
    </div>
  </div>
);

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, s, sup] = await Promise.all([
          dbService.getProducts(),
          dbService.getSyncLogs(),
          dbService.getFordmacRanking()
        ]);
        setProducts(p);
        setSyncLogs(s);
        setSuppliers(sup);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const lowStock = products.filter((p) => (p.stock || 0) < p.minStock);
  const avgPunctuality = suppliers.length > 0 
    ? (suppliers.reduce((acc, s) => acc + (s.punctuality || 0), 0) / suppliers.length * 100).toFixed(0)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas Operativas" value="12" subValue="$2,450.00 (NE Hoy)" icon={TrendingUp} color="bg-blue-600" />
        <StatCard title="Alertas Inventario" value={lowStock.length.toString()} subValue="Req. Reposición" icon={AlertCircle} color="bg-[#D40000]" />
        <StatCard title="Cola SAINT" value={syncLogs.filter(l => l.status === 'PENDING').length.toString()} subValue="Eventos Pendientes" icon={RefreshCw} color="bg-orange-500" />
        <StatCard title="Fordmac LT" value={`${avgPunctuality}%`} subValue="Puntualidad Prov." icon={TrendingUp} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50/50">
            <h2 className="font-black text-gray-800 text-sm uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="text-[#D40000]" size={18} />
              Stock Crítico (Total &lt; 7)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black border-b">
                <tr>
                  <th className="px-6 py-4 text-left">CÓDIGO</th>
                  <th className="px-6 py-4 text-left">Producto</th>
                  <th className="px-6 py-4 text-right">Existencia</th>
                  <th className="px-6 py-4 text-center">Sugerencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lowStock.map((p) => {
                  const total = p.stock || 0;
                  return (
                    <tr key={p.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{p.codigo_producto}</td>
                      <td className="px-6 py-4 font-medium text-gray-700 uppercase text-xs">{p.descripcion}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-lg font-black ${total === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-[#D40000] hover:bg-[#D40000] hover:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border border-[#D40000]">
                          OC FORD
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50/50">
            <h2 className="font-black text-gray-800 text-sm uppercase tracking-tight flex items-center gap-2">
              <RefreshCw className="text-blue-600" size={18} />
              Monitor Integración SAINT
            </h2>
            <button className="text-[10px] font-bold text-blue-600 hover:underline">VER LOGS</button>
          </div>
          <div className="p-4 space-y-3">
            {syncLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-blue-200 transition-all">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-700">{log.eventType}</span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  log.status === 'SENT' ? 'bg-green-100 text-green-700' : 
                  log.status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {log.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
