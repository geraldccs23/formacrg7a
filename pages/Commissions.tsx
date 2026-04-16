import { TrendingUp, Calendar, DollarSign, Wallet, ArrowUpRight, CheckCircle2, Building2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';

export function Commissions() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(1.0); // 1% default
  const [activeTab, setActiveTab] = useState<'weekly' | 'performance'>('weekly');

  const months = [
    { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
    { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
    { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
    { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
  ];

  useEffect(() => {
    loadMetrics();
  }, [selectedMonth, selectedYear, selectedBranch, customStart, customEnd]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const data = await dbService.getWeeklyCommissionMetrics(
        selectedMonth === '' ? undefined : selectedMonth, 
        selectedYear, 
        selectedBranch,
        customStart || undefined,
        customEnd || undefined
      );
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#D40000]">
            <Wallet size={20} />
            <h2 className="text-xl font-black uppercase tracking-tighter">Módulo de Comisiones</h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} />
            Periodo: {months.find(m => m.id === selectedMonth)?.name} {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Main Filters */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <select 
              value={selectedMonth} 
              onChange={e => { setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value)); setCustomStart(''); setCustomEnd(''); }}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none px-2 py-1 text-gray-600 focus:text-[#D40000] cursor-pointer"
            >
              <option value="">-- Periodo --</option>
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

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 ml-1">DESDE</span>
            <input 
              type="date" 
              value={customStart} 
              onChange={e => { setCustomStart(e.target.value); setSelectedMonth(''); }}
              className="bg-transparent text-[10px] font-bold outline-none text-gray-600 focus:text-[#D40000]"
            />
            <div className="w-px h-4 bg-gray-200"></div>
            <span className="text-[9px] font-black text-gray-400">HASTA</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => { setCustomEnd(e.target.value); setSelectedMonth(''); }}
              className="bg-transparent text-[10px] font-bold outline-none text-gray-600 focus:text-[#D40000]"
            />
          </div>

          <div className="flex bg-gray-50 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
            {[{ id: 'ALL', l: 'Consolidado' }, { id: '01', l: 'Boleita' }, { id: '03', l: 'Sabana G' }].map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedBranch === b.id ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {b.l}
              </button>
            ))}
          </div>

          {/* Rate Selector */}
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Comisión:</span>
            <input 
              type="number" 
              step="0.1" 
              value={commissionRate} 
              onChange={e => setCommissionRate(Number(e.target.value))}
              className="w-12 bg-transparent text-sm font-black text-gray-800 outline-none text-center"
            />
            <span className="text-sm font-black text-gray-800">%</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Ventas Mes</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tighter">
                   ${metrics.reduce((acc, m) => acc + m.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
            </div>
        </div>
        <div className="bg-[#1A1A1A] p-6 rounded-[2rem] shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                <DollarSign size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Comisiones</p>
                <h3 className="text-2xl font-black text-white tracking-tighter">
                   ${(metrics.reduce((acc, m) => acc + m.total, 0) * (commissionRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eficiencia Logística</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tighter">
                   98.4%
                </h3>
            </div>
        </div>
      </div>

      <div className="flex bg-white/50 p-1.5 rounded-2xl w-fit border border-gray-100 shadow-sm self-center">
            <button 
                onClick={() => setActiveTab('weekly')}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'weekly' ? 'bg-[#D40000] text-white shadow-xl shadow-red-500/20' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Ventas Semanales
            </button>
            <button 
                onClick={() => setActiveTab('performance')}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'performance' ? 'bg-[#D40000] text-white shadow-xl shadow-red-500/20' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Métricas de Rendimiento
            </button>
      </div>

      {/* Main Content Render */}
      {activeTab === 'weekly' ? (
        /* Weekly View */
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="animate-spin text-[#D40000]" size={40} />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Calculando Comisiones</p>
              </div>
            </div>
          )}

          <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-800 tracking-tighter uppercase flex items-center gap-2">
                  Resumen Semanal por Vendedor
                  <span className="bg-red-100 text-[#D40000] text-[9px] px-2 py-0.5 rounded-full">AUDITORÍA</span>
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valores expresados en USD ($)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Vendedor</th>
                  <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Semana 1</th>
                  <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Semana 2</th>
                  <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Semana 3</th>
                  <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Semana 4+</th>
                  <th className="py-6 px-6 text-[10px] font-black text-[#D40000] uppercase tracking-widest text-right bg-red-50/30">Total Ventas</th>
                  <th className="py-6 px-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right bg-emerald-50/30">Comisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-gray-200 group-hover:bg-[#D40000] transition-colors">{m.name.substring(0,2)}</div>
                          <span className="text-sm font-black text-gray-700 tracking-tight group-hover:text-gray-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-bold text-gray-500">${m.w1.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-bold text-gray-500">${m.w2.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-bold text-gray-500">${m.w3.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-bold text-gray-500">${m.w4.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-6 text-right bg-red-50/10">
                      <span className="text-base font-black text-gray-900 tracking-tighter">${m.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-8 text-right bg-emerald-50/10">
                      <span className="text-lg font-black text-emerald-700 tracking-tighter">
                        ${(m.total * (commissionRate / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Performance View */
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-800 tracking-tighter uppercase flex items-center gap-2">
                  Rendimiento y Auditoría por Vendedor
                  <span className="bg-red-100 text-[#D40000] text-[9px] px-2 py-0.5 rounded-full">ESTADÍSTICAS</span>
              </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Vendedor</th>
                  <th className="py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">N° Operaciones</th>
                  <th className="py-6 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-right">Ticket Promedio</th>
                  <th className="py-6 px-4 text-[10px] font-black text-purple-600 uppercase tracking-widest text-right">Cashea (Total)</th>
                  <th className="py-6 px-4 text-[10px] font-black text-green-600 uppercase tracking-widest text-right">Contado (Total)</th>
                  <th className="py-6 px-8 text-[10px] font-black text-gray-700 uppercase tracking-widest text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-5 px-8">
                       <span className="text-sm font-black text-gray-700 tracking-tight">{m.name}</span>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className="text-sm font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-full">{m.count}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-base font-black text-indigo-600 tracking-tighter">${m.avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-purple-600">${m.cashea_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{m.cashea_count} Operaciones</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-bold text-green-600">${m.cash_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className="text-xl font-black text-gray-900 tracking-tighter">${m.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
);
