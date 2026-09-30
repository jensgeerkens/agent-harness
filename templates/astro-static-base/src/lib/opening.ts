import { openingByWeekday } from '../content/site';

export type OpenStatus = {
  isOpen: boolean;
  label: string;
  next: string;
};

/**
 * Aktueller Geöffnet-Status anhand der lokalen Zeit (Browser oder SSR-Build-Zeit).
 */
export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = openingByWeekday[day];

  if (!today) {
    return { isOpen: false, label: 'Heute geschlossen', next: 'Morgen wieder für Sie da.' };
  }

  if (minutes >= today.from && minutes < today.to) {
    const closeH = Math.floor(today.to / 60);
    return { isOpen: true, label: 'Jetzt geöffnet', next: `Heute bis ${closeH}:00 Uhr für Sie da` };
  }

  if (minutes < today.from) {
    const openH = Math.floor(today.from / 60);
    return { isOpen: false, label: 'Heute noch geschlossen', next: `Wir öffnen heute um ${openH}:00 Uhr` };
  }

  return { isOpen: false, label: 'Jetzt geschlossen', next: 'Morgen wieder für Sie da' };
}
