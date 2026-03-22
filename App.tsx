import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Settings,
  ArrowLeftRight,
  Database,
  History as HistoryIcon,
  Menu,
  X,
  LogOut,
  BarChart3
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

type View = 'dashboard' | 'inventory' | 'suppliers' | 'sales' | 'purchases' | 'sync' | 'settings' | 'fordmac';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  view: View;
  activeView: View;
  isOpen: boolean;
  onClick: (view: View) => void;
}

const NavItem = (props: NavItemProps) => {
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
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={Package} label="Inventario" view="inventory" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={Truck} label="Proveedores" view="suppliers" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={ShoppingCart} label="Ventas (NE)" view="sales" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={ArrowLeftRight} label="Compras" view="purchases" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={BarChart3} label="FORDMAC" view="fordmac" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />

          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {(isSidebarOpen || window.innerWidth < 768) && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Saint Sync</span>}
          </div>
          <NavItem icon={HistoryIcon} label="Cola de Eventos" view="sync" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
          <NavItem icon={Settings} label="Configuración" view="settings" activeView={activeView} isOpen={isSidebarOpen || window.innerWidth < 768} onClick={handleSetView} />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#121212] min-w-[256px]">
          <div className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#D40000] flex items-center justify-center font-bold text-sm shadow-inner">AD</div>
              {(isSidebarOpen || window.innerWidth < 768) && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate w-24">{session.user?.email}</span>
                  <span className="text-[9px] text-gray-500 font-mono">ID: ERP-ST-001</span>
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
            <button className="p-2 text-gray-400 hover:text-[#D40000] transition-colors hidden sm:block">
              <Database size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          {activeView === 'dashboard' ? <Dashboard /> : null}
          {activeView === 'inventory' ? <Inventory /> : null}
          {activeView === 'suppliers' ? <Suppliers /> : null}
          {activeView === 'sales' ? <SalesNE /> : null}
          {activeView === 'purchases' ? <Purchases /> : null}
          {activeView === 'sync' ? <SyncLogs /> : null}
          {activeView === 'fordmac' ? <Fordmac /> : null}
          {activeView === 'settings' ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border text-center">
              <Settings className="mx-auto text-gray-300 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2 text-gray-800">Módulo de Configuración</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Parámetros de empresa, perfiles fiscales y llaves de API SAINT disponibles en la próxima actualización.</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}