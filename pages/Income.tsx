import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, List, Save, X, Building2, CreditCard, Banknote, Landmark, ShieldCheck, Loader2, Search, ArrowRightCircle, Trash2, Edit2, Users } from 'lucide-react';
import { supabase } from '../services/supabase';
import { dbService } from '../services/dbService';
import { BankAccount, BranchType, PaymentCondition, Income as IncomeType, Seller, Courier } from '../types';

export function Income() {
    const [activeTab, setActiveTab] = useState<'new' | 'history' | 'customers'>('new');
    const [step, setStep] = useState(1);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Data from DB
    const [bankAccounts, setBankAccounts] = useState<(BankAccount & { banks: { name: string } })[]>([]);
    const [recentIncomes, setRecentIncomes] = useState<IncomeType[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    // Form State
    const [branch, setBranch] = useState<BranchType>('Boleita');
    const [docType, setDocType] = useState('Factura');
    const [docNumber, setDocNumber] = useState('');
    const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>('Contado');
    const [totalAmount, setTotalAmount] = useState<number | ''>('');
    const [totalAmountBs, setTotalAmountBs] = useState<number | ''>('');

    // Customer State
    const [customerId, setCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Payments State
    interface PaymentDetail {
        id: string;
        type: string;
        amount: number;
        exchange_rate: number;
        amount_bs?: number;
        bankAccountId?: number;
        bankAccountRef?: string;
    }
    const [payments, setPayments] = useState<PaymentDetail[]>([]);

    // Exchange Rate State
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [amountBs, setAmountBs] = useState<number | ''>('');

    // Seller & Delivery
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<number | ''>('');
    const [deliveryMethod, setDeliveryMethod] = useState<string>('Retira en Tienda');
    const [selectedCourier, setSelectedCourier] = useState<number | ''>('');
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
    const [selectedAgency, setSelectedAgency] = useState<string>('');

    const agencyOptions = ['ZOOM', 'MRW', 'TEALCA', 'DOMESA', 'LIBERTY EXPRESS', 'OTRO'];

    // Modal states
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [newCourierName, setNewCourierName] = useState('');
    const [newCourierPhone, setNewCourierPhone] = useState('');
    const [savingCourier, setSavingCourier] = useState(false);

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerList, setCustomerList] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    const [numInstallments, setNumInstallments] = useState<number>(3);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);

    const paymentTypes = ['Efectivo $', 'Efectivo Bs', 'Punto de Venta', 'Pago Móvil', 'Transferencia'];
    const requiresBank = ['Punto de Venta', 'Pago Móvil', 'Transferencia'];
    const cashRegistersByBranch: Record<BranchType, string[]> = {
        'Boleita': ['Fiscal', 'Tecnologia', 'Servientrega'],
        'Sabana Grande': ['Principal']
    };

    const [newPayType, setNewPayType] = useState('Efectivo $');
    const [newPayBank, setNewPayBank] = useState<number | ''>('');
    const [newPayAmount, setNewPayAmount] = useState<number | ''>('');

    useEffect(() => {
        const fetchAll = async () => {
            fetchUserRole();
            setLoadingAccounts(true);
            const [accounts, rate, sellersData, couriersData] = await Promise.all([
                supabase.from('bank_accounts').select('*, banks(name)'),
                dbService.getLatestExchangeRate(),
                dbService.getSellers(),
                dbService.getCouriers()
            ]);
            if (accounts.data) setBankAccounts(accounts.data as any);
            setExchangeRate(rate);
            setSellers(sellersData);
            setCouriers(couriersData);
            setLoadingAccounts(false);
            fetchRecentIncomes();
        };
        fetchAll();
    }, []);

    useEffect(() => {
        setSelectedCashRegister('');
    }, [branch]);

    async function fetchUserRole() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            if (data) setUserRole(data.role);
        }
    }

    const fetchRecentIncomes = async () => {
        const { data, error } = await supabase
            .from('incomes')
            .select('*, income_payments(amount, payment_type)')
            .order('created_at', { ascending: false })
            .limit(20);
        if (!error) setRecentIncomes(data as any[]);
    };

    useEffect(() => {
        if (!customerId || customerId.length < 7) return;
        const t = setTimeout(async () => {
            setIsSearchingCustomer(true);
            const c = await dbService.getCustomerById(customerId);
            if (c) {
                setCustomerName(c.name);
                setCustomerPhone(c.phone || '');
            }
            setIsSearchingCustomer(false);
        }, 600);
        return () => clearTimeout(t);
    }, [customerId]);

    const openCustomerSearch = async () => {
        setIsCustomerModalOpen(true);
        const data = await dbService.getCustomers();
        setCustomerList(data);
    };

    const handleSelectCustomer = (c: any) => {
        setCustomerId(c.id);
        setCustomerName(c.name);
        setCustomerPhone(c.phone || '');
        setIsCustomerModalOpen(false);
    };

    const handleSaveCourier = async () => {
        if (!newCourierName || savingCourier) return;
        setSavingCourier(true);
        try {
            const { data, error } = await supabase.from('couriers').insert([{
                name: newCourierName, phone: newCourierPhone
            }]).select().single();
            if (error) throw error;
            setCouriers([...couriers, data as any]);
            setSelectedCourier(data.id);
            setNewCourierName(''); setNewCourierPhone('');
            setIsCourierModalOpen(false);
        } catch (e: any) { alert('Error: ' + e.message); }
        finally { setSavingCourier(false); }
    };

    const handleSaveIncome = async () => {
        if (!isFormValid || saving) return;
        setSaving(true);
        try {
          if (customerId && customerName) {
            await dbService.upsertCustomer({ id: customerId, name: customerName, phone: customerPhone });
          }
          const { data: { session } } = await supabase.auth.getSession();
          const { data: income, error: iError } = await supabase.from('incomes').insert([{
            branch, document_type: docType, document_number: docNumber, payment_condition: paymentCondition,
            customer_id: customerId || null, customer_name: customerName || null, customer_phone: customerPhone || null,
            total_amount: Number(totalAmount), seller_id: selectedSeller || null, delivery_method: deliveryMethod,
            courier_id: deliveryMethod === 'Servientrega' ? selectedCourier : null, 
            shipping_agency: deliveryMethod === 'Envío Nacional' ? selectedAgency : null,
            cash_register: selectedCashRegister,
            created_by_email: session?.user?.email,
            created_by_id: session?.user?.id
          }]).select().single();
          if (iError) throw iError;
    
          let paymentsToInsert = payments.map(p => ({
            income_id: income.id, payment_type: paymentCondition === 'Inicial de Cashea' ? `INICIAL: ${p.type}` : p.type,
            amount: p.amount, exchange_rate: p.exchange_rate, amount_bs: p.amount_bs || (p.amount * p.exchange_rate),
            bank_account_id: p.bankAccountId
          }));
    
          if (paymentCondition === 'Inicial de Cashea' && remainingAmount > 0) {
            paymentsToInsert.push({
              income_id: income.id, payment_type: 'Cashea', amount: remainingAmount,
              exchange_rate: exchangeRate, amount_bs: remainingAmount * exchangeRate, bank_account_id: null
            });
            const installmentAmount = Number((remainingAmount / numInstallments).toFixed(2));
            const installments = Array.from({ length: numInstallments }).map((_, i) => {
              const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + ((i + 1) * 15));
              return { income_id: income.id, installment_number: i + 1, amount_usd: installmentAmount, status: 'pending', due_date: dueDate.toISOString() };
            });
            await supabase.from('cashea_installments').insert(installments);
          }
    
          if (paymentsToInsert.length > 0) {
            const { error: pError } = await supabase.from('income_payments').insert(paymentsToInsert);
            if (pError) throw pError;
          }
    
          alert('Ingreso registrado con éxito');
          setStep(1); setDocNumber(''); setTotalAmount(''); setPayments([]); setCustomerId(''); setCustomerName(''); setCustomerPhone('');
          fetchRecentIncomes(); setActiveTab('history');
        } catch (e: any) {
          alert('Error: ' + e.message);
        } finally {
          setSaving(false);
        }
    };

    const handleOpenEdit = (income: any) => {
        setEditingIncomeId(income.id);
        setBranch(income.branch);
        setDocType(income.document_type || 'Factura');
        setDocNumber(income.document_number || '');
        setTotalAmount(income.total_amount || 0);
        setPaymentCondition(income.payment_condition || 'Contado');
        setCustomerId(income.customer_id || '');
        setCustomerName(income.customer_name || '');
        setCustomerPhone(income.customer_phone || '');
        setSelectedSeller(income.seller_id || '');
        setDeliveryMethod(income.delivery_method || 'Retira en Tienda');
        setSelectedCourier(income.courier_id || '');
        setSelectedAgency(income.shipping_agency || '');
        setSelectedCashRegister(income.cash_register || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateIncome = async () => {
        if (!editingIncomeId) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('incomes').update({
                branch, document_type: docType, document_number: docNumber, payment_condition: paymentCondition,
                customer_id: customerId || null, customer_name: customerName || null, customer_phone: customerPhone || null,
                total_amount: Number(totalAmount), seller_id: selectedSeller || null, delivery_method: deliveryMethod,
                courier_id: deliveryMethod === 'Servientrega' ? selectedCourier : null,
                shipping_agency: deliveryMethod === 'Envío Nacional' ? selectedAgency : null,
                cash_register: selectedCashRegister
            }).eq('id', editingIncomeId);
            if (error) throw error;
            setIsEditModalOpen(false); fetchRecentIncomes();
            alert('¡Actualizado!');
        } catch (e: any) { alert('Error: ' + e.message); }
        finally { setSaving(false); }
    };

    const handleDeleteIncome = async (id: number) => {
        if (!confirm('¿Seguro? Revertirá saldos.')) return;
        try {
            const { error } = await supabase.from('incomes').delete().eq('id', id);
            if (!error) fetchRecentIncomes();
        } catch (e) { console.error(e); }
    };

    const sumPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = (Number(totalAmount) || 0) - sumPayments;
    const isCustomerMandatory = paymentCondition === 'Credito' || paymentCondition === 'Inicial de Cashea';

    const isFormValid = totalAmount !== '' && Number(totalAmount) > 0 && docNumber.trim() !== '' && selectedSeller !== '' && selectedCashRegister !== '' &&
        (deliveryMethod !== 'Servientrega' || selectedCourier) &&
        (deliveryMethod !== 'Envío Nacional' || selectedAgency) &&
        (!isCustomerMandatory || (customerId && customerName)) &&
        ((paymentCondition === 'Contado' && remainingAmount === 0) ||
         (paymentCondition === 'Credito' && payments.length === 0) ||
         (paymentCondition === 'Inicial de Cashea' && remainingAmount > 0));

    useEffect(() => {
        setNewPayBank('');
    }, [newPayType]);

    const addPayment = () => {
        if (!newPayAmount || Number(newPayAmount) <= 0) return;
        if (Number(newPayAmount) > remainingAmount) return alert('El monto supera el restante');
        const account = bankAccounts.find(ba => ba.id === Number(newPayBank));
        setPayments([...payments, {
            id: Math.random().toString(36).substr(2, 9), type: newPayType, amount: Number(newPayAmount),
            exchange_rate: exchangeRate, amount_bs: Number(amountBs) || undefined,
            bankAccountId: newPayBank ? Number(newPayBank) : undefined,
            bankAccountRef: account ? `${account.banks?.name} - ${account.reference || 'S/R'}` : undefined
        }]);
        setNewPayAmount(''); setNewPayBank(''); setAmountBs('');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <TrendingUp className="text-[#D40000]" size={28} /> Módulo de Ingresos
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium text-left">Control de ventas, créditos y cobranzas por sucursal.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('new')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'new' ? 'bg-white text-[#D40000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Plus size={16} className="inline mr-1" /> Nuevo Registro</button>
                    {userRole !== 'vendedor' && (
                        <>
                            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-[#D40000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><List size={16} className="inline mr-1" /> Ver Historial</button>
                            <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'customers' ? 'bg-white text-[#D40000] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Users size={16} className="inline mr-1" /> Clientes</button>
                        </>
                    )}
                </div>
            </header>

            {activeTab === 'new' ? (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
                    <div className="flex border-b border-gray-100">
                        <div className={`flex-1 p-4 text-center border-r border-gray-100 ${step === 1 ? 'bg-red-50' : ''}`}><span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm mb-1 ${step === 1 ? 'bg-[#D40000] text-white' : 'bg-gray-100 text-gray-400'}`}>1</span><p className={`text-[10px] font-black uppercase tracking-widest ${step === 1 ? 'text-[#D40000]' : 'text-gray-400'}`}>Origen</p></div>
                        <div className={`flex-1 p-4 text-center border-r border-gray-100 ${step === 2 ? 'bg-red-50' : ''}`}><span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm mb-1 ${step === 2 ? 'bg-[#D40000] text-white' : 'bg-gray-100 text-gray-400'}`}>2</span><p className={`text-[10px] font-black uppercase tracking-widest ${step === 2 ? 'text-[#D40000]' : 'text-gray-400'}`}>Cliente</p></div>
                        <div className={`flex-1 p-4 text-center ${step === 3 ? 'bg-red-50' : ''}`}><span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm mb-1 ${step === 3 ? 'bg-[#D40000] text-white' : 'bg-gray-100 text-gray-400'}`}>3</span><p className={`text-[10px] font-black uppercase tracking-widest ${step === 3 ? 'text-[#D40000]' : 'text-gray-400'}`}>Pago</p></div>
                    </div>

                    <div className="p-6 md:p-10 min-h-[400px]">
                        {step === 1 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div><h3 className="text-xl font-black text-gray-800 mb-2">Paso 1: Datos del Documento</h3><p className="text-sm text-gray-500 font-medium">Define dónde se origina esta venta y el monto total.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Sucursal</label><select value={branch} onChange={e => setBranch(e.target.value as any)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"><option value="Boleita">Boleita</option><option value="Sabana Grande">Sabana Grande</option></select></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Caja</label><select value={selectedCashRegister} onChange={e => setSelectedCashRegister(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"><option value="">-- Seleccione una caja --</option>{cashRegistersByBranch[branch].map(cr => <option key={cr} value={cr}>{cr}</option>)}</select></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Tipo de Documento</label><select value={docType} onChange={e => setDocType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"><option value="Factura">Factura Fiscal</option><option value="Recibo">Recibo Manual</option><option value="Nota de Entrega">Nota de Entrega</option></select></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Nº de Documento</label><input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="0001" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700" /></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Monto Total $</label><input type="number" value={totalAmount} onChange={e => { const val = e.target.value; setTotalAmount(val === '' ? '' : Number(val)); if (val && exchangeRate) setTotalAmountBs(Number((Number(val) * exchangeRate).toFixed(2))) }} placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-2xl font-black text-2xl text-[#D40000] transition-all outline-none" /></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Monto en Bolívares (VEF)</label><input type="number" value={totalAmountBs} onChange={e => { const val = e.target.value; setTotalAmountBs(val === '' ? '' : Number(val)); if (val && exchangeRate) setTotalAmount(Number((Number(val) / exchangeRate).toFixed(2))) }} placeholder="0.00" className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-2xl font-black text-xl text-gray-500 transition-all outline-none" /></div>
                                    <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 self-start">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa Referencial (DolarAPI):</span>
                                        <span className="text-sm font-black text-[#D40000]">1 USD = {exchangeRate.toLocaleString('es-VE')} Bs</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Vendedor</label><select value={selectedSeller} onChange={e => setSelectedSeller(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"><option value="">-- Escoger vendedor --</option>{sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Entrega</label><select value={deliveryMethod} onChange={e => { setDeliveryMethod(e.target.value); setSelectedCourier(''); setSelectedAgency(''); }} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"><option value="Retira en Tienda">Retira en Tienda</option><option value="Servientrega">Delivery (Servientrega)</option><option value="Envío Nacional">Envío Nacional</option></select></div>
                                    {deliveryMethod === 'Servientrega' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <label className="block text-xs font-black text-[#D40000] uppercase tracking-widest flex justify-between">
                                                Motorizado Asignado
                                                <button type="button" onClick={() => setIsCourierModalOpen(true)} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 hover:bg-gray-200">+ Nuevo</button>
                                            </label>
                                            <select 
                                                value={selectedCourier} 
                                                onChange={e => setSelectedCourier(Number(e.target.value))} 
                                                className="w-full px-4 py-3 bg-red-50 border-2 border-red-100 focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"
                                                required
                                            >
                                                <option value="">-- Seleccione motorizado --</option>
                                                {couriers.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {deliveryMethod === 'Envío Nacional' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <label className="block text-xs font-black text-[#D40000] uppercase tracking-widest">Agencia de Envío</label>
                                            <select 
                                                value={selectedAgency} 
                                                onChange={e => setSelectedAgency(e.target.value)} 
                                                className="w-full px-4 py-3 bg-red-50 border-2 border-red-100 focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none text-gray-700"
                                                required
                                            >
                                                <option value="">-- Escoger Agencia --</option>
                                                {agencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="flex pt-6"><button onClick={() => setStep(2)} disabled={!totalAmount || !docNumber || !selectedSeller || !selectedCashRegister || (deliveryMethod === 'Servientrega' && !selectedCourier) || (deliveryMethod === 'Envío Nacional' && !selectedAgency)} className="ml-auto flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0">Siguiente Paso <ArrowRightCircle size={20} /></button></div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div><h3 className="text-xl font-black text-gray-800 mb-2">Paso 2: Información del Cliente</h3><p className="text-sm text-gray-500 font-medium">Asocia la venta a un cliente para control de CxC y Cashea.</p></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Condición de Venta</label><div className="flex gap-4 p-1 bg-gray-100 rounded-2xl">{(['Contado', 'Credito', 'Inicial de Cashea'] as PaymentCondition[]).map(c => (
                                        <button key={c} onClick={() => setPaymentCondition(c)} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${paymentCondition === c ? 'bg-white text-[#D40000] shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}>{c === 'Credito' ? 'CRÉDITO / CxC' : c === 'Inicial de Cashea' ? 'CASHEA' : c}</button>))}</div>
                                    </div>
                                    <div className="relative space-y-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Cédula / RIF {isSearchingCustomer && <Loader2 size={12} className="inline animate-spin text-[#D40000] ml-2" />}</label>
                                        <input type="text" value={customerId} onChange={e => setCustomerId(e.target.value.toUpperCase())} placeholder="V-12345678" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none uppercase" />
                                        <button onClick={openCustomerSearch} className="absolute right-3 top-[34px] p-1 text-gray-400 hover:text-[#D40000] transition-colors"><Search size={22} /></button>
                                    </div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Nombre del Cliente</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Juan Pérez" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none" /></div>
                                    <div className="space-y-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Teléfono (WhatsApp)</label><input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="0412-1234567" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#D40000] focus:bg-white rounded-xl font-bold transition-all outline-none" /></div>
                                    {paymentCondition === 'Inicial de Cashea' && (<div className="space-y-2"><label className="block text-xs font-black text-red-600 uppercase tracking-widest">Número de Cuotas</label><input type="number" value={numInstallments} onChange={e => setNumInstallments(Number(e.target.value))} className="w-full px-4 py-3 bg-red-50 border-2 border-red-200 focus:border-[#D40000] focus:bg-white rounded-xl font-black text-center text-xl transition-all outline-none" /></div>)}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 pt-6"><button onClick={() => setStep(1)} className="px-8 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all">Regresar</button><button onClick={() => setStep(3)} disabled={isCustomerMandatory && (!customerId || !customerName)} className="ml-auto flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0">Siguiente Paso <ArrowRightCircle size={20} /></button></div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6"><div className="space-y-1"><h3 className="text-xl font-black text-gray-800">Paso 3: Distribución del Pago</h3><p className="text-sm text-gray-500 font-medium">Registra los montos parciales hasta completar los <b>${totalAmount}</b>.</p></div><div className="px-6 py-4 bg-gray-900 rounded-2xl text-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Restante por cobrar</p><p className={`text-2xl font-black ${remainingAmount === 0 ? 'text-green-400' : 'text-red-400'}`}>${remainingAmount.toFixed(2)}</p></div></div>
                                {paymentCondition === 'Credito' ? (
                                    <div className="p-10 bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl text-center space-y-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm text-orange-500 mb-2"><CreditCard size={32} /></div><h4 className="text-xl font-black text-orange-800 uppercase italic">Venta a Crédito Pendiente</h4><p className="text-orange-600 font-medium max-w-sm mx-auto">Esta transacción se guardará como un saldo pendiente por cobrar para <b>{customerName}</b>.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {remainingAmount > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl items-end">
                                                <div className="md:col-span-3 space-y-2"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Medio de Pago</label><select value={newPayType} onChange={e => setNewPayType(e.target.value)} className="w-full px-4 py-2 bg-white border-2 border-transparent focus:border-[#D40000] rounded-xl font-bold text-sm transition-all outline-none">{paymentTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                                {requiresBank.includes(newPayType) && (
                                                    <div className="md:col-span-3 space-y-2">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Banco / Cuenta</label>
                                                        <select value={newPayBank} onChange={e => setNewPayBank(Number(e.target.value))} className="w-full px-4 py-2 bg-white border-2 border-transparent focus:border-[#D40000] rounded-xl font-bold text-sm transition-all outline-none">
                                                            <option value="">-- Escoger --</option>
                                                            {bankAccounts
                                                                .filter(ba => (ba.payment_types || []).includes(newPayType) && ba.sucursal === branch)
                                                                .map(ba => (
                                                                    <option key={ba.id} value={ba.id}>{ba.banks?.name} - {ba.reference}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                )}
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto $</label>
                                                    <input 
                                                        type="number" step="0.01"
                                                        value={newPayAmount} 
                                                        onChange={e => { 
                                                            const v = e.target.value; 
                                                            setNewPayAmount(v === '' ? '' : Number(v)); 
                                                            if (v !== '' && exchangeRate) {
                                                                setAmountBs(Number((Number(v) * exchangeRate).toFixed(2)));
                                                            } else {
                                                                setAmountBs('');
                                                            }
                                                        }} 
                                                        placeholder="0.00" 
                                                        className="w-full px-4 py-2 bg-white border-2 border-transparent focus:border-[#D40000] rounded-xl font-black text-center text-sm transition-all outline-none" 
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Bs</label>
                                                    <input 
                                                        type="number" step="0.01"
                                                        value={amountBs} 
                                                        onChange={e => { 
                                                            const v = e.target.value; 
                                                            setAmountBs(v === '' ? '' : Number(v)); 
                                                            if (v !== '' && exchangeRate) {
                                                                setNewPayAmount(Number((Number(v) / exchangeRate).toFixed(2)));
                                                            } else {
                                                                setNewPayAmount('');
                                                            }
                                                        }} 
                                                        placeholder="0.00" 
                                                        className="w-full px-4 py-2 bg-white border-2 border-transparent focus:border-[#D40000] rounded-xl font-black text-center text-sm transition-all outline-none" 
                                                    />
                                                </div>
                                                <div className="md:col-span-2 pb-0.5">
                                                    <button onClick={addPayment} className="w-full py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all h-[42px]">Agregar Pago</button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 self-start mb-6">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa Sugerida (DolarAPI):</span>
                                            <span className="text-sm font-black text-[#D40000]">1 USD = {exchangeRate.toLocaleString('es-VE')} Bs</span>
                                        </div>
                                        <div className="space-y-3">
                                            {payments.map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm ring-1 ring-black/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">{p.type.includes('Efectivo') ? <Banknote size={20} /> : <Landmark size={20} />}</div>
                                                        <div><p className="text-sm font-black text-gray-800">{p.type}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.bankAccountRef || 'Efectivo en Caja'}</p></div>
                                                    </div>
                                                    <div className="flex items-center gap-4"><p className="text-xl font-black text-gray-900">${p.amount.toFixed(2)}</p><button onClick={() => setPayments(payments.filter(x => x.id !== p.id))} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X size={16} /></button></div>
                                                </div>
                                            ))}
                                            {paymentCondition === 'Inicial de Cashea' && remainingAmount > 0 && (
                                                <div className="flex justify-between items-center p-6 border-4 border-dashed border-purple-100 bg-purple-50/50 rounded-3xl">
                                                    <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center"><ShieldCheck size={28} /></div><div><p className="text-lg font-black text-purple-900">Financiamiento CASHEA</p><p className="text-xs text-purple-600 font-bold uppercase tracking-widest">Pendiente por cuotas (15/30/45 días)</p></div></div>
                                                    <p className="text-3xl font-black text-purple-700">${remainingAmount.toFixed(2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col md:flex-row gap-4 pt-4"><button onClick={() => setStep(2)} className="px-8 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all">Regresar</button><button onClick={handleSaveIncome} disabled={!isFormValid || saving} className="ml-auto flex items-center gap-3 px-12 py-4 bg-[#D40000] text-white rounded-2xl font-black text-xl shadow-xl shadow-red-200 hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0">{saving ? <><Loader2 className="animate-spin" /> Procesando...</> : <><Save size={24} /> Finalizar Operación</>}</button></div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'history' ? (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-left">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Historial de Ingresos</h3><div className="flex gap-2"></div></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-white border-b border-gray-100">
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha / Hora</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sucursal</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Condición</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Venta Total</th>
                                <th className="py-5 px-6 text-[10px] font-black text-red-600 uppercase tracking-widest text-right">Ingreso Real</th>
                                <th className="py-5 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentIncomes.map(inc => {
                                    const realInflow = (inc.income_payments || [])
                                        .filter((p: any) => p.payment_type !== 'Cashea' && p.payment_type !== 'Credito')
                                        .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

                                    return (
                                        <tr key={inc.id} className="hover:bg-gray-50/80 transition-all group">
                                            <td className="py-5 px-6"><div className="text-sm font-black text-gray-700">{new Date(inc.created_at).toLocaleDateString()}</div><div className="text-[10px] text-gray-400 font-bold">{new Date(inc.created_at).toLocaleTimeString()}</div></td>
                                            <td className="py-5 px-6"><div className="text-sm font-black text-gray-800">{inc.document_type}</div><div className="text-xs text-gray-500 font-mono">#{inc.document_number}</div></td>
                                            <td className="py-5 px-6">
                                                <div className="text-sm font-black text-gray-700 uppercase">{inc.customer_name || 'Sin nombre'}</div>
                                                <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{inc.customer_id}</div>
                                            </td>
                                            <td className="py-5 px-6 text-sm text-gray-600 font-medium">{inc.branch}</td>
                                            <td className="py-5 px-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${inc.payment_condition === 'Contado' ? 'bg-green-100 text-green-700' : inc.payment_condition === 'Inicial de Cashea' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{inc.payment_condition}</span></td>
                                            <td className="py-5 px-6 text-right"><div className="text-lg font-black text-gray-400 opacity-60">${Number(inc.total_amount).toFixed(2)}</div></td>
                                            <td className="py-5 px-6 text-right"><div className="text-xl font-black text-[#D40000]">${realInflow.toFixed(2)}</div></td>
                                            <td className="py-5 px-6 text-center">
                                            {(userRole === 'director' || userRole === 'supervisor') && (
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleOpenEdit(inc)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors"><Edit2 size={14}/></button>
                                                    <button onClick={() => handleDeleteIncome(inc.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                            )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-left">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-[#D40000]"><Users size={32} /></div>
                        <div><h3 className="text-2xl font-black text-gray-800">Directorio de Clientes</h3><p className="text-gray-500 font-medium">Información detallada y saldos pendientes.</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customerList.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400">Busca un cliente en el formulario para cargar este directorio.</div>
                        ) : (
                            customerList.map(c => {
                                const total = c.incomes?.reduce((acc: number, inc: any) => acc + (Number(inc.total_amount) || 0), 0) || 0;
                                const pending = c.cashea_installments?.filter((i: any) => i.status === 'pending').reduce((acc: number, i: any) => acc + (Number(i.amount_usd) || 0), 0) || 0;
                                return (
                                    <div key={c.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-red-50 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] font-black text-gray-400 uppercase mb-1">{c.id}</div>
                                            <div className="text-xl font-black text-gray-800 uppercase mb-4">{c.name}</div>
                                            <div className="space-y-4">
                                                <div className="text-sm text-gray-600 font-medium flex items-center gap-2">📞 {c.phone || 'S/T'}</div>
                                                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                                                    <div><p className="text-[9px] font-bold text-gray-400 uppercase">Compras</p><p className="text-lg font-black">${total.toFixed(2)}</p></div>
                                                    <div><p className="text-[9px] font-bold text-purple-400 uppercase">Cashea</p><p className={`text-lg font-black ${pending > 0 ? 'text-purple-600' : 'text-gray-300'}`}>${pending.toFixed(2)}</p></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-black text-lg text-gray-800">Modificar Ingreso</h3><button onClick={() => setIsEditModalOpen(false)}><X size={24} /></button></div>
                        <div className="p-6 space-y-4 grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Sucursal</label><select value={branch} onChange={e => setBranch(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">{Object.keys(cashRegistersByBranch).map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Doc Nº</label><input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-medium" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Monto $</label><input value={totalAmount} onChange={e => setTotalAmount(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg font-black text-red-600" /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Condición</label><select value={paymentCondition} onChange={e => setPaymentCondition(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg font-bold"><option value="Contado">Contado</option><option value="Credito">Crédito</option><option value="Inicial de Cashea">Cashea</option></select></div>
                            {deliveryMethod === 'Envío Nacional' && (
                                <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Agencia de Envío</label><select value={selectedAgency} onChange={e => setSelectedAgency(e.target.value)} className="w-full px-3 py-2 border rounded-lg font-bold text-red-600">{agencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex gap-3"><button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-white border rounded-xl font-bold">Cancelar</button>
                            <button onClick={handleUpdateIncome} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all">Guardar Cambios</button></div>
                    </div>
                </div>
            )}

            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between"><h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Escoger Cliente</h3><button onClick={() => setIsCustomerModalOpen(false)}><X size={20} /></button></div>
                        <div className="p-4 border-b flex items-center gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-gray-400" size={16} /><input type="text" placeholder="Buscar por nombre o cédula..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 transition-all font-bold" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} autoFocus /></div></div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.id.includes(customerSearch.toUpperCase())).slice(0, 50).map(c => (
                                <button key={c.id} onClick={() => handleSelectCustomer(c)} className="w-full p-3 text-left rounded-xl hover:bg-red-50 flex items-center justify-between transition-all group"><div><p className="text-sm font-black text-gray-800 uppercase group-hover:text-[#D40000]">{c.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.id}</p></div><ArrowRightCircle size={18} className="text-gray-200 group-hover:text-[#D40000]" /></button>))}
                        </div>
                    </div>
                </div>
            )}

            {isCourierModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gray-50 border-b flex items-center justify-between">
                            <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Nuevo Motorizado</h3>
                            <button onClick={() => setIsCourierModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={newCourierName} 
                                    onChange={e => setNewCourierName(e.target.value)} 
                                    placeholder="Ej: Pedro Perez"
                                    className="w-full px-4 py-2 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono</label>
                                <input 
                                    type="text" 
                                    value={newCourierPhone} 
                                    onChange={e => setNewCourierPhone(e.target.value)} 
                                    placeholder="0412..."
                                    className="w-full px-4 py-2 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <button 
                                onClick={handleSaveCourier}
                                disabled={!newCourierName || savingCourier}
                                className="w-full py-3 bg-[#D40000] text-white rounded-xl font-black text-sm shadow-xl shadow-red-100 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {savingCourier ? 'Guardando...' : 'Registrar Motorizado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
