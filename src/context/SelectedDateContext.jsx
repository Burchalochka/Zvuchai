import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from 'react';
import { AppState } from 'react-native';

const SelectedDateContext = createContext();

export const useSelectedDate = () => {
  const context = useContext(SelectedDateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used within SelectedDateProvider');
  }
  return context;
};

const KYIV_TZ = 'Europe/Kyiv';

function getKyivToday() {
  // Derive calendar date in Kyiv regardless of device timezone.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KYIV_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  // Construct a Date in local timezone at local midnight for that Kyiv calendar day.
  // We only use getFullYear/getMonth/getDate comparisons across the app.
  return new Date(year, month - 1, day);
}

function sameCalendarDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const SelectedDateProvider = ({ children }) => {
  const [selectedDate, setSelectedDateState] = useState(() => getKyivToday());
  // When true, keep selectedDate in sync with "today" in Kyiv.
  const [followKyivToday, setFollowKyivToday] = useState(true);
  const lastKyivTodayRef = useRef(getKyivToday());

  const setSelectedDate = useCallback((next) => {
    setSelectedDateState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      const resolvedDate = resolved instanceof Date ? resolved : new Date(resolved);
      return Number.isNaN(resolvedDate.getTime()) ? prev : resolvedDate;
    });
  }, []);

  const todayKyiv = useMemo(() => getKyivToday(), [selectedDate]);

  useEffect(() => {
    const kyivToday = getKyivToday();
    setFollowKyivToday(sameCalendarDay(selectedDate, kyivToday));
  }, [selectedDate]);

  useEffect(() => {
    // On app foreground: if we're following "today", resync to current Kyiv day.
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!followKyivToday) return;
      const kyivToday = getKyivToday();
      if (!sameCalendarDay(selectedDate, kyivToday)) {
        setSelectedDateState(kyivToday);
      }
      lastKyivTodayRef.current = kyivToday;
    });
    return () => sub.remove();
  }, [followKyivToday, selectedDate]);

  useEffect(() => {
    // Tick to detect Kyiv day rollover (midnight Kyiv) while app is open.
    const id = setInterval(() => {
      const kyivToday = getKyivToday();
      const last = lastKyivTodayRef.current;
      if (!sameCalendarDay(last, kyivToday)) {
        lastKyivTodayRef.current = kyivToday;
        if (followKyivToday) {
          setSelectedDateState(kyivToday);
        }
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [followKyivToday]);

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate, todayKyiv }}>
      {children}
    </SelectedDateContext.Provider>
  );
};
