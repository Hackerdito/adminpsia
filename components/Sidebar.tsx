
import React from 'react';
import { LayoutDashboard, Users, PieChart, LogOut, FileText, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenSuperAdmin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, onOpenSuperAdmin }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'reports', label: 'Reportes', icon: FileText },
  ];

  return (
    <div className="w-20 lg:w-64 bg-white h-screen fixed left-0 top-0 border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-50">
      <div>
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-slate-100">
           <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <span className="text-white font-bold text-lg">P</span>
           </div>
           <span className="hidden lg:block ml-3 font-bold text-slate-800 text-xl tracking-tight">PSIA Admin</span>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={22} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`hidden lg:block ml-3 font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onOpenSuperAdmin}
          className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 border-dashed"
        >
          <ShieldAlert size={22} />
          <span className="hidden lg:block ml-3 font-medium">Zona Admin</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start px-3 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={22} />
          <span className="hidden lg:block ml-3 font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
