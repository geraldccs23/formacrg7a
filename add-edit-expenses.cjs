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

// ----------------- EXPENSES.TSX -----------------
let exp = new Editor('pages/Expenses.tsx');

// 1. Add Edit2 icon and Edit Modal states
exp.replace(
    "import { TrendingDown, Plus, List, Save, Building2, Users, Search, AlertCircle } from 'lucide-react';",
    "import { TrendingDown, Plus, List, Save, Building2, Users, Search, AlertCircle, Edit2, Trash2, X } from 'lucide-react';"
);

// Remove the Trash2 I might have added in imports if it's already there (to avoid duplicates)
// Actually I see in my previous run I added it with Trash2. Let's be smart.
if (exp.code.includes('Edit2, Trash2')) {
    // Already has some, let's just make sure it has X
    if (!exp.code.includes('Trash2, X')) {
        exp.code = exp.code.replace('Trash2 }', 'Trash2, X }');
    }
}

exp.replace(
    "const [savingRecipient, setSavingRecipient] = useState(false);",
    "const [savingRecipient, setSavingRecipient] = useState(false);\n    const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n    const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);"
);

// 2. Add handleEditExpense and update handleSaveExpense logic
const editFunctions = `
    const handleOpenEdit = (expense: any) => {
        setEditingExpenseId(expense.id);
        setBranch(expense.branch);
        setRecipientId(expense.recipient_id);
        setConcept(expense.concept);
        setAmount(expense.amount);
        setPaymentType(expense.payment_type);
        setBankAccountId(expense.bank_account_id || '');
        setExchangeRate(expense.exchange_rate || 1);
        setAmountBs(expense.amount_bs || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateExpense = async () => {
        if (!isExpenseFormValid || !editingExpenseId) return;
        setSavingExpense(true);
        try {
            const { error } = await supabase.from('expenses').update({
                branch,
                recipient_id: Number(recipientId),
                concept,
                payment_type: paymentType,
                bank_account_id: bankAccountId ? Number(bankAccountId) : null,
                amount: Number(amount),
                exchange_rate: Number(exchangeRate),
                amount_bs: amountBs !== '' ? Number(amountBs) : null
            }).eq('id', editingExpenseId);

            if (error) throw error;
            alert('¡Egreso actualizado exitosamente!');
            setIsEditModalOpen(false);
            setEditingExpenseId(null);
            resetForm();
            fetchRecentExpenses();
        } catch (error: any) {
            alert('Error al actualizar egreso: ' + error.message);
        } finally {
            setSavingExpense(false);
        }
    };

    const resetForm = () => {
        setConcept('');
        setAmount('');
        setRecipientId('');
        setBankAccountId('');
        setAmountBs('');
    };
`;

exp.replace(
    "const fetchBankAccounts = async () => {",
    editFunctions + "\n    const fetchBankAccounts = async () => {"
);

// 3. Add Edit Button in the table
// Note: My previous run already added the Delete button. I'll add Edit next to it.
exp.replace(
    '<button onClick={() => handleDeleteExpense(exp.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar Egreso y Revertir Saldos">',
    `<button onClick={() => handleOpenEdit(exp)} className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-blue-200" title="Editar Egreso">
                <Edit2 size={16} />
            </button>
            <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar Egreso y Revertir Saldos">`
);

// 4. Add the Overlay Modal for Editing (I'll just inject it at the end)
const modalHtml = `
            {/* Modal: Editar Egreso */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                                <Edit2 className="text-blue-600" size={20} />
                                Modificar Registro de Egreso
                            </h3>
                            <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                            {/* Reusamos la estructura de Paso 1 y 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sucursal</label>
                                    <select value={branch} onChange={e => setBranch(e.target.value as any)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium">
                                        <option value="Boleita">Boleita</option>
                                        <option value="Sabana Grande">Sabana Grande</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor / Destinatario</label>
                                    <select
                                        value={recipientId}
                                        onChange={e => setRecipientId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                                    >
                                        <option value="">-- Seleccione --</option>
                                        {recipients.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Concepto</label>
                                    <input
                                        type="text"
                                        value={concept}
                                        onChange={e => setConcept(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Bs</label>
                                    <input
                                        type="number"
                                        value={amountBs}
                                        onChange={e => {
                                            const bs = e.target.value ? Number(e.target.value) : '';
                                            setAmountBs(bs);
                                            if (bs && exchangeRate) setAmount(Number((Number(bs) / exchangeRate).toFixed(2)));
                                        }}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto USD ($)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => {
                                            const usd = e.target.value ? Number(e.target.value) : '';
                                            setAmount(usd);
                                            if (usd && exchangeRate) setAmountBs(Number((Number(usd) * exchangeRate).toFixed(2)));
                                        }}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-black text-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Medio de Pago</label>
                                    <select
                                        value={paymentType}
                                        onChange={e => { setPaymentType(e.target.value); setBankAccountId(''); }}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                    >
                                        {paymentTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                                    </select>
                                </div>
                                {requiresBank.includes(paymentType) && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banco</label>
                                        <select
                                            value={bankAccountId}
                                            onChange={e => setBankAccountId(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium"
                                        >
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
                            <button
                                onClick={() => { setIsEditModalOpen(false); resetForm(); }}
                                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateExpense}
                                disabled={!isExpenseFormValid || savingExpense}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                            >
                                {savingExpense ? 'Guardando...' : 'Actualizar Cambios y Ajustar Saldo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
`;

// Insert modalBefore final closing div
const finalClosing = "        </div>\n    );\n}";
exp.replace(finalClosing, modalHtml + finalClosing);

exp.save();

console.log("Edit logic for Expenses successfully applied!");
