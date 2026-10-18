import { Attendance } from '@/types';

export function dedupeAttendance(records: Attendance[]): Attendance[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const personKey = record.member_id ?? `newcomer:${record.newcomer_name?.trim().toLowerCase() ?? record.id}`;
    const key = `${record.service_id}:${personKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
