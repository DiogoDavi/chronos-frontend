export type Unit = 'JPA' | 'CPV' | 'REC' | 'MCZ' | 'AJU' | 'VIX' | 'FOR' | 'SLZ' | 'THE' | 'NAT' | 'CPG' | 'MSR';

export interface ServiceWindow {
  id: string;
  start: string;
  end: string;
}

export interface CalendarException {
  id?: string;
  unit: string;
  date: string;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
}

export interface UnitPremises {
  unit: Unit;
  operatingDays: number[];
  windows: ServiceWindow[];
  priorityPlates: string[];
  meta_aguardando_liberacao?: number; // in minutes
  meta_aguardando_doca?: number;      // in minutes
  meta_em_doca?: number;              // in minutes
  meta_concluido_saida?: number;      // in minutes
  refresh_seconds?: number;
  exceptions? : CalendarException[];
}

export type Priority = 'Alta' | 'Média' | 'Baixa' | 'Normal';

export type Status = 'Aguardando Liberação' | 'Aguardando Doca' | 'Em Doca' | 'Concluído/Saída';

export interface Vehicle {
  id: string;
  order_num: string;
  unit: Unit;
  plate: string;
  plate_trailer: string;
  driver: string;
  carrier: string;
  material: string;
  destination: string;
  uf: string;
  dock: string;
  priority: Priority;
  status: Status;
  ts_inicial: string;
  ts_romaneio: string;
  ts_entrada: string;
  ts_saida: string;
  observation: string;
  created_at: string;
  area: string;
  dia?: string;
  mes?: string;
  ano?: string;
  // Calculated fields from view
  tmp_liberacao_min: number;
  tmp_doca_min: number;
  tmp_em_doca_min: number;
  tmp_total_min: number;
  is_operating?: boolean;
}

export interface DashboardMetrics {
  avg_tmp_liberacao: number;
  avg_tmp_doca: number;
  avg_tmp_em_doca: number;
}

export interface DashboardFilters {
  unidades: Unit[];
  transportadoras: string[];
  materiais: string[];
  prioridades: Priority[];
  anos: number[];
  meses: string[];
  dias: string[];
  areas: string[];
}
