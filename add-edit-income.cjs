const fs = require('fs');

class Editor {
    constructor(filePath) {
        this.filePath = filePath;
        this.code = fs.readFileSync(filePath, 'utf8');
    }
    replace(target, replacement) {
        this.code = this.code.replace(target, replacement);
    }
    save() {
        fs.writeFileSync(this.filePath, this.code);
    }
}

// ----------------- INCOME.TSX -----------------
let inc = new Editor('pages/Income.tsx');

inc.replace(
    "import { Landmark, Plus, Save, Building2, Search, ArrowRight, Loader2, RefreshCw, CheckCircle, XCircle, DollarSign, Clock, List } from 'lucide-react';",
    "import { Landmark, Plus, Save, Building2, Search, ArrowRight, Loader2, RefreshCw, CheckCircle, XCircle, DollarSign, Clock, List, Edit2, Trash2, X } from 'lucide-react';"
);

inc.replace(
    "const [savingPayment, setSavingPayment] = useState(false);",
    "const [savingPayment, setSavingPayment] = useState(false);\n    const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n    const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);"
);

const incomeEditFunctions = `
    const handleOpenEdit = (payment: any) => {
        setEditingIncomeId(payment.id);
        setBranch(payment.branch);
        setReference(payment.reference);
        setAmount(payment.amount);
        setPaymentType(payment.payment_type);
        setBankAccountId(payment.bank_account_id || '');
        setAmountBs(payment.amount_bs || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateIncome = async () => {
        if (!isFormValid || !editingIncomeId) return;
        setSavingPayment(true);
        try {
            const { error } = await supabase.from('income_payments').update({
                branch,
                reference,
                payment_type: paymentType,
                bank_account_id: bankAccountId ? Number(bankAccountId) : null,
                amount: Number(amount),
                amount_bs: amountBs !== '' ? Number(amountBs) : null
            }).eq('id', editingIncomeId);

            if (error) throw error;
            alert('¡Ingreso actualizado exitosamente!');
            setIsEditModalOpen(false);
            setEditingIncomeId(null);
            resetForm();
            fetchHistory();
        } catch (error: any) {
            alert('Error al actualizar ingreso: ' + error.message);
        } finally {
            setSavingPayment(false);
        }
    };

    const resetForm = () => {
        setReference('');
        setAmount('');
        setBankAccountId('');
        setAmountBs('');
    };
`;

inc.replace(
    "const fetchHistory = async () => {",
    incomeEditFunctions + "\n    const fetchHistory = async () => {"
);

// Add Edit Button in Income table
inc.replace(
    '<button onClick={() => handleDeleteIncome(p.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar y Revertir Saldo">',
    `<button onClick={() => handleOpenEdit(p)} className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-blue-200" title="Editar Ingreso">
                <Edit2 size={16} />
            </button>
            <button onClick={() => handleDeleteIncome(p.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar y Revertir Saldo">`
);

const incomeModalHtml = `
            {/* Modal: Editar Ingreso */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                                <Edit2 className="text-blue-600" size={20} />
                                Modificar Registro de Ingreso
                            </h3>
                            <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sucursal</label>
                                    <select value={branch} onChange={e => setBranch(e.target.value as any)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium">
                                        <option value="Boleita">Boleita</option>
                                        <option value="Sabana Grande">Sabana Grande</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Referencia / Cliente / Concepto</label>
                                    <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Bs</label>
                                    <input type="number" value={amountBs} onChange={e => setAmountBs(Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto USD ($)</label>
                                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-black text-blue-600" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Forma de Pago</label>
                                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold">
                                        <option value="Efectivo $">Efectivo $</option>
                                        <option value="Efectivo Bs">Efectivo Bs</option>
                                        <option value="Punto de Venta">Punto de Venta</option>
                                        <option value="Pago Móvil">Pago Móvil</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Zelle">Zelle</option>
                                        <option value="Binance">Binance</option>
                                    </select>
                                </div>
                                {(paymentType !== 'Efectivo $' && paymentType !== 'Efectivo Bs') && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banco Destino</label>
                                        <select value={bankAccountId} onChange={e => setBankAccountId(Number(e.target.value))} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium">
                                            <option value="">-- Seleccionar --</option>
                                            {bankAccounts.map(ba => (
                                                <option key={ba.id} value={ba.id}>{ba.banks?.name} - {ba.reference}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex gap-3">
                            <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all">Cancelar</button>
                            <button onClick={handleUpdateIncome} disabled={!isFormValid || savingPayment} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                                {savingPayment ? 'Guardando...' : 'Actualizar e Ajustar Saldo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
`;

const incomeFinalClosing = "        </div>\n    );\n}";
inc.replace(incomeFinalClosing, incomeModalHtml + incomeFinalClosing);

inc.save();

console.log("Edit logic for Income successfully applied!");
