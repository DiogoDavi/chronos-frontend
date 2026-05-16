import React from 'react';
import { LayoutDashboard, Truck, Settings, LayoutGrid, Pin, Filter, User, LogOut, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isCollapsed }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} h-12 rounded-xl transition-all group relative ${active ? 'bg-white/[0.08] text-white shadow-sm' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-100' : 'group-hover:scale-105'} flex-shrink-0`}>
        {icon}
      </div>
      {!isCollapsed && (
        <span className={`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden ${active ? 'text-zinc-100' : 'text-zinc-400'}`}>{label}</span>
      )}
    </button>
  );
};

interface SidebarProps {
  isSidebarPinned: boolean;
  setIsSidebarPinned: (v: boolean) => void;
  isSidebarHovered: boolean;
  setIsSidebarHovered: (v: boolean) => void;
  activePage: string;
  setActivePage: (p: any) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (v: boolean) => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarPinned,
  setIsSidebarPinned,
  isSidebarHovered,
  setIsSidebarHovered,
  activePage,
  setActivePage,
  isFiltersOpen,
  setIsFiltersOpen,
  children
}) => {
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

  return (
    <aside
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
      className={`${isSidebarExpanded ? 'w-64' : 'w-16'} h-screen border-r border-black/10 flex flex-col bg-[#0F0F11] text-zinc-100 flex-shrink-0 transition-all duration-300 ease-in-out relative z-[100]`}
    >
      <div className={`p-4 flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} h-24 relative`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#a20014] flex items-center justify-center shadow-lg shadow-[#a20014]/20 flex-shrink-0">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          {isSidebarExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap group relative cursor-default">

              <h1 className="font-bold text-base tracking-tight leading-none text-white">
                Chronos
              </h1>

              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black mt-1.5 block">
                Logística * TMP
              </span>

              {/* Tooltip elegante */}
              <div className="
      absolute left-0 top-full mt-3
      opacity-0 invisible
      group-hover:opacity-100 group-hover:visible
      transition-all duration-300
      translate-y-1 group-hover:translate-y-0
      z-50
    ">
                <div className="
        relative
        px-4 py-2.5
        rounded-2xl
        bg-zinc-900/95
        border border-zinc-800
        shadow-2xl shadow-black/40
        backdrop-blur-md
      ">
                  <span className="
          text-[11px]
          text-zinc-300
          tracking-wide
          font-medium
          whitespace-nowrap
        ">
                    Tempo Médio Permanência
                  </span>

                  {/* seta tooltip */}
                  <div className="
          absolute -top-1 left-6
          w-2 h-2
          bg-zinc-900
          border-l border-t border-zinc-800
          rotate-45
        " />
                </div>
              </div>

            </div>
          )}
        </div>
        {isSidebarExpanded && (
          <button
            onClick={() => setIsSidebarPinned(!isSidebarPinned)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isSidebarPinned ? 'text-white bg-[#a20014] shadow-lg shadow-red-900/40' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <Pin size={14} className={isSidebarPinned ? 'rotate-45' : ''} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-6 overflow-x-hidden">
        <NavItem
          icon={<LayoutDashboard className="w-4 h-4" />}
          label="Dashboard"
          active={activePage === 'dashboard'}
          onClick={() => setActivePage('dashboard')}
          isCollapsed={!isSidebarExpanded}
        />
        <NavItem icon={<Truck className="w-4 h-4" />} label="Veículos" isCollapsed={!isSidebarExpanded} />
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Configurações"
          active={activePage === 'configuracoes'}
          onClick={() => setActivePage('configuracoes')}
          isCollapsed={!isSidebarExpanded}
        />
        <NavItem
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Detalhamento"
          active={activePage === 'detalhamento'}
          onClick={() => setActivePage('detalhamento')}
          isCollapsed={!isSidebarExpanded}
        />

        <div className="mt-2">
          <button
            onClick={() => isSidebarExpanded && setIsFiltersOpen(!isFiltersOpen)}
            className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-4' : 'justify-center'} h-12 rounded-xl hover:bg-white/5 transition-all group`}
          >
            <div className="flex items-center">
              <Filter className={`w-4 h-4 transition-colors ${isSidebarExpanded ? 'mr-3' : ''} ${isFiltersOpen ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-100'}`} />
              {isSidebarExpanded && <span className={`text-sm font-medium transition-colors ${isFiltersOpen ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-100'}`}>Filtros</span>}
            </div>
            {isSidebarExpanded && <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />}
          </button>

          <AnimatePresence>
            {isFiltersOpen && isSidebarExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <div className="p-4 mt-auto">
        <div className={`flex items-center ${isSidebarExpanded ? 'gap-4 px-4 py-3' : 'justify-center p-0'} rounded-2xl hover:bg-white/5 transition-all cursor-pointer group`}>
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-zinc-300" />
          </div>
          {isSidebarExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Operador 01</p>
              <p className="text-[11px] text-zinc-500 font-medium truncate">Turno A</p>
            </div>
          )}
          {isSidebarExpanded && <LogOut className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />}
        </div>
      </div>
    </aside>
  );
};
