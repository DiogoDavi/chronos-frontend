import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, Clock, Truck, CheckCircle2, ChevronUp, ChevronDown, ListFilter, Calendar } from 'lucide-react';
import { Status, Vehicle, Unit } from '../types/logistics';
import { formatTime, getTMPColor } from '../utils/format';
import { VehicleCard } from './VehicleCard';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Aguardando Liberação': <AlertCircle className="w-5 h-5 text-amber-500" />,
  'Aguardando Doca': <Clock className="w-5 h-5 text-blue-500" />,
  'Em Doca': <Truck className="w-5 h-5 text-emerald-500" />,
  'Concluído/Saída': <CheckCircle2 className="w-5 h-5 text-zinc-400" />
};

interface StatusColumnProps {
  column: Status;
  vehicles: Vehicle[];
  totalCount?: number;
  theme: 'dark' | 'light';
  isUnitOperating: (unit: Unit) => boolean;
  hasPremisesPriority: (v: Vehicle) => boolean;
  goal?: number;
  onRefresh?: () => void;
}

export const StatusColumn: React.FC<StatusColumnProps> = ({
  column,
  vehicles,
  totalCount,
  theme,
  isUnitOperating,
  hasPremisesPriority,
  goal = 0,
  onRefresh
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const [sortBy, setSortBy] = useState<'tmp' | 'entrada' | 'saida'>('tmp');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortMenuOpen]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const canScrollDown = scrollHeight > clientHeight + 5;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowArrow(canScrollDown);
      setIsAtBottom(atBottom);
    }
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    return () => clearTimeout(timer);
  }, [vehicles]);

  const avgTMP = vehicles.length > 0
    ? vehicles.reduce((acc, v) => {
      if (column === 'Aguardando Liberação') return acc + (v.tmp_liberacao_min || 0);
      if (column === 'Aguardando Doca') return acc + (v.tmp_doca_min || 0);
      if (column === 'Em Doca') return acc + (v.tmp_em_doca_min || 0);
      return acc + (v.tmp_total_min || 0);
    }, 0) / vehicles.length
    : 0;

  return (
    <div className={`flex flex-col h-full overflow-hidden relative rounded-[24px] transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F0F11]' : 'bg-[#F2F2F4]'}`}>
      <div className={`flex-shrink-0 px-5 pt-4 pb-2`}>
        {/* Row 1: Alert Icon + Badge */}
        <div className="flex items-center justify-between mb-1.5">
          {vehicles.some(v => v.tmp_liberacao_min > (goal || 0)) ? (
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          )}
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400 shadow-sm border border-zinc-100'}`}>
            {column === 'Concluído/Saída' && totalCount !== undefined && totalCount > vehicles.length
              ? `${vehicles.length} / ${totalCount}`
              : vehicles.length}
          </div>
        </div>

        {/* Row 2 & 3: Tempo Principal e Stage Médio (lado a lado) */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`text-[22px] md:text-[20px] font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-[#1A1A1E]'}`}>
            {formatTime(avgTMP)}
          </div>

          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-10 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-[#E5E5E9]'}`}>
              <div
                className={`h-full transition-all duration-700 ${avgTMP > (goal || 120) ? 'bg-red-500' : 'bg-[#6366F1]'}`}
                style={{ width: `${Math.min((avgTMP / (goal || 120)) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Stage médio</span>
          </div>
        </div>

        {/* Row 4: Status Uppercase & Sort Menu */}
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-[12px] uppercase tracking-[0.1em]  ${theme === 'dark' ? 'text-zinc-300' : 'text-[#7C7C8C]'}`}>
            {column}
          </h3>

          {column === 'Concluído/Saída' && (
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${isSortMenuOpen
                  ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                  : (theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-800 hover:bg-black/5 hover:text-zinc-700')
                  }`}
                title="Classificar por"
              >
                <ListFilter className="w-4 h-4" />
              </button>

              {isSortMenuOpen && (
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] p-2 border z-50 overflow-hidden ${theme === 'dark' ? 'bg-[#1C1C21] border-white/10' : 'bg-white border-zinc-100'
                  }`}>
                  <div className="px-2 py-1.5 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Classificar por
                    </span>
                  </div>

                  <button
                    onClick={() => { setSortBy('entrada'); setIsSortMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'entrada'
                      ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900')
                      : (theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800')
                      }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Data Entrada
                  </button>

                  <button
                    onClick={() => { setSortBy('saida'); setIsSortMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'saida'
                      ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900')
                      : (theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800')
                      }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Data Saída
                  </button>

                  <button
                    onClick={() => { setSortBy('tmp'); setIsSortMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'tmp'
                      ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900')
                      : (theme === 'dark' ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800')
                      }`}
                  >
                    <Clock className="w-4 h-4" />
                    Tempo Total (TMP)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle List */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex-1 flex flex-col gap-2 overflow-y-auto px-2 pt-3 pb-20 scrollbar-visible`}
      >
        {[...vehicles].sort((a, b) => {
          if (column === 'Concluído/Saída') {
            if (sortBy === 'entrada') {
              return new Date(b.ts_inicial || 0).getTime() - new Date(a.ts_inicial || 0).getTime();
            }
            if (sortBy === 'saida') {
              return new Date(b.ts_saida || 0).getTime() - new Date(a.ts_saida || 0).getTime();
            }
            // default: tmp
            return (b.tmp_total_min || 0) - (a.tmp_total_min || 0);
          }

          const priorityWeight: Record<string, number> = {
            'Alta': 100,
            'Média': 50,
            'NORMAL': 10,
            'Normal': 10,
            'Baixa': 1,
            '': 0
          };
          const weightA = priorityWeight[a.priority as string] || (hasPremisesPriority(a) ? 110 : 10);
          const weightB = priorityWeight[b.priority as string] || (hasPremisesPriority(b) ? 110 : 10);

          if (weightA !== weightB) return weightB - weightA;

          // Secondary sort: stay time (TMP) descending
          const tmpA = column === 'Aguardando Liberação' ? a.tmp_liberacao_min :
            column === 'Aguardando Doca' ? a.tmp_doca_min :
              column === 'Em Doca' ? a.tmp_em_doca_min : a.tmp_total_min;
          const tmpB = column === 'Aguardando Liberação' ? b.tmp_liberacao_min :
            column === 'Aguardando Doca' ? b.tmp_doca_min :
              column === 'Em Doca' ? b.tmp_em_doca_min : b.tmp_total_min;
          return tmpB - tmpA;
        }).map((vehicle, idx) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isOperating={isUnitOperating(vehicle.unit)}
            hasPriority={hasPremisesPriority(vehicle) || vehicle.priority === 'Alta'}
            theme={theme}
            goal={goal}
            onRefresh={onRefresh}
            index={idx + 1}
          />
        ))}
      </div>

      {showArrow && (
        <button
          onClick={isAtBottom ? scrollToTop : scrollToBottom}
          className={`absolute bottom-15 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          {isAtBottom ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6 animate-bounce" />}
        </button>
      )}
    </div>
  );
};
