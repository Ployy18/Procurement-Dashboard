import React from 'react';
import { LayoutDashboard, PieChart, TrendingUp, Settings, LogOut, Package } from 'lucide-react';
import { cn } from './KPICard';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Procurement Overview', icon: LayoutDashboard },
    { id: 'analysis', label: 'Category Analysis', icon: PieChart },
    { id: 'forecast', label: 'Forecast & Planning', icon: TrendingUp },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-20 hover:w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-50 transition-all duration-300 group overflow-hidden">
      <div className="p-6 flex items-center space-x-3 whitespace-nowrap">
        <div className="h-8 w-8 min-w-[2rem] rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <Package size={20} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">CCTV Procure</span>
      </div>

      <div className="flex-1 px-4 py-4 space-y-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              currentView === item.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <item.icon size={20} className={cn(
              "min-w-[20px] transition-colors",
              currentView === item.id ? "text-white" : "text-slate-500 group-hover/btn:text-slate-300"
            )} />
            <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.label}</span>
            {currentView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
