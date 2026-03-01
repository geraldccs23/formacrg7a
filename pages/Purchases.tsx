import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { PurchaseLine } from '../types';
import { Plus, ShoppingCart, Calendar, Clock, BarChart3, RefreshCw } from 'lucide-react';

export function Purchases() {
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      try {
        // We use delivery notes service for now as a proxy or create a getPurchaseLines
        const { data, error } = await dbService.getPurchaseLines();
        setPurchaseLines(data);
      } catch (error) {
        console.error('Error loading purchases:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, []);

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
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Módulo de Compras</h2>
          <p className="text-xs text-gray-500 font-medium">Gestión de abastecimiento basada en Lead Time.</p>
        </div>
        <button className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl hover:bg-[#D40000] transition-all">
          <Plus size={20} /> NUEVA ORDEN DE COMPRA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gray-50/50 border-b flex items-center justify-between">
            <h3 className="font-black text-gray-700 text-sm uppercase tracking-tight flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#D40000]" /> Histórico de Documentos
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
              <tr>
                <th className="px-6 py-4 text-left">Documento</th>
                <th className="px-6 py-4 text-left">Proveedor</th>
                <th className="px-6 py-4 text-center">Fecha</th>
                <th className="px-6 py-4 text-right">Costo USD</th>
                <th className="px-6 py-4 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {purchaseLines.map(function(po) {
                return (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">{po.numero_documento}</td>
                    <td className="px-6 py-4 font-black text-gray-600 uppercase text-xs">{po.proveedor_nombre}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold">
                        <Calendar size={14} /> {new Date(po.fecha_hora).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-800">$ {po.costo_usd.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        po.tipo_documento === 'COMPRA' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {po.tipo_documento}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-[#D40000]">
            <h3 className="font-black text-sm uppercase tracking-tight mb-6 flex items-center gap-2 text-gray-800">
              <Clock className="text-[#D40000]" size={18} /> Sugerencia FORD
            </h3>
            <div className="space-y-5">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-[10px] font-black text-red-700 uppercase">Reposición Inmediata</span>
                <p className="text-xs font-bold text-gray-800 mt-2">Pastillas de Freno F-150</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-gray-500">Pedir Sugerido:</span>
                  <span className="font-black text-red-600">20 JUEGOS</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-500 uppercase">Stock de Seguridad</span>
                <p className="text-xs font-bold text-gray-800 mt-2">Filtro Aceite Toyota</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-gray-500">Mínimo: 7 | Actual: 8</span>
                  <span className="font-black text-gray-600">REVISAR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-6 rounded-2xl shadow-xl text-white">
            <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 className="text-[#D40000]" size={16} /> Lead Time Real
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Promedio Sistema</span>
                <span className="font-black">14.2 días</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-[#D40000] h-full w-[65%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
