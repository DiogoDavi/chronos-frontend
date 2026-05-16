// import React from 'react';
// import { Search, Clock, ChevronRight, RefreshCw, Bell, Settings, X } from 'lucide-react';

// interface HeaderProps {
//   theme: 'dark' | 'light';
//   searchInput: string;
//   setSearchInput: (s: string) => void;
//   isLoading: boolean;
//   onRefresh: () => void;
//   setActivePage: (p: any) => void;
//   secondsSinceRefresh: number;
//   refreshInterval: number;
// }

// export const Header: React.FC<HeaderProps> = ({
//   theme,
//   searchInput,
//   setSearchInput,
//   isLoading,
//   onRefresh,
//   setActivePage,
//   secondsSinceRefresh,
//   refreshInterval
// }) => {
//   return (
//     <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-black/10 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F0F11]' : 'bg-[#EEECE9]'
//       }`}>
//       <div className="flex flex-col">
//         <div className="hidden md:flex items-center gap-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
//           <span>Logística</span>
//           <ChevronRight className="w-3 h-3" />
//           <span className="text-zinc-400">Painel</span>
//         </div>
//         <h2 className={`text-sm md:text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
//           Painel <span className="hidden sm:inline">de Operações</span>
//         </h2>
//       </div>

//       <div className="flex-1 max-w-xs md:max-w-md mx-4 md:mx-8">
//         <div className="relative group">
//           <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
//           <input
//             type="text"
//             placeholder="Buscar placa ou motorista..."
//             value={searchInput}
//             onChange={(e) => setSearchInput(e.target.value)}
//             className={`w-full pl-9 md:pl-11 pr-10 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm transition-all border outline-none ${theme === 'dark'
//               ? 'bg-white/5 border-white/10 text-white focus:border-red-500/50 focus:bg-white/10 focus:ring-4 focus:ring-red-500/10'
//               : 'bg-white border-zinc-300 text-zinc-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/5'
//               }`}
//           />
//           {searchInput && (
//             <button
//               onClick={() => setSearchInput('')}
//               className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all animate-in fade-in zoom-in duration-300 ${
//                 theme === 'dark' ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-400 hover:text-zinc-900'
//               }`}
//             >
//               <X className="w-3.5 h-3.5" />
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="flex items-center gap-2 md:gap-6">
//         <div className="hidden lg:flex items-center gap-6">
//           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5F5EF] border border-[#CDECE0]">
//             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//             <span className="text-[11px] font-black text-[#1A8363] uppercase tracking-wider">Online</span>
//           </div>

//           <div className="flex items-center gap-3 text-zinc-400">
//             <div className="flex items-center gap-2">
//               <Clock className="w-4 h-4 text-zinc-400" />
//               <span className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-[#1A1A1E]'}`}>
//                 {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
//               </span>
//             </div>
//             <div className="w-1 h-1 rounded-full bg-zinc-300" />
//             <span className="text-[13px] font-medium text-zinc-500">
//               {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).replace('.', '')}
//             </span>
//           </div>

//           <div className="flex items-center border-l border-zinc-200 pl-6">
//             <span className="text-[11px] font-medium text-zinc-400">
//               Próxima atualização em: <span className="font-black text-indigo-500 ml-1">{Math.max(0, refreshInterval - secondsSinceRefresh)}s</span>
//             </span>
//           </div>
//         </div>

//         <div className="flex items-center gap-1 md:border-l border-zinc-300 md:pl-4">
//           <button
//             onClick={onRefresh}
//             className={`p-1.5 md:p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
//           >
//             <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
//           </button>
//           <button className={`p-1.5 md:p-2 relative rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}>
//             <Bell className="w-4 h-4 md:w-5 md:h-5" />
//             <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border-2 border-[#EEECE9]" />
//           </button>
//           <button
//             onClick={() => setActivePage('configuracoes')}
//             className={`p-1.5 md:p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
//           >
//             <Settings className="w-4 h-4 md:w-5 md:h-5" />
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// };

import React from 'react';
import { Search, Clock, ChevronRight, RefreshCw, Bell, Settings, X } from 'lucide-react';
import { SessionStatus } from './SessionStatus';

interface HeaderProps {
  theme: 'dark' | 'light';
  searchInput: string;
  setSearchInput: (s: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  setActivePage: (p: any) => void;
  secondsSinceRefresh: number;
  refreshInterval: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  searchInput,
  setSearchInput,
  isLoading,
  onRefresh,
  setActivePage,
  secondsSinceRefresh,
  refreshInterval
}) => {
  return (
    <header className={`h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-black/10 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F0F11]' : 'bg-[#EEECE9]'
      }`}>

      {/* Título */}
      <div className="flex flex-col">
        <div className="hidden md:flex items-center gap-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          <span>Logística</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-400">Painel</span>
        </div>
        <h2 className={`text-sm md:text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Painel <span className="hidden sm:inline">de Operações</span>
        </h2>
      </div>

      {/* Busca */}
      <div className="flex-1 max-w-xs md:max-w-md mx-4 md:mx-8">
        <div className="relative group">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar placa ou motorista..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`w-full pl-9 md:pl-11 pr-10 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm transition-all border outline-none ${theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white focus:border-red-500/50 focus:bg-white/10 focus:ring-4 focus:ring-red-500/10'
                : 'bg-white border-zinc-300 text-zinc-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/5'
              }`}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-400 hover:text-zinc-900'
                }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden lg:flex items-center gap-4">

          {/* Sync Status — Sync OK (verde) ou Sync Offline + Reconectar */}
          <SessionStatus theme={theme} />

          {/* Hora e data */}
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-[#1A1A1E]'}`}>
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
              </span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[13px] font-medium text-zinc-500">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo'
              }).replace('.', '')}
            </span>
          </div>

          {/* Próxima atualização */}
          <div className="flex items-center border-l border-zinc-200 pl-4">
            <span className="text-[11px] font-medium text-zinc-400">
              Próxima atualização em: <span className="font-black text-indigo-500 ml-1">{Math.max(0, refreshInterval - secondsSinceRefresh)}s</span>
            </span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-1 md:border-l border-zinc-300 md:pl-4">
          <button
            onClick={onRefresh}
            className={`p-1.5 md:p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className={`p-1.5 md:p-2 relative rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
            }`}>
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full border-2 border-[#EEECE9]" />
          </button>
          <button
            onClick={() => setActivePage('configuracoes')}
            className={`p-1.5 md:p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
