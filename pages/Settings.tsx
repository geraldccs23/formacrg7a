import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Search, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface UserRole {
    user_id: string;
    email: string;
    role: 'director' | 'supervisor' | 'cajero' | 'vendedor' | 'compras';
    created_at: string;
}

export function Settings() {
    const [users, setUsers] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setCurrentUserId(session.user.id);
        });
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'director' | 'supervisor' | 'cajero' | 'vendedor' | 'compras') => {
        if (userId === currentUserId) {
            alert('Por seguridad, no puedes cambiar tu propio rol desde aquí.');
            return;
        }

        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ role: newRole })
                .eq('user_id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('No se pudo actualizar el rol.');
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        <SettingsIcon className="text-[#D40000]" size={28} />
                        Configuración y Seguridad
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Gestión de accesos, roles y permisos de los empleados.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-gray-400" size={20} /> Directorio de Usuarios
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar correo..."
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Empleado (Email)</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider">Nivel de Acceso (Rol)</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-gray-800">{user.email || 'Email no registrado'}</div>
                                        {user.user_id === currentUserId && (
                                            <span className="inline-block mt-1 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                                Tú (Actual)
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6">
                                            <select
                                                value={user.role}
                                                disabled={updatingId === user.user_id || user.user_id === currentUserId}
                                                onChange={(e) => handleRoleChange(user.user_id, e.target.value as any)}
                                                className={`text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer
                             ${user.role === 'director' ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500/20' :
                                                        user.role === 'supervisor' ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500/20' :
                                                            user.role === 'vendedor' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 focus:ring-indigo-500/20' :
                                                                user.role === 'compras' ? 'bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500/20' :
                                                            'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500/20'
                                                    } ${(updatingId === user.user_id || user.user_id === currentUserId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="vendedor">Vendedor (Inventario / Ingresos)</option>
                                                <option value="compras">Compras (Inventario / Compras / FORDMAC)</option>
                                                <option value="cajero">Cajero (Ingresos / Inventario)</option>
                                                <option value="supervisor">Supervisor (Control de Flujo / Inventario)</option>
                                                <option value="director">Director (Control Absoluto)</option>
                                            </select>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {updatingId === user.user_id ? (
                                            <Loader2 size={18} className="animate-spin text-gray-400 inline" />
                                        ) : (
                                            user.user_id === currentUserId && (
                                                <div title="No puedes cambiar tu propio rol">
                                                    <AlertCircle size={18} className="text-gray-300 inline" />
                                                </div>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-400 font-medium text-sm">
                                        No se han registrado usuarios aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
