import { Service } from '@/types';
import { parseLocalDate } from '@/lib/dateUtils';

function parseTimeString(timeStr: string): { hour: number; minute: number } | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function buildDateTime(dateStr: string, timeStr: string): Date | null {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return null;
  const date = parseLocalDate(dateStr);
  date.setHours(parsed.hour, parsed.minute, 0, 0);
  return date;
}

const DEFAULT_SERVICE_DURATION_MINUTES = 120;

export function isServiceActive(service: Service, now: Date = new Date()): boolean {
  const start = buildDateTime(service.service_date, service.service_time);
  if (!start) return false;

  let end: Date | null = null;
  if (service.service_end_time) {
    end = buildDateTime(service.service_date, service.service_end_time);
  }
  if (!end) {
    end = new Date(start.getTime() + DEFAULT_SERVICE_DURATION_MINUTES * 60 * 1000);
  }

  return now >= start && now <= end;
}

export function getServiceStatus(service: Service, now: Date = new Date()): 'upcoming' | 'active' | 'ended' {
  const start = buildDateTime(service.service_date, service.service_time);
  if (!start) return 'ended';

  let end: Date | null = null;
  if (service.service_end_time) {
    end = buildDateTime(service.service_date, service.service_end_time);
  }
  if (!end) {
    end = new Date(start.getTime() + DEFAULT_SERVICE_DURATION_MINUTES * 60 * 1000);
  }

  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

export function findActiveService(services: Service[], now: Date = new Date()): Service | null {
  return services.find((s) => isServiceActive(s, now)) ?? null;
}
