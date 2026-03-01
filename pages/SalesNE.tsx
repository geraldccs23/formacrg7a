import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { SalesLine } from '../types';
import { Plus, Search, FileText, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';

export function SalesNE() {
  const [deliveryNotes, setDeliveryNotes] = useState<SalesLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await dbService.getDeliveryNotes();
        setDeliveryNotes(data);
      } catch (error) {
        console.error('Error loading sales:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  const totalToday = deliveryNotes.reduce((acc, dn) => acc + (dn.total_usd || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Ventas Operativas (NE)</h2>
          <p className="text-xs text-gray-500 font-medium italic">Documentos de despacho sin impacto fiscal inmediato.</p>
        </div>
        <button className="bg-[#D40000] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-all">
          <Plus size={20} /> NUEVA NOTA DE ENTREGA
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar NE por número, cliente o RIF..." 
              className="flex-1 focus:outline-none text-sm font-medium"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                <tr>
                  <th className="px-6 py-5 text-left">N° Documento</th>
                  <th className="px-6 py-5 text-left">Cliente / Identificación</th>
                  <th className="px-6 py-5 text-center">Estado Sinc</th>
                  <th className="px-6 py-5 text-right">Total USD</th>
                  <th className="px-6 py-5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveryNotes.map(function(dn) {
                  return (
                    <tr key={dn.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-[#D40000]">{dn.numero_documento}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-700 uppercase text-xs">{dn.nombre_cliente}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{dn.fecha_hora}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                          {dn.tipo_documento}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-800 text-lg">$ {dn.total_usd.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 bg-gray-50 text-gray-400 hover:text-[#D40000] rounded-xl transition-all">
                          <FileText size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl shadow-2xl border border-gray-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D40000] opacity-10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-20 transition-opacity"></div>
            <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShoppingBag className="text-[#D40000]" /> Balance Hoy
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-gray-800 pb-4">
                <span className="text-[10px] text-gray-500 font-black uppercase">NE Totales</span>
                <span className="text-3xl font-black text-[#D40000]">{deliveryNotes.length}</span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-gray-500 font-black uppercase">Monto Bruto</span>
                <p className="text-3xl font-black text-white tracking-tighter mt-1">$ {totalToday.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-gray-400 italic mt-4 leading-relaxed">
                Este balance es puramente operativo. Los impuestos serán calculados al emitir la Factura Fiscal en el proceso de Facturación Masiva.
              </p>
              <button className="w-full mt-4 py-4 bg-[#D40000] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
                Cierre NE <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
