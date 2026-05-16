import { Unit, UnitPremises, Vehicle } from '../types/logistics';

export const getBrazilTime = (date: Date = new Date()) => {
  const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const timeStr = date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
  const [h, m] = timeStr.split(':').map(Number);
  
  const brDateStr = date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const dayIndex = new Date(brDateStr).getDay();

  return {
    dateStr,
    minutesValue: h * 60 + m,
    dayIndex
  };
};

export const isUnitActive = (unit: string, brTime: ReturnType<typeof getBrazilTime>, premises: Record<string, UnitPremises>): boolean => {
  const config = premises[unit as Unit];
  if (!config) return false;
  
  const exception = config.exceptions?.find(e => e.date === brTime.dateStr);
  
  if (exception) {
    if (!exception.is_active) return false;
    if (!exception.start_time || !exception.end_time) return false;
    return true;
  }
  
  const day = brTime.dayIndex;
  const operatingDays = config.operatingDays?.length > 0 ? config.operatingDays : [1, 2, 3, 4, 5, 6];
  return operatingDays.includes(day);
};

export const getOperatingHours = (unit: string, brTime: ReturnType<typeof getBrazilTime>, premises: Record<string, UnitPremises>) => {
  const config = premises[unit as Unit];
  if (!config) return { start: '08:00', end: '18:00' };
  
  const exception = config.exceptions?.find(e => e.date === brTime.dateStr);
  
  if (exception && exception.is_active && exception.start_time && exception.end_time) {
    return { start: exception.start_time.substring(0, 5), end: exception.end_time.substring(0, 5) };
  }
  
  const windows = config.windows?.length > 0 ? config.windows : [{ start: '08:00', end: '18:00' }];
  return { start: windows[0].start, end: windows[0].end };
};

export const isUnitOperating = (unit: Unit, premises: Record<string, UnitPremises>) => {
  const brTime = getBrazilTime();
  if (!isUnitActive(unit, brTime, premises)) return false;
  
  const config = premises[unit];
  if (!config) return false;

  const currentTimeVal = brTime.minutesValue;

  const exception = config.exceptions?.find(e => e.date === brTime.dateStr);
  if (exception) {
    if (!exception.is_active || !exception.start_time || !exception.end_time) return false;
    const [startH, startM] = exception.start_time.split(':').map(Number);
    const [endH, endM] = exception.end_time.split(':').map(Number);
    return currentTimeVal >= (startH * 60 + startM) && currentTimeVal <= (endH * 60 + endM);
  }

  const windows = config.windows?.length > 0 ? config.windows : [{ id: '1', start: '08:00', end: '18:00' }];
  return windows.some(win => {
    const [startH, startM] = win.start.split(':').map(Number);
    const [endH, endM] = win.end.split(':').map(Number);
    return currentTimeVal >= (startH * 60 + startM) && currentTimeVal <= (endH * 60 + endM);
  });
};

export const hasPremisesPriority = (vehicle: Vehicle, premises: Record<string, UnitPremises>) => {
  const config = premises[vehicle.unit];
  if (!config) return false;
  return config.priorityPlates?.includes(vehicle.plate.toUpperCase()) || false;
};

export const getFormattedOperatingDays = (unit: Unit, premises: Record<string, UnitPremises>) => {
  const config = premises[unit];
  if (!config || !config.operatingDays || config.operatingDays.length === 0) return 'Seg-Sáb';
  
  const daysMap: Record<number, string> = {
    0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
  };
  
  const days = [...config.operatingDays].sort((a, b) => a - b);
  
  if (days.length === 7) return 'Diário';
  if (days.length === 6 && days.includes(1) && days.includes(6) && !days.includes(0)) return 'Seg-Sáb';
  if (days.length === 5 && days.includes(1) && days.includes(5) && !days.includes(6) && !days.includes(0)) return 'Seg-Sex';
  
  return days.map(d => daysMap[d]).join(', ');
};
