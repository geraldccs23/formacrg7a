import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import { PurchaseLine } from '../types';
import { Plus, ShoppingCart, Calendar, Clock, BarChart3, RefreshCw, Search, X, FileText } from 'lucide-react';

export function Purchases() {
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sucursalFilter, setSucursalFilter] = useState('');
  const [proveedorFilter, setProveedorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filter Options
  const [options, setOptions] = useState<{ sucursales: string[], proveedores: string[] }>({ sucursales: [], proveedores: [] });

  // Modal State
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docDetails, setDocDetails] = useState<PurchaseLine[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPurchases(0, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, sucursalFilter, proveedorFilter, dateFilter]);

  async function loadInitialData() {
    try {
      const opts = await dbService.getFilterOptions();
      setOptions({ sucursales: opts.sucursales, proveedores: opts.proveedores });
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPurchases(pageNum: number, isInitial = false) {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const filters = {
        sucursal: sucursalFilter,
        proveedor: proveedorFilter,
        date: dateFilter,
        search: searchTerm
      };

      const { data, error } = await dbService.getPurchaseLines(pageNum, ITEMS_PER_PAGE, filters);
      if (error) throw error;

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isInitial) {
        setPurchaseLines(data);
      } else {
        setPurchaseLines(prev => [...prev, ...data]);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }

  async function handleViewDetails(numDoc: string) {
    setSelectedDoc(numDoc);
    setLoadingDetails(true);
    try {
      const details = await dbService.getPurchaseDetails(numDoc);
      setDocDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  }

  const totalFiltered = purchaseLines.reduce((acc, po) => acc + (po.costo_usd || 0), 0);

  if (loading && page === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw className="animate-spin text-[#D40000]" size={32} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Optimizando consulta...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Módulo de Compras</h2>
          <p className="text-xs text-gray-500 font-medium italic">Gestión de abastecimiento (Histórico en Servidor).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters Bar */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por N° Documento, Proveedor o Producto..."
                className="flex-1 bg-transparent focus:outline-none text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={sucursalFilter}
                onChange={(e) => setSucursalFilter(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#D40000]/30 transition-all uppercase"
              >
                <option value="">Todas las Sucursales</option>
                {options.sucursales.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={proveedorFilter}
                onChange={(e) => setProveedorFilter(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#D40000]/30 transition-all uppercase"
              >
                <option value="">Todos los Proveedores</option>
                {options.proveedores.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#D40000]/30 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A1A] text-[10px] font-black uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-5 text-left">Documento</th>
                  <th className="px-6 py-5 text-left">Proveedor / Sucursal</th>
                  <th className="px-6 py-5 text-left">Producto / Código</th>
                  <th className="px-6 py-5 text-center">Fecha</th>
                  <th className="px-6 py-5 text-right">Costo USD</th>
                  <th className="px-6 py-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchaseLines.length > 0 ? purchaseLines.map(function (po) {
                  const cleanDesc = (po.descripcion || '').replace(/[\r\n]+/g, ' ').trim();
                  return (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-gray-700">{po.numero_documento}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-black text-gray-600 uppercase truncate max-w-[200px]">{po.proveedor_nombre || 'N/A'}</span>
                          <span className="text-[10px] text-gray-400 font-bold tracking-tighter uppercase mt-0.5">{po.sucursal}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-gray-800 uppercase truncate max-w-[150px]">{cleanDesc || 'Sin descripción'}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{po.codigo_producto}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500 text-[10px] font-bold">
                          <Calendar size={12} /> {new Date(po.fecha_hora).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-gray-800 tracking-tighter text-base">$ {(po.costo_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] text-gray-400 font-mono">Tasa: {(po.tasa_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(po.numero_documento)}
                          className="p-2.5 bg-gray-100 text-gray-400 hover:text-white hover:bg-[#D40000] rounded-xl transition-all shadow-sm"
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-bold italic">No se encontraron registros de compra</td>
                  </tr>
                )}
              </tbody>
            </table>

            {hasMore && (
              <div className="p-6 border-t border-gray-50 flex justify-center">
                <button
                  onClick={() => loadPurchases(page + 1)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D40000] transition-all disabled:opacity-50"
                >
                  {loadingMore ? <RefreshCw className="animate-spin" size={14} /> : 'Cargar más registros'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-[#D40000]">
            <h3 className="font-black text-sm uppercase tracking-tight mb-6 flex items-center gap-2 text-gray-800">
              <Clock className="text-[#D40000]" size={18} /> Sugerencia FORD
            </h3>
            <div className="space-y-5">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-[10px] font-black text-red-700 uppercase">Reposición Inmediata</span>
                <p className="text-xs font-bold text-gray-800 mt-2">Filtros de Aceite FL820S</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-gray-500">Pedir Sugerido:</span>
                  <span className="font-black text-red-600">50 UNIDS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D40000] opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2 text-gray-400">
              <BarChart3 className="text-[#D40000]" size={16} /> Total Consultas
            </h3>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter">$ {totalFiltered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Monto acumulado filtrado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-gray-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                  <ShoppingCart className="text-[#D40000]" /> Detalle de Compra: {selectedDoc}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Items recibidos en este documento
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-3 bg-white text-gray-400 hover:text-gray-900 rounded-2xl border border-gray-100 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8">
              {loadingDetails ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="animate-spin text-[#D40000]" size={32} />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#1A1A1A] text-[9px] font-black uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-4 text-left">CÓDIGO</th>
                      <th className="px-4 py-4 text-left">DESCRIPCIÓN</th>
                      <th className="px-4 py-4 text-center">CANT</th>
                      <th className="px-4 py-4 text-right">COSTO USD</th>
                      <th className="px-4 py-4 text-right">TOTAL USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {docDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-4 font-bold text-gray-600 font-mono text-xs">{item.codigo_producto}</td>
                        <td className="px-4 py-4 text-xs font-bold text-gray-800 uppercase">{(item.descripcion || '').replace(/[\r\n]+/g, ' ').trim() || 'Sin descripción'}</td>
                        <td className="px-4 py-4 text-center font-black text-gray-800">{(item.cantidad || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-600">$ {(item.costo_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-4 text-right font-black text-gray-900">$ {((item.cantidad || 0) * (item.costo_usd || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold uppercase text-[10px]">Items recibidos: {docDetails.length}</span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Documento</span>
                <span className="text-3xl font-black text-[#D40000] tracking-tighter">
                  $ {docDetails.reduce((acc, i) => acc + ((i.cantidad || 0) * (i.costo_usd || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
