import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Settings as SettingsIcon,
  ArrowLeftRight,
  Database,
  History as HistoryIcon,
  Menu,
  X,
  LogOut,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  Loader2,
  ShieldAlert,
  User,
  MessageSquare
} from 'lucide-react';
import { supabase } from './services/supabase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Suppliers } from './pages/Suppliers';
import { SalesNE } from './pages/SalesNE';
import { Purchases } from './pages/Purchases';
import { SyncLogs } from './pages/SyncLogs';
import { Fordmac } from './pages/Fordmac';
import { Income } from './pages/Income';
import { Expenses } from './pages/Expenses';
import { Banks } from './pages/Banks';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings as SettingsComponent } from './pages/Settings';
import { CasheaManagement } from './pages/CasheaManagement';
import { Customers } from './pages/Customers';
import { InternalTransfers } from './pages/InternalTransfers';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { CashierClosing } from './pages/CashierClosing';
import { Support } from './pages/Support';
import { Commissions } from './pages/Commissions';

type View = 'dashboard' | 'inventory' | 'suppliers' | 'sales' | 'purchases' | 'sync' | 'settings' | 'fordmac' | 'income' | 'expenses' | 'banks' | 'admin_dashboard' | 'cashea' | 'customers' | 'internal_transfers' | 'purchase_orders' | 'cashier_closing' | 'support' | 'commissions';
export type Role = 'director' | 'supervisor' | 'cajero' | 'vendedor' | 'compras' | 'soporte';

const rolePermissions: Record<Role, View[]> = {
  director: ['dashboard', 'inventory', 'suppliers', 'sales', 'purchases', 'sync', 'settings', 'fordmac', 'income', 'expenses', 'banks', 'admin_dashboard', 'cashea', 'customers', 'internal_transfers', 'purchase_orders', 'cashier_closing', 'support', 'commissions'],
  supervisor: ['dashboard', 'inventory', 'suppliers', 'purchases', 'admin_dashboard', 'income', 'expenses', 'banks', 'cashea', 'customers', 'internal_transfers', 'purchase_orders', 'cashier_closing', 'support', 'commissions'],
  cajero: ['inventory', 'income', 'cashier_closing', 'support'],
  vendedor: ['inventory', 'income', 'support'],
  compras: ['inventory', 'purchases', 'fordmac', 'suppliers', 'purchase_orders', 'support'],
  soporte: ['inventory', 'support']
};

const defaultViews: Record<Role, View> = {
  director: 'dashboard',
  supervisor: 'dashboard',
  cajero: 'income',
  vendedor: 'inventory',
  compras: 'fordmac',
  soporte: 'support'
};

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  view: View;
  activeView: View;
  isOpen: boolean;
  onClick: (view: View) => void;
  allowedRoles: Role[];
  userRole: Role;
}

