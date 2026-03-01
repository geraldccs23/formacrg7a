import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { Supplier } from '../types';
import { Truck, Star, Clock, CheckCircle, RefreshCw, Filter, Calendar, Info } from 'lucide-react';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgent, setFilterUrgent] = useState(false);

  useEffect(() => {
    async function loadRanking() {
      try {
        const data = await dbService.getFordmacRanking();
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Ranking Fordmac</h2>
          <p className="text-xs text-gray-500 font-medium">Medición de efectividad y lead time real de proveedores.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setFilterUrgent(!filterUrgent)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
              filterUrgent ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            SOLO URGENTES
          </button>
          <button className="bg-[#D40000] text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg hover:bg-black hover:scale-105 transition-all">
            NUEVO PROVEEDOR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(function(s) {
          const stars = [];
          const starCount = Math.round(s.stars || 0);
          for (let i = 0; i < 5; i++) {
            const isFull = i < starCount;
            stars.push(
              <Star key={i} size={14} className={isFull ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
            );
          }
          
          return (
            <div key={s.supplier_code} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-red-50 transition-colors">
                  <Truck className="text-[#D40000]" size={24} />
                </div>
                <div className="flex items-center space-x-1">
                  {stars}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-black text-lg leading-tight text-gray-800 uppercase tracking-tight">{s.supplier_name}</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-1 font-bold">CÓDIGO: {s.supplier_code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50 mb-6">
                <div className="flex flex-col group/tip relative">
                  <span className="text-[9px] uppercase font-black text-gray-400 flex items-center gap-1">
                    <Clock size={10} className="text-[#D40000]" /> Lead Time
                    <Info size={10} className="text-gray-300 cursor-help" />
                  </span>
                  <span className="text-2xl font-black text-gray-800 tracking-tighter mt-1">
                    {s.avgLeadTime?.toFixed(1) || '--'} 
                    <span className="text-[10px] font-medium text-gray-400 uppercase ml-1">días</span>
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block bg-black text-white text-[8px] p-2 rounded shadow-xl z-10 w-32">
                    Promedio días entre Fecha OC y Recepción Efectiva.
                  </div>
                </div>
                <div className="flex flex-col group/tip relative">
                  <span className="text-[9px] uppercase font-black text-gray-400 flex items-center gap-1">
                    <CheckCircle size={10} className="text-emerald-500" /> Fill Rate
                    <Info size={10} className="text-gray-300 cursor-help" />
                  </span>
                  <span className="text-2xl font-black text-gray-800 tracking-tighter mt-1">
                    {s.fillRate ? (s.fillRate * 100).toFixed(0) : '0'}%
                  </span>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block bg-black text-white text-[8px] p-2 rounded shadow-xl z-10 w-32">
                    (Cantidad Recibida / Cantidad Pedida) acumulado.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest group/tip relative">
                  <span className="flex items-center gap-1">Puntualidad <Info size={10} className="text-gray-300" /></span>
                  <span className={(s.punctuality || 0) > 0.8 ? 'text-emerald-600' : 'text-[#D40000]'}>
                    {(s.punctuality || 0 * 100).toFixed(0)}%
                  </span>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/tip:block bg-black text-white text-[8px] p-2 rounded shadow-xl z-10 w-32">
                    % de entregas en o antes de la fecha prometida.
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      (s.punctuality || 0) > 0.8 ? 'bg-emerald-500' : 
                      ((s.punctuality || 0) > 0.5 ? 'bg-orange-500' : 'bg-[#D40000]')
                    }`} 
                    style={{ width: (s.punctuality || 0) * 100 + '%' }} 
                  />
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#D40000] hover:text-white transition-all border border-gray-100">
                Ver Historial OC
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
