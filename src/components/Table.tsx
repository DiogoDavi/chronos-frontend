import React from 'react';
import { LayoutGrid, Download } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { Vehicle, Unit } from '../types/logistics';
import { formatTime } from '../utils/format';

interface TableProps {
  theme: 'dark' | 'light';
  detailedTable: Vehicle[];
  downloadXlsx: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  getAtendimentoFormatado: (unit: Unit) => string;
  totalRecords?: number;
}

const Row = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: { sortedData: Vehicle[]; theme: 'dark' | 'light'; getAtendimentoFormatado: (unit: Unit) => string } }) => {
  const { sortedData, theme, getAtendimentoFormatado } = data;
  const vehicle = sortedData[index];
  if (!vehicle) return null;

  return (
    <div 
      style={style} 
      className={`flex items-center border-b transition-colors duration-200 ${
        theme === 'dark' ? 'border-white/5 hover:bg-white/[0.02]' : 'border-zinc-100 hover:bg-zinc-50'
      }`}
    >
      <div className={`flex-shrink-0 w-[150px] px-6 py-4 text-xs font-bold sticky left-0 z-10 uppercase ${theme === 'dark' ? 'bg-[#141417] text-white' : 'bg-white text-zinc-900'}`}>{vehicle.plate}</div>
      <div className="flex-shrink-0 w-[250px] px-6 py-4 text-xs text-zinc-400 uppercase truncate">{vehicle.carrier}</div>
      <div className="flex-shrink-0 w-[200px] px-6 py-4 text-xs text-zinc-400 uppercase truncate">{(vehicle as any).material || (vehicle as any).MATERIAL || '-'}</div>
      <div className="flex-shrink-0 w-[200px] px-6 py-4 text-xs text-zinc-400 uppercase truncate">{vehicle.driver}</div>
      <div className="flex-shrink-0 w-[150px] px-6 py-4 text-xs text-zinc-400 uppercase">{vehicle.status}</div>
      <div className="flex-shrink-0 w-[100px] px-6 py-4 text-xs text-zinc-400">{vehicle.dock || '-'}</div>
      <div className="flex-shrink-0 w-[120px] px-6 py-4 text-xs font-bold text-zinc-500 text-center">{formatTime(vehicle.tmp_total_min)}</div>
      <div className="flex-shrink-0 w-[120px] px-6 py-4 text-xs text-zinc-400">{vehicle.priority}</div>
      <div className="flex-shrink-0 w-[180px] px-6 py-4 text-xs text-zinc-900">{vehicle.ts_inicial ? new Date(vehicle.ts_inicial).toLocaleString('pt-BR') : '-'}</div>
      <div className="flex-shrink-0 w-[180px] px-6 py-4 text-xs text-zinc-400">{vehicle.ts_romaneio ? new Date(vehicle.ts_romaneio).toLocaleString('pt-BR') : '-'}</div>
      <div className="flex-shrink-0 w-[180px] px-6 py-4 text-xs text-zinc-400">{vehicle.ts_entrada ? new Date(vehicle.ts_entrada).toLocaleString('pt-BR') : '-'}</div>
      <div className="flex-shrink-0 w-[250px] px-6 py-4 text-xs text-zinc-900 whitespace-nowrap">{getAtendimentoFormatado(vehicle.unit as Unit)}</div>
      <div className="flex-shrink-0 w-[180px] px-6 py-4 text-xs text-zinc-400">{vehicle.ts_saida ? new Date(vehicle.ts_saida).toLocaleString('pt-BR') : '-'}</div>
    </div>
  );
});

