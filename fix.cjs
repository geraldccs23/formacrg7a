const fs = require('fs');
let code = fs.readFileSync('pages/Expenses.tsx', 'utf8');

const fetchExCode = `
    const fetchUserRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
            if (data) setUserRole(data.role);
        }
    };

    const handleDeleteExpense = async (id) => {
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

const target = '    const fetchBankAccounts = async () => {';
const idx = code.indexOf(target);
if (idx !== -1) {
    code = code.slice(0, idx) + fetchExCode + code.slice(idx);
    fs.writeFileSync('pages/Expenses.tsx', code);
    console.log('Fixed Expenses.tsx');
} else {
    console.log('Target not found in Expenses.tsx');
}
