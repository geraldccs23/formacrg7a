const fs = require('fs');

class Editor {
    constructor(filePath) {
        this.filePath = filePath;
        this.code = fs.readFileSync(filePath, 'utf8');
    }
    replace(regex, replacement) {
        this.code = this.code.replace(regex, replacement);
    }
    save() {
        fs.writeFileSync(this.filePath, this.code);
    }
}

// ----------------- INCOME.TSX -----------------
let inc = new Editor('pages/Income.tsx');

inc.replace(
    /import \{ TrendingUp, Plus, List, Save, X, Building2, CreditCard, Banknote, Landmark, ShieldCheck, Loader2, Search, ArrowRightCircle \} from 'lucide-react';/,
    "import { TrendingUp, Plus, List, Save, X, Building2, CreditCard, Banknote, Landmark, ShieldCheck, Loader2, Search, ArrowRightCircle, Trash2 } from 'lucide-react';"
);

inc.replace(
    /    const \[loadingAccounts, setLoadingAccounts\] = useState\(false\);/,
    "    const [loadingAccounts, setLoadingAccounts] = useState(false);\n    const [userRole, setUserRole] = useState<string | null>(null);"
);

inc.replace(
    /    useEffect\(\(\) => \{/,
    "    useEffect(() => {\n        fetchUserRole();"
);

const fetchCode = `    const fetchUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            if (data) setUserRole(data.role);
        }
    };

    const handleDeleteIncome = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este ingreso? Se registrará una traza en el sistema y los saldos bancarios vinculados se devolverán automáticamente.')) return;
        try {
            const { error } = await supabase.from('incomes').delete().eq('id', id);
            if (error) throw error;
            fetchRecentIncomes();
        } catch (error) {
            console.error('Error deleting income:', error);
            alert('Error al eliminar ingreso.');
        }
    };
`;

inc.replace(
    /    const fetchSellers = async \(\) => \{/,
    fetchCode + '\n    const fetchSellers = async () => {'
);


inc.replace(
    /<td className=\"py-4 px-6 text-right font-black text-\[#D40000\] text-lg\">\s*\$\{Number\(inc\.total_amount\).toLocaleString\('en-US', \{ minimumFractionDigits: 2 \}\)\}\s*<\/td>/,
    `<td className="py-4 px-6 text-right font-black text-[#D40000] text-lg flex items-center justify-end gap-3">
        \${Number(inc.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        {(userRole === 'director' || userRole === 'supervisor') && (
            <button onClick={() => handleDeleteIncome(inc.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar Ingreso y Revertir Saldos">
                <Trash2 size={16} />
            </button>
        )}
    </td>`
);

inc.save();


// ----------------- EXPENSES.TSX -----------------
let exp = new Editor('pages/Expenses.tsx');

exp.replace(
    /import \{ TrendingDown, Plus, List, Save, Building2, CreditCard, Banknote, Landmark, Loader2 \} from 'lucide-react';/,
    "import { TrendingDown, Plus, List, Save, Building2, CreditCard, Banknote, Landmark, Loader2, Trash2 } from 'lucide-react';"
);

exp.replace(
    /    const \[loadingBanks, setLoadingBanks\] = useState\(false\);/,
    "    const [loadingBanks, setLoadingBanks] = useState(false);\n    const [userRole, setUserRole] = useState<string | null>(null);"
);

exp.replace(
    /    useEffect\(\(\) => \{/,
    "    useEffect(() => {\n        fetchUserRole();"
);

const fetchExCode = `    const fetchUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            if (data) setUserRole(data.role);
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('¿Seguro que deseas eliminar este egreso? Se registrará una traza en el sistema y los saldos bancarios vinculados se devolverán automáticamente.')) return;
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchRecentExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error al eliminar egreso.');
        }
    };
`;

exp.replace(
    /    const fetchBanks = async \(\) => \{/,
    fetchExCode + '\n    const fetchBanks = async () => {'
);


exp.replace(
    /<td className=\"py-4 px-6 text-right font-black text-gray-800 text-lg\">\s*\$\{Number\(exp\.amount\).toLocaleString\('en-US', \{ minimumFractionDigits: 2 \}\)\}\s*<\/td>/,
    `<td className="py-4 px-6 text-right font-black text-gray-800 text-lg flex items-center justify-end gap-3">
        \${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        {(userRole === 'director' || userRole === 'supervisor') && (
            <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-200" title="Eliminar Egreso y Revertir Saldos">
                <Trash2 size={16} />
            </button>
        )}
    </td>`
);

exp.save();

console.log("Edit logic appended correctly!");
