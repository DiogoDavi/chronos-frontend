import { create } from 'zustand';
import { Unit, UnitPremises } from '../types/logistics';
import { romaneiosService } from '../services/romaneiosService';
import { supabase } from '../services/supabase';

interface PremisesState {
  premises: Record<string, UnitPremises>;
  isLoading: boolean;
  isInitialLoaded: boolean;
  error: string | null;
  fetchPremises: () => Promise<void>;
  savePremises: (unit: Unit, config: UnitPremises) => Promise<void>;
  setLocalPremises: (unit: Unit, config: UnitPremises) => void;
}

function parsePostgresArray(arr: any): number[] {
  if (Array.isArray(arr)) {
    return arr
      .map(v => Number(v))
      .filter(v => !isNaN(v));
  }
  if (typeof arr === 'string') {
    try {
      // JSON array vindo do Supabase
      if (arr.startsWith('[')) {
        return JSON.parse(arr)
          .map(Number)
          .filter((v: number) => !isNaN(v));
      }
      // PostgreSQL array: {1,2,3}
      return arr
        .replace('{', '')
        .replace('}', '')
        .split(',')
        .map(v => Number(v.trim()))
        .filter(v => !isNaN(v));
    } catch {
      return [];
    }
  }
  return [];
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

export const usePremisesStore = create<PremisesState>((set, get) => ({
  premises: {},
  isLoading: false,
  isInitialLoaded: false,
  error: null,
  fetchPremises: async () => {
    // Evita múltiplos fetch simultâneos
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await romaneiosService.getPremises();
      const { premisesData, exceptionsData } = data;
      const newPremises: Record<string, UnitPremises> = {};
      premisesData.forEach((row: any) => {
        newPremises[row.unit] = {
          unit: row.unit as Unit,
          operatingDays: parsePostgresArray(row.operating_days),
          windows: row.windows || [
            { id: '1', start: row.start_time || '08:00', end: row.end_time || '18:00' }
          ],
          priorityPlates: Array.isArray(row.priority_plates) ? row.priority_plates : [],
          meta_aguardando_liberacao: parseIntervalToMinutes(row.meta_aguardando_liberacao) || 45,
          meta_aguardando_doca: parseIntervalToMinutes(row.meta_aguardando_doca) || 60,
          meta_em_doca: parseIntervalToMinutes(row.meta_em_doca) || 120,
          meta_concluido_saida: parseIntervalToMinutes(row.meta_concluido_saida) || 180,
          refresh_seconds: row.refresh_seconds || 120,
          exceptions: (exceptionsData || []).filter((e: any) => e.unit === row.unit)
        };
      });
      // Faz merge ao invés de sobrescrever tudo
      set(state => ({
        premises: { ...state.premises, ...newPremises },
        isLoading: false,
        isInitialLoaded: true,
        error: null
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error fetching premises', isLoading: false });
    }
  },
  savePremises: async (unit: Unit, config: UnitPremises) => {
    const previousPremises = get().premises;
    // Optimistic Update
    set(state => ({
      premises: { ...state.premises, [unit]: { ...config, unit } }
    }));
    try {
      const window = config.windows?.[0] || { start: '08:00', end: '18:00' };
      const { data, error } = await supabase
        .from('unit_premises')
        .upsert({
          unit,
          operating_days: config.operatingDays,
          start_time: window.start,
          end_time: window.end,
          priority_plates: config.priorityPlates,
          meta_aguardando_liberacao: `${config.meta_aguardando_liberacao || 45} minutes`,
          meta_aguardando_doca: `${config.meta_aguardando_doca || 60} minutes`,
          meta_em_doca: `${config.meta_em_doca || 120} minutes`,
          refresh_seconds: config.refresh_seconds || 120
        })
        .select()
        .single();
      if (error) throw error;
      // Atualiza localmente com retorno do banco
      if (data) {
        set(state => ({
          premises: {
            ...state.premises,
            [unit]: {
              ...config,
              unit,
              operatingDays: parsePostgresArray(data.operating_days)
            }
          }
        }));
      }
      // Re-sync silencioso
      setTimeout(() => {
        get().fetchPremises();
      }, 500);
    } catch (error: any) {
      // Rollback
      set({ premises: previousPremises, error: error.message || 'Error saving premises' });
      throw error;
    }
  },
  setLocalPremises: (unit, config) => {
    set(state => ({ premises: { ...state.premises, [unit]: config } }));
  }
}));