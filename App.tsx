import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Suppliers } from './pages/Suppliers';
import { SalesNE } from './pages/SalesNE';
import { Purchases } from './pages/Purchases';
import { SyncLogs } from './pages/SyncLogs';

type View = 'dashboard' | 'inventory' | 'suppliers' | 'sales' | 'purchases' | 'sync' | 'settings';

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
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${
        isActive 
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
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSetView = (view: View) => {
    setActiveView(view);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <aside className={`bg-[#1A1A1A] text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          {isSidebarOpen ? (
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tighter">RG7<span className="text-[#D40000]">ERP</span></span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Admin Core</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-[#D40000]">RG7</span>
          )}
          <button onClick={handleToggleSidebar} className="p-1 hover:bg-gray-800 rounded">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Dashboard" view="dashboard" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          <NavItem icon={Package} label="Inventario" view="inventory" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          <NavItem icon={Truck} label="Proveedores" view="suppliers" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          <NavItem icon={ShoppingCart} label="Ventas (NE)" view="sales" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          <NavItem icon={ArrowLeftRight} label="Compras" view="purchases" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          
          <div className="pt-6 pb-2 border-t border-gray-800 mt-4">
            {isSidebarOpen && <span className="px-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">Saint Sync</span>}
          </div>
          <NavItem icon={HistoryIcon} label="Cola de Eventos" view="sync" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
          <NavItem icon={Settings} label="Configuración" view="settings" activeView={activeView} isOpen={isSidebarOpen} onClick={handleSetView} />
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#121212]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#D40000] flex items-center justify-center font-bold text-sm shadow-inner">AD</div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-bold">Arquitecto RG7</span>
                <span className="text-[9px] text-gray-500 font-mono">ID: ERP-ST-001</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">{activeView}</h1>
            <div className="h-4 w-px bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">RG7 Autopartes C.A.</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-tighter">SAINT: Conectado</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-[#D40000] transition-colors">
              <Database size={20} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeView === 'dashboard' ? <Dashboard /> : null}
          {activeView === 'inventory' ? <Inventory /> : null}
          {activeView === 'suppliers' ? <Suppliers /> : null}
          {activeView === 'sales' ? <SalesNE /> : null}
          {activeView === 'purchases' ? <Purchases /> : null}
          {activeView === 'sync' ? <SyncLogs /> : null}
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