export const Table: React.FC<TableProps> = ({
  theme,
  detailedTable,
  downloadXlsx,
  onRefresh,
  isLoading,
  getAtendimentoFormatado,
  totalRecords = 0
}) => {
  const [displayLimit, setDisplayLimit] = React.useState(500);

  const sortedData = React.useMemo(() => {
    const sorted = [...detailedTable].sort((a, b) => {
      const timeA = a.ts_saida ? new Date(a.ts_saida).getTime() : 0;
      const timeB = b.ts_saida ? new Date(b.ts_saida).getTime() : 0;
      return timeA - timeB; // Ascending: Most recent last (at bottom)
    });

    if (displayLimit === -1) return sorted;
    return sorted.slice(0, displayLimit);
  }, [detailedTable, displayLimit]);

  const itemData = React.useMemo(() => ({
    sortedData,
    theme,
    getAtendimentoFormatado
  }), [sortedData, theme, getAtendimentoFormatado]);

  const handleShowMore = () => {
    if (displayLimit === 500) setDisplayLimit(1000);
    else if (displayLimit === 1000) setDisplayLimit(2000);
    else if (displayLimit === 2000) setDisplayLimit(-1);
    else if (displayLimit === -1) setDisplayLimit(500);
  };

  const getButtonText = () => {
    if (displayLimit === 500) return 'Mostrar 1000 linhas';
    if (displayLimit === 1000) return 'Mostrar 2000 linhas';
    if (displayLimit === 2000) return 'Mostrar toda a base';
    if (displayLimit === -1) return 'Mostrar menos';
    return null;
  };

  return (
    <div className={`px-4 xl:px-6 py-6 xl:py-4 space-y-6 flex-1 overflow-y-auto scrollbar-visible
      ${theme === 'dark' ? 'bg-[#0A0A0B]' : 'bg-[linear-gradient(135deg,#f4f4f5_0%,#fafafa_40%,#e4e4e7_100%)]'}
      transition-colors duration-300`}
    >
      <div className={`${theme === 'dark' ? 'bg-[#141417]' : 'bg-white'} border border-black/10 rounded-lg w-full shadow-sm overflow-hidden flex flex-col`}>
        <div className={`p-4 border-b border-black/20 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <LayoutGrid className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className={`text-sm font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Histórico Detalhado — Todos os Romaneios
            </h3>
          </div>
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase">Sincronizando base...</span>
              </div>
            )}
            
            {(displayLimit !== -1 || detailedTable.length > 500) && (
              <button
                onClick={handleShowMore}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  theme === 'dark' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' 
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                {getButtonText()}
              </button>
            )}

            <button
              onClick={() => {
                try {
                  downloadXlsx();
                } catch (err) {
                  console.error('Download error:', err);
                  alert('Erro ao gerar o arquivo Excel.');
                }
              }}
              title="Baixar Excel"
              className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>
                {sortedData.length} / {totalRecords} Registros
              </span>
              {displayLimit === -1 ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider">Base total carregada</span>
                </div>
              ) : (
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Visualização parcial</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto scrollbar-visible">
          <div className="min-w-[2260px]">
            {/* Header */}
            <div className={`flex items-center border-b sticky top-0 z-20 ${theme === 'dark' ? 'border-white/5 bg-[#141417]' : 'border-zinc-100 bg-white'}`}>
              <div className={`flex-shrink-0 w-[150px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest sticky left-0 z-30 ${theme === 'dark' ? 'bg-[#141417]' : 'bg-white'}`}>Placa</div>
              <div className="flex-shrink-0 w-[250px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transportador</div>
              <div className="flex-shrink-0 w-[200px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Material</div>
              <div className="flex-shrink-0 w-[200px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Motorista</div>
              <div className="flex-shrink-0 w-[150px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</div>
              <div className="flex-shrink-0 w-[100px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Doca</div>
              <div className="flex-shrink-0 w-[120px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">TMP Total</div>
              <div className="flex-shrink-0 w-[120px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Prioridade</div>
              <div className="flex-shrink-0 w-[180px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Entrada</div>
              <div className="flex-shrink-0 w-[180px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Romaneio</div>
              <div className="flex-shrink-0 w-[180px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Carga/Descarga</div>
              <div className="flex-shrink-0 w-[250px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Atendimento</div>
              <div className="flex-shrink-0 w-[180px] px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saída</div>
            </div>

            {/* Virtualized Body */}
            <List
              height={550} 
              itemCount={sortedData.length}
              itemSize={56}
              width={2260}
              className="scrollbar-visible"
              style={{ overflowX: 'hidden' }}
              itemData={itemData}
              itemKey={(index, data) => data.sortedData[index]?.id || index}
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
    </div>
  );
};
