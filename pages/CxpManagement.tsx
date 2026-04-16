import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Search, Wallet, CheckCircle2, Loader2, DollarSign, ArrowRightCircle, Calendar, Receipt, User } from 'lucide-react';
import { AccountPayable, PayablePayment } from '../types';

export const CxpManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payables, setPayables] = useState<(AccountPayable & { payable_payments: PayablePayment[], bank_accounts: any })[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1);
    
    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState<(AccountPayable & { payable_payments: PayablePayment[] }) | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentType, setPaymentType] = useState('Efectivo $');
    const [bankAccountId, setBankAccountId] = useState<number | ''>('');
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    const paymentTypes = ['Efectivo $', 'Efectivo Bs', 'Punto de Venta', 'Pago Móvil', 'Transferencia', 'Zelle'];
    const requiresBank = ['Punto de Venta', 'Pago Móvil', 'Transferencia'];

    useEffect(() => {
        fetchData();
        loadExchangeRate();
        loadBankAccounts();
    }, []);

    const loadBankAccounts = async () => {
        const { supabase } = await import('../services/supabase');
        const { data } = await supabase.from('bank_accounts').select('*, banks(name)');
        if (data) setBankAccounts(data);
    };

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
            const data = await dbService.getAccountsPayable();
            setPayables(data);
        } catch (error) {
            console.error('Error fetching CxP data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPaymentModal = (payable: AccountPayable & { payable_payments: PayablePayment[] }) => {
        const paid = payable.payable_payments.reduce((acc, p) => acc + Number(p.amount), 0);
        const pending = payable.amount - paid;
        
        setSelectedPayable(payable);
        setPaymentAmount(pending);
        setPaymentType('Efectivo $');
        setBankAccountId('');
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = async () => {
        if (!selectedPayable || !paymentAmount || Number(paymentAmount) <= 0) return;
        if (requiresBank.includes(paymentType) && !bankAccountId) {
            alert('Debe seleccionar una cuenta bancaria para este tipo de pago.');
            return;
        }

        try {
            setProcessingPayment(true);
            const amountBs = Number(paymentAmount) * exchangeRate;
            
            await dbService.registerPayablePayment({
                payable_id: selectedPayable.id,
                amount: Number(paymentAmount),
                amount_bs: amountBs,
                exchange_rate: exchangeRate,
                payment_type: paymentType,
                bank_account_id: bankAccountId ? Number(bankAccountId) : undefined
            });

            setIsPaymentModalOpen(false);
            await fetchData();
            alert('Abono a cuenta por pagar registrado exitosamente.');
        } catch (error) {
            alert('Error al registrar abono.');
            console.error(error);
        } finally {
            setProcessingPayment(false);
        }
    };

    const filteredPayables = payables.filter(p => 
        p.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.concept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateTotals = () => {
        let total = 0;
        let totalPaid = 0;
        payables.forEach(p => {
            total += p.amount;
            totalPaid += p.payable_payments.reduce((acc, pay) => acc + Number(pay.amount), 0);
        });
        return { total, totalPaid, totalPending: total - totalPaid };
    };

    const totals = calculateTotals();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-4">
                <Loader2 className="animate-spin text-blue-600" size={48} />
                <p className="font-bold uppercase tracking-widest text-xs">Cargando Cuentas por Pagar...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente CxP (USD)</p>
                            <p className="text-2xl font-black text-gray-800">
                                ${totals.totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pagado (USD)</p>
                            <p className="text-2xl font-black text-emerald-600">
                                ${totals.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasa de Referencia</p>
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-lg font-black text-gray-600">
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
                    placeholder="Buscar por proveedor o concepto..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Payables List */}
            <div className="space-y-4">
                {filteredPayables.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-gray-200">
                        <CheckCircle2 className="mx-auto text-emerald-500/20 mb-4" size={48} />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No hay cuentas por pagar pendientes</p>
                    </div>
                ) : (
                    filteredPayables.map(payable => {
                        const paid = payable.payable_payments.reduce((acc, p) => acc + Number(p.amount), 0);
                        const pending = payable.amount - paid;
                        const isPaid = pending <= 0.01;

                        return (
                            <div key={payable.id} className={`bg-white rounded-2xl shadow-sm border ${isPaid ? 'border-emerald-100' : 'border-gray-100'} overflow-hidden hover:border-blue-100 transition-all`}>
                                <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 ${isPaid ? 'bg-emerald-500' : 'bg-blue-600'} text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-800 uppercase text-base leading-tight">{payable.provider_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black bg-gray-900 text-white px-1.5 rounded uppercase tracking-tighter">{payable.branch}</span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: #{payable.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</p>
                                        <p className={`text-2xl font-black ${isPaid ? 'text-emerald-500' : 'text-blue-600'}`}>
                                            Bs. { (pending * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">
                                            Eqv: ${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                                        </p>
                                        {isPaid && (
                                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Completado</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                                <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                                                    <span className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Detalles de la Deuda</span>
                                                    <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                                                        <Calendar size={12} />
                                                        <span>{new Date(payable.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concepto</p>
                                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{payable.concept}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Original</p>
                                                        <p className="text-lg font-black text-gray-900">Bs. {payable.amount_bs?.toLocaleString('es-VE')}</p>
                                                        <p className="text-[9px] font-bold text-gray-400">${payable.amount.toLocaleString()} USD</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banco Destino</p>
                                                        <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mt-1 uppercase">
                                                            {payable.bank_accounts?.banks?.name} - {payable.bank_accounts?.reference}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isPaid && (
                                                <button 
                                                    onClick={() => handleOpenPaymentModal(payable)}
                                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                                                >
                                                    <DollarSign size={16} /> Registrar Abono
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Receipt size={14} /> Historial de Abonos
                                            </p>
                                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                                                {payable.payable_payments.length === 0 ? (
                                                    <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Sin abonos registrados</p>
                                                    </div>
                                                ) : (
                                                    payable.payable_payments.map(payment => (
                                                        <div key={payment.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                                                    <DollarSign size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-800">Bs. {payment.amount_bs?.toLocaleString('es-VE')}</p>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{payment.payment_type} • ${payment.amount.toLocaleString()} USD • {new Date(payment.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && selectedPayable && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 p-8 border-b border-gray-100 relative text-center">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
                                <ArrowRightCircle size={28} />
                            </button>
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                                <Wallet size={32} />
                            </div>
                            <h3 className="font-black text-gray-800 text-2xl uppercase tracking-tight">Registrar Abono</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Proveedor: {selectedPayable.provider_name}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto a Pagar (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">$</span>
                                    <input 
                                        type="number" step="0.01" 
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-gray-200"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center justify-between text-[11px] font-black text-orange-700">
                                    <span>EQUIVALENTE ESTIMADO:</span>
                                    <span>VES {(Number(paymentAmount) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Forma de Pago</label>
                                    <select 
                                        value={paymentType} 
                                        onChange={e => {
                                            setPaymentType(e.target.value);
                                            setBankAccountId('');
                                        }}
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    >
                                        {paymentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {requiresBank.includes(paymentType) && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuenta de Origen</label>
                                        <select 
                                            value={bankAccountId} 
                                            onChange={e => setBankAccountId(Number(e.target.value))}
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
                                        >
                                            <option value="">Seleccione Cuenta...</option>
                                            {bankAccounts.map((a: any) => (
                                                <option key={a.id} value={a.id}>{a.banks?.name} - {a.reference}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleSavePayment}
                                disabled={processingPayment || !paymentAmount || Number(paymentAmount) <= 0 || (requiresBank.includes(paymentType) && !bankAccountId)}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                            >
                                {processingPayment ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                                Confirmar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
