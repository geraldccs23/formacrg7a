import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Product } from '../types';
import { Search, Filter, ArrowRightLeft, Package, RefreshCw } from 'lucide-react';

export function Inventory() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await dbService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filtered = products.filter(function(p) {
    return (p.descripcion || '').toLowerCase().indexOf(search.toLowerCase()) !== -1 || 
           p.codigo_producto.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por SKU, descripción o marca..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D40000]/10 focus:border-[#D40000] outline-none transition-all text-sm"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-colors">
            <Filter size={18} />
          </button>
          <button className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-black transition-all shadow-lg">
            <ArrowRightLeft size={18} className="text-[#D40000]" />
            TRASLADO INTERNO
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black border-b">
            <tr>
              <th className="px-6 py-5 text-left">Producto / SKU</th>
              <th className="px-6 py-5 text-center">Stock Actual</th>
              <th className="px-6 py-5 text-center">Estatus RG7</th>
              <th className="px-6 py-5 text-center">SAINT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(function(p) {
              const total = p.stock || 0;
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-800 uppercase text-xs">{p.descripcion}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-bold text-[#D40000] bg-red-50 px-2 py-0.5 rounded uppercase">{p.codigo_producto}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.brand_name || 'SIN MARCA'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-black text-gray-800">{total}</span>
                    <span className="text-[10px] text-gray-400 ml-1 font-bold uppercase">UND</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      total >= p.minStock ? 'bg-emerald-100 text-emerald-700' : 
                      total > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {total >= p.minStock ? 'Óptimo' : (total > 0 ? 'Crítico' : 'Agotado')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600" title="Sincronizado con SAINT">
                      <Package size={12} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
