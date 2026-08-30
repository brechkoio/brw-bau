import { toLocalIsoDate } from '@/utils/format-date';

export interface DateRange {
  from: string;
  to: string;
}

export function currentMonthRange(): DateRange {
  const now = new Date();
  return {
    from: toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toLocalIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
