import React from 'react';
import { Status, Unit, DashboardMetrics, Vehicle } from '../types/logistics';
import { StatusColumn } from '../components/StatusColumn';
import { AlertCircle, TriangleAlert, Clock } from 'lucide-react';
import { formatTime } from '../utils/format';

interface MetricChipProps {
  label: string;
  value: string;
  theme: 'dark' | 'light';
}

function MetricChip({ label, value, theme }: MetricChipProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-1 rounded-lg border border-black/10 transition-all ${theme === 'dark'
      ? 'bg-white/5 text-zinc-400'
      : 'bg-white text-zinc-600 shadow-sm'
      }`}>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3 text-zinc-400" />
        <span className="text-[10px] xl:text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-[14px] font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{value}</span>
    </div>
  );
}

interface DashboardProps {
  metrics: DashboardMetrics;
  theme: 'dark' | 'light';
  quickFilters: any;
  setQuickFilters: (f: any) => void;
  kanbanData: Record<Status, Vehicle[]>;
  kanbanTotals: Record<Status, number>;
  filters: any;
  premises: any;
  isUnitOperating: (unit: Unit) => boolean;
  hasPremisesPriority: (v: Vehicle) => boolean;
  fetchRawData: (s: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  theme,
  quickFilters,
  setQuickFilters,
  kanbanData,
  kanbanTotals,
  filters,
  premises,
  isUnitOperating,
  hasPremisesPriority,
  fetchRawData
}) => {
  const columns: Status[] = ['Aguardando Liberação', 'Aguardando Doca', 'Em Doca', 'Concluído/Saída'];

  return (
    <div className={`flex-1 overflow-hidden flex flex-col pt-0 px-3 pb-0 transition-colors duration-300`}>
      <div className="flex flex-wrap items-center justify-between py-2 xl:py-3 gap-3">
        <div className="flex flex-wrap items-center gap-2 xl:gap-3">
          <MetricChip label="Média Aguard. liberação" value={formatTime(metrics?.avg_tmp_liberacao || 0)} theme={theme} />
          <MetricChip label="Média Aguard. doca" value={formatTime(metrics?.avg_tmp_doca || 0)} theme={theme} />
          <MetricChip label="Média Em doca" value={formatTime(metrics?.avg_tmp_em_doca || 0)} theme={theme} />
        </div>

        <div className="flex items-center gap-2 xl:gap-3">
          <button
            onClick={() => setQuickFilters((prev: any) => ({ ...prev, atrasadas: !prev.atrasadas }))}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-[10px] md:text-xs font-bold transition-all ${quickFilters.atrasadas
              ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20'
              : theme === 'dark'
                ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                : 'bg-white border-red-200 text-red-600 shadow-sm hover:bg-red-50'
              }`}>
            <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Atrasadas</span>
          </button>
          <button
            onClick={() => setQuickFilters((prev: any) => ({ ...prev, prioritarios: !prev.prioritarios }))}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-[10px] md:text-xs font-bold transition-all ${quickFilters.prioritarios
              ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20'
              : theme === 'dark'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                : 'bg-white border-amber-200 text-amber-600 shadow-sm hover:bg-amber-50'
              }`}>
            <TriangleAlert className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Prioritários</span>
          </button>
        </div>
      </div>

      <div className="grid gap-2 md:gap-2.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 h-full w-full max-w-[2200px] mx-auto overflow-y-auto pb-0 scrollbar-hide">
        {columns.map(column => {
          let goal = 0;
          if (filters.unit.length === 1) {
            const unit = filters.unit[0] as Unit;
            const config = premises[unit];
            if (config) {
              if (column === 'Aguardando Liberação') goal = config.meta_aguardando_liberacao || 0;
              else if (column === 'Aguardando Doca') goal = config.meta_aguardando_doca || 0;
              else if (column === 'Em Doca') goal = config.meta_em_doca || 0;
              else if (column === 'Concluído/Saída') goal = config.meta_concluido_saida || 0;
            }
          }

          return (
            <StatusColumn
              key={column}
              column={column}
              vehicles={kanbanData[column]}
              totalCount={kanbanTotals[column]}
              theme={theme}
              isUnitOperating={isUnitOperating}
              hasPremisesPriority={hasPremisesPriority}
              goal={goal}
              onRefresh={() => fetchRawData(true)}
            />
          );
        })}
      </div>
    </div>
  );
};