const NavItem = (props: NavItemProps) => {
  if (!props.allowedRoles.includes(props.userRole)) return null;

  const Icon = props.icon;
  const isActive = props.activeView === props.view;

  return (
    <button
      onClick={() => props.onClick(props.view)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${isActive
        ? 'bg-[#D40000] text-white shadow-md'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      {props.isOpen && <span className="font-medium text-sm">{props.label}</span>}
    </button>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const fetchUserRole = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('user_roles').select('role, email').eq('user_id', userId).single();
      let role: Role = 'cajero';

      if (data && data.role) {
        role = data.role as Role;
        if (!data.email && email) {
          await supabase.from('user_roles').update({ email }).eq('user_id', userId);
        }
      } else if (error && error.code === 'PGRST116') {
        // Not found, auto-insert default cajero role with email
        await supabase.from('user_roles').insert([{ user_id: userId, role: 'cajero', email }]);
        role = 'cajero';
      }

      setUserRole(role);

      // Verify active view is allowed, else push to default
      setActiveView(prevView => {
        if (!rolePermissions[role].includes(prevView)) {
          return defaultViews[role];
        }
        return prevView;
      });

    } catch (err) {
      console.error('Error in Role sync:', err);
      // Fallback restrictive
      setUserRole('cajero');
      setActiveView('admin_dashboard');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserRole(session.user.id, session.user.email || '');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user.email || '');
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close sidebar on mobile when view changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [activeView]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSetView = (view: View) => {
    setActiveView(view);
  };

  if (!session) {
    return <Login />;
  }

  if (!userRole) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="animate-spin text-[#D40000]" size={48} />
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Validando Credenciales de Acceso...</p>
      </div>
    );
  }

  const isViewAllowed = rolePermissions[userRole].includes(activeView);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Logic */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        bg-[#1A1A1A] text-white transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} 
        flex flex-col shadow-2xl overflow-hidden
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800 min-w-[256px]">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tighter">RG7<span className="text-[#D40000]">ERP</span></span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Admin Core</span>
          </div>
          <button onClick={handleToggleSidebar} className="p-1 hover:bg-gray-800 rounded md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-w-[256px]">
          <div className="pb-2">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Dashboard</span>}
          </div>
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={Wallet} label="Dashboard Admin" view="admin_dashboard" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Inventario</span>}
          </div>
          <NavItem icon={Package} label="Consulta de Stock" view="inventory" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'vendedor', 'compras', 'cajero']} userRole={userRole} />

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Ventas</span>}
          </div>
          <NavItem icon={ShoppingCart} label="Ventas Sistema" view="sales" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director']} userRole={userRole} />
          <NavItem icon={TrendingUp} label="Ingresos" view="income" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'cajero', 'vendedor']} userRole={userRole} />

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Compras</span>}
          </div>
          <NavItem icon={HistoryIcon} label="Ordenes de Compra" view="purchase_orders" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'compras']} userRole={userRole} />
          <NavItem icon={ArrowLeftRight} label="Compras" view="purchases" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'compras']} userRole={userRole} />
          <NavItem icon={BarChart3} label="FORDMAC" view="fordmac" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'compras']} userRole={userRole} />
          <NavItem icon={Truck} label="Proveedores" view="suppliers" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'compras']} userRole={userRole} />

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Administrativo</span>}
          </div>
          <NavItem icon={HistoryIcon} label="Cuadre de Caja" view="cashier_closing" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'cajero']} userRole={userRole} />
          <NavItem icon={Wallet} label="Comisiones" view="commissions" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={TrendingDown} label="Egresos" view="expenses" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={Landmark} label="Bancos" view="banks" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={ArrowLeftRight} label="Transf. Internas" view="internal_transfers" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={HistoryIcon} label="Cashea" view="cashea" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />
          <NavItem icon={User} label="Agenda / Clientes" view="customers" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor']} userRole={userRole} />

          {userRole === 'director' && (
            <>
              <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
                {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Configuración</span>}
              </div>
              <NavItem icon={HistoryIcon} label="Cola de Eventos" view="sync" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director']} userRole={userRole} />
              <NavItem icon={SettingsIcon} label="Usuarios / Roles" view="settings" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director']} userRole={userRole} />
            </>
          )}

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Atención</span>}
          </div>
          <NavItem icon={MessageSquare} label="Soporte Técnico" view="support" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} allowedRoles={['director', 'supervisor', 'cajero', 'vendedor', 'compras']} userRole={userRole} />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#121212] min-w-[256px]">
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner uppercase tracking-wider
                ${userRole === 'director' ? 'bg-[#D40000] text-white' : userRole === 'supervisor' ? 'bg-blue-600 text-white' : userRole === 'vendedor' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}
              >
                {userRole.substring(0, 2)}
              </div>
              {(isSidebarOpen || window.innerWidth < 768) && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate w-24 text-gray-200">{session.user?.email}</span>
                  <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">{userRole}</span>
                </div>
              )}
            </div>
            {(isSidebarOpen || window.innerWidth < 768) && (
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSidebar}
              className="p-2 -ml-2 hover:bg-gray-50 rounded-xl md:hidden text-gray-600"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-sm md:text-lg font-black text-gray-800 uppercase tracking-tight truncate max-w-[120px] md:max-w-none">
                {activeView === 'sales' ? 'Ventas' :
                  activeView === 'purchases' ? 'Compras' :
                    activeView === 'sync' ? 'Eventos' :
                      activeView === 'income' ? 'Ingresos' :
                        activeView === 'expenses' ? 'Egresos' :
                          activeView === 'banks' ? 'Bancos' :
                            activeView === 'cashea' ? 'Cuentas por Cobrar Cashea' :
                              activeView === 'customers' ? 'Agenda de Clientes' :
                                activeView === 'admin_dashboard' ? 'Panel Administrativo' :
                                  activeView === 'dashboard' ? 'Dashboard Central' :
                                    activeView === 'settings' ? 'Configuración' :
                                      activeView === 'internal_transfers' ? 'Transferencias Internas' :
                                        activeView === 'purchase_orders' ? 'Ordenes de Compra' :
                                          activeView === 'cashier_closing' ? 'Cuadre de Caja' :
                                            activeView === 'support' ? 'Soporte y Requerimientos' :
                                              activeView}
              </h1>
              <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
              <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:block">RG7 Autopartes</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-green-100">
              <div className="w-1.5 md:w-2 md:h-2 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[8px] md:text-[10px] font-bold text-green-700 uppercase tracking-tighter">Conectado</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:flex pointer-events-none">
              <Database size={14} className="text-gray-400" />
              {userRole}
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          {!isViewAllowed ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShieldAlert className="text-red-500/50 mb-4" size={64} />
              <h2 className="text-2xl font-black text-gray-800 mb-2">Acceso Restringido</h2>
              <p className="text-gray-500 font-medium max-w-sm">
                Tu perfil de acceso actual ({userRole}) no tiene los permisos requeridos para visualizar esta sección.
              </p>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' && <Dashboard userRole={userRole} />}
              {activeView === 'inventory' && <Inventory />}
              {activeView === 'suppliers' && <Suppliers />}
              {activeView === 'sales' && <SalesNE />}
              {activeView === 'purchases' && <Purchases />}
              {activeView === 'sync' && <SyncLogs />}
              {activeView === 'fordmac' && <Fordmac />}
              {activeView === 'admin_dashboard' && <AdminDashboard />}
              {activeView === 'income' && <Income />}
              {activeView === 'expenses' && <Expenses />}
              {activeView === 'banks' && <Banks />}
              {activeView === 'cashea' && <CasheaManagement />}
              {activeView === 'customers' && <Customers />}
              {activeView === 'internal_transfers' && <InternalTransfers />}
              {activeView === 'purchase_orders' && <PurchaseOrders />}
              {activeView === 'cashier_closing' && <CashierClosing />}
              {activeView === 'support' && <Support />}
              {activeView === 'commissions' && <Commissions />}
              {activeView === 'settings' && <SettingsComponent />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}