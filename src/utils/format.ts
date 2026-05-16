export const formatTime = (totalMins: number): string => {
  if (typeof totalMins !== 'number' || isNaN(totalMins) || totalMins < 0) return '0min';

  const totalHours = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);

  const d = Math.floor(totalHours / 24);
  const h = totalHours % 24;

  const parts: string[] = [];

  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}min`);

  return parts.join(' ') || '0min';
};

export const getTMPColor = (mins: number, goal: number = 0) => {
  if (!goal) {
    if (!mins || mins < 90) return 'text-emerald-500';
    if (mins < 180) return 'text-amber-500';
    return 'text-red-500';
  }
  return mins > goal ? 'text-red-500' : 'text-emerald-500';
};
