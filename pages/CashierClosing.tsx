import React, { useState, useEffect } from 'react';
import { 
    HistoryIcon, Wallet, Search, Filter, Loader2, ArrowDownCircle, ArrowUpCircle, 
    CheckCircle, XCircle, Clock, PiggyBank, Receipt, User, DollarSign, RefreshCw, Building2
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface CashierSummary {
    branch: string;
    cashier: string;
    created_by_email?: string;
    total_usd: number;
    total_bs: number;
    payment_counts: Record<string, number>;
    payment_amounts: Record<string, number>;
    payment_amounts_bs: Record<string, number>;
}

export function CashierClosing() {
    const [summaries, setSummaries] = useState<CashierSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [userContext, setUserContext] = useState<{ role: string | null, email: string | null }>({ role: null, email: null });

    useEffect(() => {
        fetchUserContext();
    }, []);

    useEffect(() => {
        if (userContext.role) fetchCashierSummary();
    }, [selectedDate, userContext]);

    const fetchUserContext = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            setUserContext({ role: data?.role || 'cajero', email: session.user.email || null });
        }
    };

    const fetchCashierSummary = async () => {
        try {
            setLoading(true);
            // Get all incomes for the selected date
            const startOfDay = `${selectedDate}T00:00:00.000Z`;
            const endOfDay = `${selectedDate}T23:59:59.999Z`;

            let query = supabase
                .from('incomes')
                .select('*, payments:income_payments(*)')
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay);

            // Apply filter based on role
            if (userContext.role === 'cajero' && userContext.email) {
                query = query.eq('created_by_email', userContext.email);
            }

            const { data: incomes, error: iError } = await query;

            if (iError) throw iError;

            // Group by branch, cashier AND created_by_email
            const grouped: Record<string, CashierSummary> = {};

            incomes?.forEach(income => {
                const branch = income.branch || 'S/B';
                const cashier = income.cash_register || 'SIN ASIGNAR';
                const creator = income.created_by_email || 'ADMIN/SYSTEM';
                const groupKey = `${branch}-${cashier}-${creator}`;

                if (!grouped[groupKey]) {
                    grouped[groupKey] = {
                        branch,
                        cashier,
                        created_by_email: creator,
                        total_usd: 0,
                        total_bs: 0,
                        payment_counts: {},
                        payment_amounts: {},
                        payment_amounts_bs: {}
                    };
                }

                income.payments?.forEach((p: any) => {
                    const usdAmount = Number(p.amount) || 0;
                    const bsAmount = Number(p.amount_bs) || 0;
                    const type = p.payment_type || '';
                    const normalizedType = type.toLowerCase();
                    
                    const isBankPay = normalizedType.includes('pago móvil') || 
                                      normalizedType.includes('punto') || 
                                      normalizedType.includes('trf') || 
                                      normalizedType.includes('transferencia');
                    
                    const isEfectivoBs = normalizedType === 'efectivo bs';

                    grouped[groupKey].total_usd += usdAmount;
                    
                    // Only sum in Bs if it's bank-related or specifically Efectivo Bs
                    if (isBankPay || isEfectivoBs) {
                        grouped[groupKey].total_bs += bsAmount;
                    }
                    
                    grouped[groupKey].payment_counts[type] = (grouped[groupKey].payment_counts[type] || 0) + 1;
                    grouped[groupKey].payment_amounts[type] = (grouped[groupKey].payment_amounts[type] || 0) + usdAmount;
                    grouped[groupKey].payment_amounts_bs[type] = (grouped[groupKey].payment_amounts_bs[p.payment_type] || 0) + bsAmount;
                });
            });

            setSummaries(Object.values(grouped));
        } catch (error) {
            console.error('Error fetching summary:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header omitted for brevity in replace_file_content if possible but I'll keep it simple */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                        <PiggyBank className="text-[#D40000]" size={28} />
                        Cuadre de Caja
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Resumen de ingresos por cajero y formas de pago.</p>
                </div>
                <div className="flex items-center gap-4">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-2xl font-black text-gray-700 outline-none transition-all shadow-sm"
                    />
                    <button 
                        onClick={fetchCashierSummary}
                        className="p-3 bg-gray-100 text-gray-400 hover:text-[#D40000] hover:bg-gray-200 rounded-2xl transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D40000]" size={40} /></div>
            ) : summaries.length === 0 ? (
                <div className="bg-white p-20 rounded-3xl border border-gray-100 text-center space-y-4">
                    <HistoryIcon className="mx-auto text-gray-200" size={60} />
                    <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No hay movimientos para esta fecha</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {summaries.map(summary => (
                        <div key={`${summary.branch}-${summary.cashier}-${summary.created_by_email}`} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            {/* Header Summary */}
                                <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#D40000]">
                                            <Building2 size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sucursal:</span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#D40000] text-white rounded shadow-sm">{summary.branch}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Caja:</span>
                                                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter">{summary.cashier}</h3>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1.5 p-1 px-2.5 bg-gray-100 rounded-lg w-fit border border-gray-200">
                                                <span className="text-[9px] font-black text-gray-500 uppercase">Audit:</span>
                                                <p className="text-[10px] text-gray-600 font-bold tracking-tight">{summary.created_by_email}</p>
                                            </div>
                                        </div>
                                    </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL RECAUDADO</div>
                                    <div className="text-2xl font-black text-[#D40000]">${summary.total_usd.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Body Summary */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1 underline">Monto en BS</span>
                                        <span className="text-xl font-black text-blue-800 leading-none">
                                            {summary.total_bs.toLocaleString()} <span className="text-xs uppercase">Bs</span>
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1 underline">Cant. Operaciones</span>
                                        <span className="text-xl font-black text-emerald-800 leading-none">
                                            {Object.values(summary.payment_counts).reduce((a: number, b: number) => a + b, 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Receipt size={12} /> Desglose por Forma de Pago
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(summary.payment_amounts).map(([type, amount]) => {
                                            const normalizedType = type.toLowerCase();
                                            const isBank = normalizedType.includes('pago móvil') || 
                                                           normalizedType.includes('punto') || 
                                                           normalizedType.includes('trf') || 
                                                           normalizedType.includes('transferencia');
                                            
                                            return (
                                                <div key={type} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-black">
                                                            {summary.payment_counts[type]}x
                                                        </div>
                                                        <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">{type}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-black text-gray-800">
                                                            {isBank 
                                                                ? `${summary.payment_amounts_bs[type].toLocaleString()} Bs`
                                                                : `$${Number(amount || 0).toLocaleString()}`
                                                            }
                                                        </div>
                                                        {isBank && (
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">Eq. ${Number(amount || 0).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 border-t mt-auto">
                                <button className="w-full py-3 bg-white border-2 border-gray-200 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-200 transition-all uppercase tracking-[0.2em]">Imprimir Cuadre</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
