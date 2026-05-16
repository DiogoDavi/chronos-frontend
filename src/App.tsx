import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useRomaneios } from './hooks/useRomaneios';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { Dashboard } from './pages/Dashboard';
import { Table } from './components/Table';
import { Configurator } from './components/Configurator';
import { isUnitOperating, hasPremisesPriority, getFormattedOperatingDays, getOperatingHours, getBrazilTime } from './utils/logistics';
import { Unit, UnitPremises } from './types/logistics';
import { Monitor, X } from 'lucide-react';
import { formatTime } from './utils/format';
import { usePremisesStore } from './store/usePremisesStore';

export default function App() {
  const [activePage, setActivePage] = useState<'dashboard' | 'detalhamento' | 'configuracoes'>(() =>
    (localStorage.getItem('dashboard_active_page') as any) || 'dashboard'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('dashboard_theme') as any) || 'light'
  );
  const [isSidebarPinned, setIsSidebarPinned] = useState(() =>
    localStorage.getItem('sidebar_pinned') === 'true'
  );
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  const {
    kanbanData,
    kanbanTotals,
    metrics,
    filteredData,
    availableFilters,
    isLoading,
    lastRefresh,
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    quickFilters,
    setQuickFilters,
    fetchRawData,
    totalRecords
  } = useRomaneios();

  const { premises, isInitialLoaded, isLoading: isPremisesLoading, error: premisesError } = usePremisesStore();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);

  // Auto Refresh Logic
  const currentUnit = (filters.unit && filters.unit[0]) as Unit || 'JPA';
  const refreshInterval = premises[currentUnit]?.refresh_seconds || 120;

  useEffect(() => {
    if (secondsSinceRefresh >= refreshInterval && !isLoading) {
      fetchRawData(true);
    }
  }, [secondsSinceRefresh, refreshInterval, isLoading, fetchRawData]);

  useEffect(() => {
    localStorage.setItem('dashboard_active_page', activePage);
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem('dashboard_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebar_pinned', String(isSidebarPinned));
  }, [isSidebarPinned]);

  useEffect(() => {
    usePremisesStore.getState().fetchPremises();
  }, []);

  // Restrição de acesso: Apenas Desktop >= 13" (aprox. 1280px)
  const isUnsupported = windowWidth < 1280;

  if (isUnsupported) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center p-8 text-center ${theme === 'dark' ? 'bg-[#0A0A0B]' : 'bg-zinc-50'}`}>
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
          <Monitor className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
          Acesso Restrito
        </h1>
        <p className="text-zinc-500 max-w-md text-sm leading-relaxed">
          Sistema disponível apenas para visualização em desktop.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const downloadXlsx = () => {
    const dataToExport = [...filteredData].sort((a, b) => {
      const timeA = a.ts_saida ? new Date(a.ts_saida).getTime() : 0;
      const timeB = b.ts_saida ? new Date(b.ts_saida).getTime() : 0;
      return timeA - timeB;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(v => ({
      'Placa': v.plate,
      'Transportador': v.carrier,
      'Material': (v as any).material || (v as any).MATERIAL || '-',
      'Motorista': v.driver,
      'Status': v.status,
      'Doca': v.dock || '-',
      'TMP Total': formatTime(v.tmp_total_min),
      'Prioridade': v.priority,
      'Entrada': v.ts_inicial ? new Date(v.ts_inicial).toLocaleString('pt-BR') : '-',
      'Romaneio': v.ts_romaneio ? new Date(v.ts_romaneio).toLocaleString('pt-BR') : '-',
      'Carga/Descarga': v.ts_entrada ? new Date(v.ts_entrada).toLocaleString('pt-BR') : '-',
      'Atendimento': (() => {
        const days = getFormattedOperatingDays(v.unit as Unit, premises);
        const hours = getOperatingHours(v.unit as Unit, getBrazilTime(), premises);
        return `${days} (${hours.start}-${hours.end})`;
      })(),
      'Saída': v.ts_saida ? new Date(v.ts_saida).toLocaleString('pt-BR') : '-'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Romaneios");
    XLSX.writeFile(workbook, `historico_detalhado_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#0A0A0B] text-zinc-100' : 'bg-zinc-50 text-zinc-900 theme-light'} font-sans transition-colors duration-300 overflow-hidden`}>
      <Sidebar
        isSidebarPinned={isSidebarPinned}
        setIsSidebarPinned={setIsSidebarPinned}
        isSidebarHovered={isSidebarHovered}
        setIsSidebarHovered={setIsSidebarHovered}
        activePage={activePage}
        setActivePage={setActivePage}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
      >
        <Filters
          filters={filters}
          setFilters={setFilters}
          availableFilters={availableFilters}
          setSearchInput={setSearchInput}
          setQuickFilters={setQuickFilters}
        />
      </Sidebar>

      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${theme === 'dark' ? 'bg-[#0A0A0B]' : 'bg-[#EEECE9]'}`}>
        <Header
          theme={theme}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          isLoading={isLoading}
          onRefresh={() => fetchRawData(false, true)}
          setActivePage={setActivePage}
          secondsSinceRefresh={secondsSinceRefresh}
          refreshInterval={refreshInterval}
        />

        <div className={activePage === 'dashboard' ? 'flex-1 overflow-hidden flex flex-col' : 'hidden'}>
          <Dashboard
            metrics={metrics}
            theme={theme}
            quickFilters={quickFilters}
            setQuickFilters={setQuickFilters}
            kanbanData={kanbanData}
            kanbanTotals={kanbanTotals}
            filters={filters}
            premises={premises}
            isUnitOperating={(u) => isUnitOperating(u, premises)}
            hasPremisesPriority={(v) => hasPremisesPriority(v, premises)}
            fetchRawData={fetchRawData}
          />
        </div>

        <div className={activePage === 'detalhamento' ? 'flex-1 overflow-hidden flex flex-col' : 'hidden'}>
          <Table
            theme={theme}
            detailedTable={filteredData}
            downloadXlsx={downloadXlsx}
            onRefresh={() => fetchRawData(false, true)}
            isLoading={isLoading}
            getAtendimentoFormatado={(u) => {
              const days = getFormattedOperatingDays(u, premises);
              const hours = getOperatingHours(u, getBrazilTime(), premises);
              return `${days} (${hours.start}-${hours.end})`;
            }}
            totalRecords={totalRecords}
          />
        </div>

        <div className={activePage === 'configuracoes' ? 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300' : 'hidden'} style={{ backgroundColor: theme === 'dark' ? '#0A0A0B' : '#F9FAFB' }}>
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Configurações de Premissas</h2>
              <p className="text-zinc-500 text-sm mt-1">Defina as regras de operação e prioridade por unidade.</p>
            </div>
            <Configurator theme={theme} />
          </div>
        </div>

        {!isInitialLoaded && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 max-w-sm text-center">
              {premisesError ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-red-500 text-xs font-bold uppercase tracking-widest">Erro de Sincronização</p>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">{premisesError}</p>
                  </div>
                  <button
                    onClick={() => usePremisesStore.getState().fetchPremises()}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-xl transition-all border border-white/5"
                  >
                    Tentar Novamente
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando Sistema</p>
                </>
              )}
            </div>
          </div>
        )}

        <footer className={`py-2 text-center border-t ${theme === 'dark' ? 'border-white/5 text-zinc-600' : 'border-zinc-200 text-zinc-400'}`}>
          <p className="text-[9px] font-medium tracking-widest ">
            Chronos Logística @2026 - Todos os direitos reservados
          </p>
        </footer>
      </main>
    </div>
  );
}
