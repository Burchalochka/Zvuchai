/**
 * Єдині правила «день у календарі» для списку, статистики, модалки додавання та крапок у календарі.
 */

export const KYIV_TZ = 'Europe/Kyiv';

/** Календарний рік–місяць–день (місяць 1–12) у часовому поясі Києва для миттєвого часу `date`. */
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

/**
 * Date, для якого календарний день у Києві = (year, month 1–12, day).
 * `new Date(y, m - 1, d)` у локальній TZ часто дає інший Kyiv Y-M-D на пристроях не з Києвом.
 */
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

/**
 * День тижня для календарної дати в Києві: понеділок = 0 … неділя = 6.
 * (Не залежить від часового поясу пристрою — тільки від civil Y-M-D у Kyiv.)
 */
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

/** Кількість днів у місяці (місяць 1–12). */
export function daysInMonthCivil(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

/** Скільки рядків по 7 клітинок займає сітка місяця в Києві (включно з «хвостом» попереднього місяця). */
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

/** Чи збігаються дві дати як календарні дні в Києві. */
export function isSameKyivCalendarDay(a, b) {
  const ka = getKyivYMD(a);
  const kb = getKyivYMD(b);
  if (!ka || !kb) return false;
  return ka.year === kb.year && ka.month === kb.month && ka.day === kb.day;
}

/**
 * Ключ YYYY-MM-DD за календарним днем у Києві (для списків, фільтрів, крапок).
 * Раніше брався локальний getDate() пристрою — через це сітка місяця «їхала» на інших TZ.
 */
export function toDateKey(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return null;
  const k = getKyivYMD(x);
  if (!k) return null;
  return ymdToDateKey(k.year, k.month, k.day);
}

/**
 * Нормалізує збережене поле date до 'YYYY-MM-DD' (префікс ISO, різні формати з бекенду/голосу).
 */
export function itemScheduledDayKey(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[^0-9]|$)/);
  if (!m) return null;
  const mo = String(Number(m[2])).padStart(2, '0');
  const da = String(Number(m[3])).padStart(2, '0');
  return `${m[1]}-${mo}-${da}`;
}

/**
 * Ключ дня для списків і лічильників: обрана дата; якщо з Date не вийшло — «сьогодні» за Києвом
 * (як у SelectedDateProvider), а не new Date() пристрою — інакше лічильник і головний екран роз’їжджаються.
 */
export function resolveCalendarListDateKey(selectedDate, todayKyiv) {
  const primary = toDateKey(selectedDate);
  if (primary) return primary;
  return toDateKey(todayKyiv) ?? null;
}

/** Те саме, що tasksForDay / habitsForDay на HomeScreen. */
export function isItemOnCalendarDay(item, dateKey) {
  if (!dateKey || !item) return false;
  const itemKey = itemScheduledDayKey(item.date);
  if (!itemKey || itemKey !== dateKey) return false;
  if (item.deletedAt) return false;
  if (item.archived) return false;
  return true;
}

/** Крапки в календарі — лише активні задачі з прив’язкою до дня (як у списку). */
export function buildTaskCountsByDateForCalendar(tasks) {
  return (tasks || []).reduce((acc, task) => {
    const itemKey = itemScheduledDayKey(task?.date);
    if (!itemKey || !isItemOnCalendarDay(task, itemKey)) return acc;
    acc[itemKey] = (acc[itemKey] || 0) + 1;
    return acc;
  }, {});
}
