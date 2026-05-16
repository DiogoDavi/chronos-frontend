import React, { useState, useRef, useEffect } from 'react';
import { Truck, User, TriangleAlert, Package, MoreVertical, Clock, LayoutGrid, Plus } from 'lucide-react';
import { Vehicle, Priority } from '../types/logistics';
import { formatTime } from '../utils/format';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../services/supabase';

interface VehicleCardProps {
  vehicle: Vehicle;
  isOperating: boolean;
  hasPriority: boolean;
  theme: 'dark' | 'light';
  goal?: number;
  onRefresh?: () => void;
  index: number;
}

export const VehicleCard: React.FC<VehicleCardProps> = React.memo(({
  vehicle,
  isOperating,
  hasPriority,
  theme,
  goal = 0,
  index
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dockInput, setDockInput] = useState(vehicle.dock || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const updateVehicle = async (updates: Partial<Vehicle>) => {
    try {
      const { error } = await supabase
        .from('romaneios')
        .update(updates)
        .eq('id', vehicle.id);

      if (error) throw error;
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Error updating vehicle:', err);
    }
  };

  const getTimeValue = () => {
    if (vehicle.status === 'Aguardando Liberação') return vehicle.tmp_liberacao_min;
    if (vehicle.status === 'Aguardando Doca') return vehicle.tmp_doca_min;
    if (vehicle.status === 'Em Doca') return vehicle.tmp_em_doca_min;
    return vehicle.tmp_total_min;
  };

  const timeValue = getTimeValue();
  const isAtrasado = goal > 0 && timeValue > goal;

  const PRIORITY_COLORS: Record<string, string> = {
    'Alta': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Média': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Baixa': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Normal': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  return (
    <div className={`
      flex flex-col px-3.5 py-2 rounded-[16px] border transition-all duration-300 relative group
      ${theme === 'dark'
        ? 'bg-[#18181B] border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-[#1C1C21]'
        : 'bg-white border-zinc-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]'}
      hover:-translate-y-1 hover:z-[9999] ${isMenuOpen ? 'z-[9999]' : 'z-10'} cursor-default
    `}>
      {/* Priority Tag (Top Right) */}
      {hasPriority && vehicle.status !== 'Concluído/Saída' && (
        <div className="absolute -top-3 right-8 z-[60]">
          <div className="animate-bounce bg-[#5B47FB] text-white text-[9px] font-black px-2 py-1.2 rounded-full shadow-lg shadow-indigo-500/10 border border-white/30 uppercase tracking-widest">
            Prioritário
          </div>
        </div>
      )}

      {/* Top Header Card Info */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${theme === 'dark' ? 'bg-zinc-800 text-zinc-500' : 'bg-[#F2F2F4] text-zinc-400'}`}>
            {String(index).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-zinc-400" />
            <h4 className={`text-[13px] font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-[#1A1A1E]'}`}>
              {vehicle.plate}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative">
          {isAtrasado && (
            <div className="relative group/tooltip">
              <TriangleAlert className="w-4 h-4 text-red-500 cursor-help" />
              <div className="absolute top-full right-0 mt-3 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 z-[100] -translate-y-2 group-hover/tooltip:translate-y-0">
                <div className="relative">
                  <div className="absolute -top-1 right-2 w-2.5 h-2.5 bg-[#33333B] rotate-45 border-l border-t border-white/10" />
                  <div className="bg-[#33333B] text-white text-[9px] md:text-xs font-bold px-3 py-2 rounded-lg shadow-2xl border border-white/10 flex items-center gap-1.5 relative z-10">
                    Acima da meta configurada • {goal}min
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="relative group/priority">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm cursor-help transition-all duration-300 ${vehicle.priority === 'Alta' ? 'bg-red-500 shadow-red-500/30' :
              vehicle.priority === 'Média' ? 'bg-amber-500 shadow-amber-500/30' :
                vehicle.priority === 'Baixa' ? 'bg-emerald-500 shadow-emerald-500/30' :
                  'bg-blue-500 shadow-blue-500/30'
              } group-hover/priority:scale-110`} />
            <div className="absolute top-full right-0 mt-3 whitespace-nowrap opacity-0 group-hover/priority:opacity-100 pointer-events-none transition-all duration-200 z-[100] -translate-y-2 group-hover/priority:translate-y-0">
              <div className="relative">
                <div className="absolute -top-1 right-2 w-2.5 h-2.5 bg-[#33333B] rotate-45 border-l border-t border-white/10" />
                <div className="bg-[#33333B] text-white text-[9px] md:text-xs font-bold px-3 py-2 rounded-lg shadow-2xl border border-white/10 flex items-center gap-1.5 relative z-10">
                  Prioridade {vehicle.priority?.toUpperCase() || 'NORMAL'}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1 rounded-md transition-colors ${isMenuOpen ? (theme === 'dark' ? 'bg-white/10' : 'bg-black/5') : 'hover:bg-black/5'}`}
          >
            <MoreVertical className="w-4 h-4 text-zinc-400 cursor-pointer" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                style={{ zIndex: 120 }}
                className={`absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-4 border overflow-hidden backdrop-blur-md ${theme === 'dark' ? 'bg-[#1C1C21]/95 border-white/10' : 'bg-white/95 border-zinc-100'
                  }`}
              >
                {/* Definir Doca Section */}
                <div className="space-y-3 mb-6">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Definir Doca</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dockInput}
                      onChange={(e) => setDockInput(e.target.value)}
                      placeholder="Doca"
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                        }`}
                    />
                    <button
                      onClick={() => updateVehicle({ dock: dockInput })}
                      className="w-10 h-10 flex items-center justify-center bg-[#5B47FB] hover:bg-[#4A38E0] text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Prioridade Section */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1 mb-2 block">Prioridade</span>
                  {(['Alta', 'Média', 'Baixa', 'Normal'] as Priority[]).map((p) => {
                    const isActive = vehicle.priority === p;
                    const colors: Record<Priority, string> = {
                      'Alta': 'bg-red-500',
                      'Média': 'bg-amber-500',
                      'Baixa': 'bg-emerald-500',
                      'Normal': 'bg-blue-500'
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => updateVehicle({ priority: p })}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                          ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900')
                          : (theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-zinc-50')
                          }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[p]}`} />
                        {p}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Rows */}
      <div className="flex justify-between items-center mb-1">
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-2.5">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-[#7C7C8C]'}`}>
              {vehicle.driver}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-[#7C7C8C]'}`}>
              {vehicle.carrier}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Package className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-[#7C7C8C]'}`}>
              {(vehicle as any).material || (vehicle as any).MATERIAL || '---'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {vehicle.status === 'Concluído/Saída' ? (
            <div className="flex flex-col items-end gap-1.5">
              <div className={`flex flex-col items-end opacity-60 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="text-[7px] font-black uppercase tracking-widest mb-[1px]">Created at</span>
                <span className={`text-[9px] font-bold tracking-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {(vehicle.created_at || vehicle.ts_inicial) ? new Date(vehicle.created_at || vehicle.ts_inicial).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).replace(',', '') : '---'}
                </span>
              </div>
              <div className={`flex flex-col items-end ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="text-[7px] font-black uppercase tracking-widest mb-[1px]">Closed at</span>
                <span className={`text-[10px] font-black tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-[#1A1A1E]'}`}>
                  {vehicle.ts_saida ? (
                    new Date(vehicle.ts_saida).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', '')
                  ) : '---'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1.5">
              <div className={`flex flex-col items-end opacity-60 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <span className="text-[7px] font-black uppercase tracking-widest mb-[1px]">Created at</span>
                <span className={`text-[9px] font-bold tracking-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {(vehicle.created_at || vehicle.ts_inicial) ? new Date(vehicle.created_at || vehicle.ts_inicial).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).replace(',', '') : '---'}
                </span>
              </div>
              {isOperating && (
                <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Operando
                  </span>
                </div>
              )}
              {!isOperating && (
                <div className="bg-[#FFFCE8] border border-[#F5E8C4] gap-1.5 flex items-center justify-center px-2.5 py-1.5 rounded-3xl">
                  <span className="text-[9px] font-black text-[#A67C00] tracking-wider uppercase">Pausado</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Status Bar */}
      <div className={`h-[5px] w-full rounded-full overflow-hidden mb-3 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        <div
          className={`h-full transition-all duration-500 ${(goal > 0 && timeValue >= goal) ? 'bg-red-500' :
            (goal > 0 && (timeValue / goal) * 100 > 75) ? 'bg-orange-500' :
              'bg-emerald-500'
            }`}
          style={{ width: `${goal > 0 ? Math.min((timeValue / goal) * 100, 100) : 0}%` }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className={`text-[13px] font-black tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-[#1A1A1E]'}`}>
            {formatTime(timeValue)}
          </span>
        </div>
        <span className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-600' : 'text-[#B0B0C0]'}`}>
          DOCA {vehicle.dock || '---'}
        </span>
      </div>
    </div>
  );
});
