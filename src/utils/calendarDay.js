export const KYIV_TZ = 'Europe/Kyiv';

export function getKyivYMD(date) {
  const x = date instanceof Date ? date : new Date(date);
  if (isNaN(x.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KYIV_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(x);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
}

export function dateFromKyivYMD(year, month1to12, day) {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month1to12) ||
    !Number.isFinite(day) ||
    month1to12 < 1 ||
    month1to12 > 12 ||
    day < 1
  ) {
    return new Date(year, month1to12 - 1, day);
  }
  let t = Date.UTC(year, month1to12 - 1, day, 10, 0, 0);
  for (let i = 0; i < 96; i++) {
    const k = getKyivYMD(new Date(t));
    if (!k) break;
    if (k.year === year && k.month === month1to12 && k.day === day) {
      return new Date(t);
    }
    const cmp =
      k.year !== year
        ? k.year - year
        : k.month !== month1to12
          ? k.month - month1to12
          : k.day - day;
    t += (cmp > 0 ? -1 : 1) * 3600000;
  }
  return new Date(year, month1to12 - 1, day);
}

const KYIV_WD_MON0 = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function getKyivWeekdayMon0(year, month1to12, day) {
  let t = Date.UTC(year, month1to12 - 1, day, 10, 0, 0);
  for (let i = 0; i < 72; i++) {
    const k = getKyivYMD(new Date(t));
    if (!k) break;
    if (k.year === year && k.month === month1to12 && k.day === day) {
      const w = new Intl.DateTimeFormat('en-US', {
        timeZone: KYIV_TZ,
        weekday: 'short',
      }).format(new Date(t));
      const key = w.slice(0, 3);
      if (KYIV_WD_MON0[key] !== undefined) return KYIV_WD_MON0[key];
      break;
    }
    const cmp =
      k.year !== year
        ? k.year - year
        : k.month !== month1to12
          ? k.month - month1to12
          : k.day - day;
    t += (cmp > 0 ? -1 : 1) * 3600000;
  }
  const local = new Date(year, month1to12 - 1, day);
  const js = local.getDay();
  return js === 0 ? 6 : js - 1;
}

export function daysInMonthCivil(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

export function kyivMonthGridRowCount(dateLike) {
  const raw = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const k = getKyivYMD(raw);
  if (!k) return 6;
  const dim = daysInMonthCivil(k.year, k.month);
  const start = getKyivWeekdayMon0(k.year, k.month, 1);
  const cells = start + dim;
  const rem = cells % 7;
  const padded = rem === 0 ? cells : cells + (7 - rem);
  return Math.ceil(padded / 7);
}

export function ymdToDateKey(year, month1to12, day) {
  return `${year}-${String(month1to12).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toLocalDateKey(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  return ymdToDateKey(x.getFullYear(), x.getMonth() + 1, x.getDate());
}

export function isSameKyivCalendarDay(a, b) {
  const ka = getKyivYMD(a);
  const kb = getKyivYMD(b);
  if (!ka || !kb) return false;
  return ka.year === kb.year && ka.month === kb.month && ka.day === kb.day;
}

export function toDateKey(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  const k = getKyivYMD(x);
  if (!k) return null;
  return ymdToDateKey(k.year, k.month, k.day);
}

export function itemScheduledDayKey(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[^0-9]|$)/);
  if (!m) return null;
  const mo = String(Number(m[2])).padStart(2, '0');
  const da = String(Number(m[3])).padStart(2, '0');
  return `${m[1]}-${mo}-${da}`;
}

export function resolveCalendarListDateKey(selectedDate, todayCalendar) {
  const primary = toLocalDateKey(selectedDate);
  if (primary) return primary;
  return toLocalDateKey(todayCalendar) ?? null;
}

export function isItemOnCalendarDay(item, dateKey) {
  if (!dateKey || !item) return false;
  const itemKey = itemScheduledDayKey(item.date);
  if (!itemKey || itemKey !== dateKey) return false;
  if (item.deletedAt) return false;
  if (item.archived) return false;
  return true;
}

export function buildTaskCountsByDateForCalendar(tasks) {
  return (tasks || []).reduce((acc, task) => {
    const itemKey = itemScheduledDayKey(task?.date);
    if (!itemKey || !isItemOnCalendarDay(task, itemKey)) return acc;
    acc[itemKey] = (acc[itemKey] || 0) + 1;
    return acc;
  }, {});
}
