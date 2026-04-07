const fs = require('fs');

function patch(file, headerTarget, headerReplacement, rowTarget, rowReplacement) {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes(headerReplacement)) {
        code = code.replace(headerTarget, headerReplacement);
    }
    if (!code.includes(rowReplacement)) {
        code = code.replace(rowTarget, rowReplacement);
    }
    fs.writeFileSync(file, code);
}

// EXPENSES
patch(
    'pages/Expenses.tsx',
    '<th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Monto</th>',
    `<th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Monto</th>
                                    {(userRole === 'director' || userRole === 'supervisor') && (
                                        <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                    )}`,
    '<td className="py-4 px-6 text-right font-black text-[#D40000] text-lg">\n                                                -${Number(exp.amount).toLocaleString(\'en-US\', { minimumFractionDigits: 2 })}\n                                            </td>',
    `<td className="py-4 px-6 text-right font-black text-[#D40000] text-lg">
                                                -\${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            {(userRole === 'director' || userRole === 'supervisor') && (
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleOpenEdit(exp)}
                                                            className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                            title="Editar Registro"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                            title="Eliminar y Revertir Saldo"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}`
);

// INCOME
patch(
    'pages/Income.tsx',
    '<th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Monto</th>',
    `<th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Monto</th>
                                    {(userRole === 'director' || userRole === 'supervisor') && (
                                        <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                    )}`,
    '<td className="py-4 px-6 text-right font-black text-green-600 text-lg">\n                                                ${Number(p.amount).toLocaleString(\'en-US\', { minimumFractionDigits: 2 })}\n                                            </td>',
    `<td className="py-4 px-6 text-right font-black text-green-600 text-lg">
                                                \${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            {(userRole === 'director' || userRole === 'supervisor') && (
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleOpenEdit(p)}
                                                            className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                            title="Editar Registro"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteIncome(p.id)}
                                                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                            title="Eliminar y Revertir Saldo"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}`
);

console.log("Role-based action buttons patched!");
