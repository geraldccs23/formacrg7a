import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { CasheaInstallment, BranchType } from '../types';
import { Search, Wallet, CheckCircle2, History, Loader2, DollarSign, Calendar } from 'lucide-react';

interface GroupedDebt {
    customer_id: string;
    customer_name: string;
    branch: string;
    installments: CasheaInstallment[];
    total_usd: number;
}

export const CasheaManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [debts, setDebts] = useState<GroupedDebt[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
        loadExchangeRate();
    }, []);

    const loadExchangeRate = async () => {
        try {
            const rate = await dbService.getLatestExchangeRate();
            setExchangeRate(rate);
        } catch (error) {
            console.error('Error fetching rate:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await dbService.getPendingCasheaInstallments();
            
            // Group by Customer ID
            const groups: Record<string, GroupedDebt> = {};
            data.forEach(item => {
                const customerId = item.incomes.customer_id || 'unnamed';
                if (!groups[customerId]) {
                    groups[customerId] = {
                        customer_id: customerId,
                        customer_name: item.incomes.customer_name || 'Sin Nombre',
                        branch: item.incomes.branch,
                        installments: [],
                        total_usd: 0
                    };
                }
                groups[customerId].installments.push(item);
                groups[customerId].total_usd += item.amount_usd;
            });

            setDebts(Object.values(groups).sort((a, b) => b.total_usd - a.total_usd));
        } catch (error) {
            console.error('Error fetching Cashea data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (id: number) => {
        if (!window.confirm('¿Confirmas que recibiste el pago de esta cuota?')) return;
        
        try {
            setProcessingId(id);
            await dbService.markCasheaInstallmentAsPaid(id);
            await fetchData(); // Refresh
        } catch (error) {
            alert('Error al procesar el pago');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredDebts = debts.filter(d => 
        d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customer_id.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
                <Loader2 className="animate-spin text-[#D40000]" size={48} />
                <p className="font-bold uppercase tracking-widest text-xs">Cargando Cuentas por Cobrar...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total por Cobrar (BS)</p>
                            <p className="text-2xl font-black text-emerald-600">
                                Bs. {(debts.reduce((acc, d) => acc + d.total_usd, 0) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-[#D40000] rounded-xl flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total por Cobrar (USD)</p>
                            <p className="text-2xl font-black text-gray-800">
                                ${debts.reduce((acc, d) => acc + d.total_usd, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasa de Referencia</p>
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold text-gray-600">
                            {exchangeRate.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente o CI/RIF..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 text-sm font-medium transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Debts Table */}
            <div className="space-y-4">
                {filteredDebts.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-gray-200">
                        <CheckCircle2 className="mx-auto text-emerald-500/20 mb-4" size={48} />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No hay cuotas pendientes</p>
                    </div>
                ) : (
                    filteredDebts.map(debt => (
                        <div key={debt.customer_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-red-100 transition-all">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-800 text-white rounded-lg flex items-center justify-center font-bold">
                                        {debt.customer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-800 uppercase text-sm leading-tight">{debt.customer_name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{debt.customer_id} • {debt.branch}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Deuda Total</p>
                                    <p className="text-lg font-black text-[#D40000]">${debt.total_usd.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {debt.installments.map(inst => (
                                    <div key={inst.id} className="p-3 border rounded-xl hover:bg-red-50/30 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuota #{inst.installment_number}</span>
                                            {inst.due_date && new Date(inst.due_date) < new Date() ? (
                                                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 animate-pulse">
                                                    <Loader2 size={8} /> Vencida
                                                </span>
                                            ) : (
                                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Pendiente</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between group-hover:scale-105 transition-transform">
                                            <div>
                                                <p className="text-xl font-black text-gray-800">${inst.amount_usd.toFixed(2)}</p>
                                                <p className="text-[10px] font-bold text-emerald-600">Bs. {(inst.amount_usd * exchangeRate).toFixed(2)}</p>
                                            </div>
                                            <button
                                                disabled={processingId === inst.id}
                                                onClick={() => handleMarkAsPaid(inst.id)}
                                                className="p-2 bg-[#D40000] text-white rounded-lg hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                {processingId === inst.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            </button>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-dashed flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Calendar size={12} />
                                                <span className="text-[9px] font-bold uppercase tracking-tight">Creada: {new Date(inst.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {inst.due_date && (
                                                <div className={`flex items-center gap-1.5 ${new Date(inst.due_date) < new Date() ? 'text-red-600 font-black' : 'text-orange-500 font-bold'}`}>
                                                    <History size={12} />
                                                    <span className="text-[9px] uppercase tracking-tight">Vence: {new Date(inst.due_date).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
