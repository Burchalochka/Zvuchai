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

function getLocalToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameCalendarDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function msUntilNextLocalMidnight() {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1, next.getTime() - d.getTime());
}

export const SelectedDateProvider = ({ children }) => {
  const [selectedDate, setSelectedDateState] = useState(() => getLocalToday());
  const [followToday, setFollowToday] = useState(true);
  const lastTodayRef = useRef(getLocalToday());
  const [todayTick, setTodayTick] = useState(0);

  const setSelectedDate = useCallback((next) => {
    setSelectedDateState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      const resolvedDate = resolved instanceof Date ? resolved : new Date(resolved);
      return Number.isNaN(resolvedDate.getTime()) ? prev : resolvedDate;
    });
  }, []);

  const todayCalendar = useMemo(() => {
    void todayTick;
    return getLocalToday();
  }, [selectedDate, todayTick]);

  useEffect(() => {
    const today = getLocalToday();
    setFollowToday(sameCalendarDay(selectedDate, today));
  }, [selectedDate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const t = getLocalToday();
      lastTodayRef.current = t;
      setTodayTick((n) => n + 1);
      if (followToday) {
        setSelectedDateState(t);
      }
    });
    return () => sub.remove();
  }, [followToday]);

  useEffect(() => {
    const id = setInterval(() => {
      const today = getLocalToday();
      const last = lastTodayRef.current;
      if (!sameCalendarDay(last, today)) {
        lastTodayRef.current = today;
        setTodayTick((n) => n + 1);
        if (followToday) {
          setSelectedDateState(today);
        }
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [followToday]);

  useEffect(() => {
    if (!followToday) return undefined;
    let timeoutId;
    const scheduleMidnight = () => {
      timeoutId = setTimeout(() => {
        const today = getLocalToday();
        lastTodayRef.current = today;
        setTodayTick((n) => n + 1);
        setSelectedDateState(today);
        scheduleMidnight();
      }, msUntilNextLocalMidnight() + 300);
    };
    scheduleMidnight();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [followToday]);

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate, todayCalendar }}>
      {children}
    </SelectedDateContext.Provider>
  );
};
