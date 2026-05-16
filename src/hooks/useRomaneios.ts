import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { romaneiosService } from '../services/romaneiosService';
import { Vehicle, DashboardFilters, Status, Unit, UnitPremises, DashboardMetrics } from '../types/logistics';
import { useDebounce } from './useDebounce';

const CACHE_KEY_DASH = 'romaneios_dash_cache_v4';
const CACHE_KEY_FILTERS = 'romaneios_filters_cache_v4';
const CACHE_KEY_PREMISES = 'romaneios_premises_cache_v4';
const CACHE_TTL = 1000 * 60 * 10;

function parsePostgresArray(arr: any): number[] {
  if (Array.isArray(arr)) return arr.map(Number);
  if (typeof arr === 'string') {
    return arr.replace('{', '').replace('}', '').split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
  }
  return [];
}

export function useRomaneios() {
  const [rawData, setRawData] = useState<Vehicle[]>([]);
  const [availableFilters, setAvailableFilters] = useState<DashboardFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('dashboard_filters');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      unit: ['JPA'] as string[],
      transportador: [] as string[],
      material: [] as string[],
      year: [] as string[],
      month: [] as string[],
      day: [] as string[],
      priority: [] as string[],
      area: [] as string[],
    };
  });

  const [searchInput, setSearchInput] = useState(() => localStorage.getItem('dashboard_search') || '');
  const debouncedSearchTerm = useDebounce(searchInput, 500);

  const [quickFilters, setQuickFilters] = useState(() => {
    const saved = localStorage.getItem('dashboard_quick_filters');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { atrasadas: false, prioritarios: false };
  });

  const [premises, setPremises] = useState<Record<string, UnitPremises>>(() => {
    const saved = localStorage.getItem(CACHE_KEY_PREMISES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          return parsed.data;
        }
      } catch (e) { console.error(e); }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('dashboard_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('dashboard_quick_filters', JSON.stringify(quickFilters));
  }, [quickFilters]);

  useEffect(() => {
    localStorage.setItem('dashboard_search', searchInput);
  }, [searchInput]);

  const fetchPremises = useCallback(async () => {
    try {
      const data = await romaneiosService.getPremises();
      const { premisesData, exceptionsData } = data;

      const newPremises: Record<string, UnitPremises> = {};
      premisesData.forEach((row: any) => {
        newPremises[row.unit] = {
          unit: row.unit as Unit,
          operatingDays: parsePostgresArray(row.operating_days),
          windows: row.windows || [{ id: '1', start: row.start_time || '08:00', end: row.end_time || '18:00' }],
          priorityPlates: Array.isArray(row.priority_plates) ? row.priority_plates : [],
          meta_aguardando_liberacao: parseIntervalToMinutes(row.meta_aguardando_liberacao) || 45,
          meta_aguardando_doca: parseIntervalToMinutes(row.meta_aguardando_doca) || 60,
          meta_em_doca: parseIntervalToMinutes(row.meta_em_doca) || 120,
          meta_concluido_saida: parseIntervalToMinutes(row.meta_concluido_saida) || 180,
          refresh_seconds: row.refresh_seconds || 120,
          exceptions: (exceptionsData || []).filter((e: any) => e.unit === row.unit)
        };
      });

      setPremises(newPremises);
      localStorage.setItem(CACHE_KEY_PREMISES, JSON.stringify({ timestamp: Date.now(), data: newPremises }));
    } catch (error) {
      console.error('Error fetching premises:', error);
    }
  }, []);

  const [totalRecords, setTotalRecords] = useState(0);
  const fetchIdRef = React.useRef(0);

  const fetchRawData = useCallback(async (silent = false, forceRefresh = false) => {
    const currentFetchId = ++fetchIdRef.current;
    if (!silent) setIsLoading(true);
    setLastRefresh(new Date());

    try {
      const isFiltered = Object.values(filters).some(f => Array.isArray(f) && f.length > 0);
      const dashCached = localStorage.getItem(CACHE_KEY_DASH);
      const now = Date.now();

      // For silent/background refresh, we might want to skip initial loading state
      // but the requirement is to fetch everything.

      // Initial batch
      const result = await romaneiosService.getDashboardData(filters, 0, 999);
      if (currentFetchId !== fetchIdRef.current) return;

      const initialData = result.data || [];
      const count = result.count || 0;

      let accumulatedData = [...initialData];

      // Se for a primeira carga (não tem dados), atualiza imediatamente para mostrar algo
      // Se for um refresh silencioso, não atualiza ainda para evitar o efeito de "encolher" a tabela
      setRawData(prev => (prev.length === 0 ? accumulatedData : prev));
      setTotalRecords(count);

      // Start background fetching remaining batches
      if (count > 1000) {
        let currentFrom = 1000;
        const batchSize = 1000;

        while (currentFrom < count) {
          if (currentFetchId !== fetchIdRef.current) break;

          const nextTo = Math.min(currentFrom + batchSize - 1, count - 1);
          const nextResult = await romaneiosService.getDashboardData(filters, currentFrom, nextTo);

          if (currentFetchId !== fetchIdRef.current) break;
          if (!nextResult.data || nextResult.data.length === 0) break;

          accumulatedData = [...accumulatedData, ...nextResult.data];

          // Lógica refinada para evitar flickering e "shrinking":
          // Se for carga inicial (vazio), atualiza sempre (progressivo)
          // Se for refresh, só atualiza quando o acumulado superar o que já tínhamos ou for o total
          setRawData(prev => {
            if (prev.length === 0) return accumulatedData;
            if (accumulatedData.length >= prev.length || accumulatedData.length >= count) {
              return accumulatedData;
            }
            return prev;
          });

          currentFrom += batchSize;
        }
      }

      // Garantia final de atualização com o set completo
      if (currentFetchId === fetchIdRef.current) {
        setRawData(accumulatedData);
        setTotalRecords(count);

        if (!isFiltered) {
          localStorage.setItem(CACHE_KEY_DASH, JSON.stringify({ timestamp: now, data: accumulatedData, count }));
        }
      }

      // Fetch Filters if needed
      const filtersCached = localStorage.getItem(CACHE_KEY_FILTERS);
      if (!filtersCached || forceRefresh) {
        const filterOptions = await romaneiosService.getFilters();
        if (currentFetchId !== fetchIdRef.current) return;

        const uniqueDays = Array.from(new Set(filterOptions.map((v: any) => v.dia))).filter(Boolean).sort((a: any, b: any) => parseInt(String(a)) - parseInt(String(b))) as string[];
        const uniqueMonths = Array.from(new Set(filterOptions.map((v: any) => v.mes))).filter(Boolean).sort((a: any, b: any) => parseInt(String(a)) - parseInt(String(b))) as string[];
        const uniqueYears = Array.from(new Set(filterOptions.map((v: any) => v.ano))).filter(Boolean).sort((a: any, b: any) => parseInt(String(a)) - parseInt(String(b))) as string[];
        const uniqueAreas = Array.from(new Set(filterOptions.map((v: any) => v.area))).filter(Boolean).sort() as string[];
        const uniqueUnits = Array.from(new Set(filterOptions.map((v: any) => v.unit))).filter(Boolean).sort() as Unit[];
        const uniqueCarriers = Array.from(new Set(filterOptions.map((v: any) => v.transportador || v.carrier))).filter(Boolean).sort() as string[];

        const filtersObj: DashboardFilters = {
          unidades: uniqueUnits,
          transportadoras: uniqueCarriers,
          materiais: [],
          prioridades: ['Alta', 'Média', 'Baixa', 'Normal'],
          anos: uniqueYears.map(Number),
          meses: uniqueMonths,
          dias: uniqueDays,
          areas: uniqueAreas
        };
        setAvailableFilters(filtersObj);
        localStorage.setItem(CACHE_KEY_FILTERS, JSON.stringify({ timestamp: now, data: filtersObj }));
      } else {
        setAvailableFilters(JSON.parse(filtersCached).data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchPremises();
    fetchRawData();

    const channel = supabase
      .channel('vehicles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'romaneios' }, () => {
        fetchRawData(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPremises, fetchRawData]);

  const result = useMemo(() => {
    let filtered = rawData.filter(v => {
      if (debouncedSearchTerm) {
        const search = debouncedSearchTerm.toLowerCase();
        if (!v.plate?.toLowerCase().includes(search) && !v.driver?.toLowerCase().includes(search)) return false;
      }
      return true;
    });

    const metrics: DashboardMetrics = {
      avg_tmp_liberacao: calculateAvg(filtered, 'tmp_liberacao_min'),
      avg_tmp_doca: calculateAvg(filtered, 'tmp_doca_min'),
      avg_tmp_em_doca: calculateAvg(filtered, 'tmp_em_doca_min')
    };

    const kanbanData: Record<Status, Vehicle[]> = {
      'Aguardando Liberação': [],
      'Aguardando Doca': [],
      'Em Doca': [],
      'Concluído/Saída': []
    };

    const kanbanTotals: Record<Status, number> = {
      'Aguardando Liberação': 0,
      'Aguardando Doca': 0,
      'Em Doca': 0,
      'Concluído/Saída': 0
    };

    const columns: Status[] = ['Aguardando Liberação', 'Aguardando Doca', 'Em Doca', 'Concluído/Saída'];
    columns.forEach(status => {
      let cards = filtered.filter(v => v.status === status);

      if (quickFilters.atrasadas) {
        cards = cards.filter(v => isAtrasado(v, premises));
      }
      if (quickFilters.prioritarios) {
        cards = cards.filter(v => v.priority === 'Alta' || premises[v.unit]?.priorityPlates?.includes(v.plate));
      }

      kanbanTotals[status] = cards.length;

      if (status === 'Concluído/Saída') {
        cards = cards
          .filter(v => v.ts_saida)
          .sort((a, b) => new Date(b.ts_saida!).getTime() - new Date(a.ts_saida!).getTime())
          .slice(0, 100);
      }

      kanbanData[status] = cards;
    });

    return { filteredData: filtered, kanbanData, kanbanTotals, metrics };
  }, [rawData, debouncedSearchTerm, quickFilters, premises]);

  return {
    ...result,
    availableFilters,
    isLoading,
    lastRefresh,
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    quickFilters,
    setQuickFilters,
    premises,
    fetchRawData,
    fetchPremises,
    totalRecords
  };
}

function calculateAvg(data: any[], field: string) {
  const valid = data.filter(v => v[field] > 0);
  return valid.length > 0 ? valid.reduce((acc, v) => acc + v[field], 0) / valid.length : 0;
}

function isAtrasado(v: Vehicle, premises: Record<string, UnitPremises>) {
  const config = premises[v.unit];
  if (!config) return false;
  let goal = 0;
  if (v.status === 'Aguardando Liberação') goal = config.meta_aguardando_liberacao || 0;
  else if (v.status === 'Aguardando Doca') goal = config.meta_aguardando_doca || 0;
  else if (v.status === 'Em Doca') goal = config.meta_em_doca || 0;
  else if (v.status === 'Concluído/Saída') goal = config.meta_concluido_saida || 0;
  const time = v.status === 'Aguardando Liberação' ? v.tmp_liberacao_min :
    v.status === 'Aguardando Doca' ? v.tmp_doca_min :
      v.status === 'Em Doca' ? v.tmp_em_doca_min : v.tmp_total_min;
  return goal > 0 && time > goal;
}

function parseIntervalToMinutes(interval: string | null): number {
  if (!interval) return 0;
  if (interval.includes(':')) {
    const [h, m] = interval.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  const match = interval.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1]);
    return interval.toLowerCase().includes('hour') ? val * 60 : val;
  }
  return 0;
}
