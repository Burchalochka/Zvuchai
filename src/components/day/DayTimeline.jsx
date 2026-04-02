import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, PanResponder, Pressable } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../styles/theme';

const MINUTES_IN_DAY = 24 * 60;
const FIGMA_STROKE = '#898989';
const FIGMA_BROWN = '#452C16';
const FIGMA_BROWN_40 = 'rgba(69,44,22,0.40)';
const NOW_PILL_BG = FIGMA_BROWN_40;
const NOW_PILL_BORDER = 'rgba(69,44,22,0.40)';
const KYIV_TZ = 'Europe/Kyiv';
const TIMEZONE_MODE = 'kyiv';

const NOTE_ICON = require('../../assets/icons/Group.png');
const DONE_ICON = require('../../assets/icons/Group34.png');
const EMPTY_ICON = require('../../assets/icons/Ellipse 32.png');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseHHMM(value) {
  if (!value || typeof value !== 'string' || !value.includes(':')) return null;
  const [hRaw, mRaw] = value.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return clamp(h, 0, 23) * 60 + clamp(m, 0, 59);
}

function formatDurationUk(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} хв`;
  if (m <= 0) return `${h} год`;
  return `${h} год ${m} хв`;
}

function formatHHMM(totalMinutes) {
  const m = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getNowParts() {
  try {
    if (TIMEZONE_MODE === 'device') {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return { dateKey: `${y}-${m}-${day}`, hours: d.getHours(), minutes: d.getMinutes() };
    }

    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) throw new Error('Intl not available');
    const tz =
      TIMEZONE_MODE === 'kyiv'
        ? KYIV_TZ
        : (Intl.DateTimeFormat().resolvedOptions?.().timeZone || KYIV_TZ);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const get = (type) => parts.find((p) => p.type === type)?.value;
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const hh = get('hour');
    const mm = get('minute');
    const dateKey = `${y}-${m}-${d}`;
    return {
      dateKey,
      hours: Number(hh),
      minutes: Number(mm),
    };
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { dateKey: `${y}-${m}-${day}`, hours: d.getHours(), minutes: d.getMinutes() };
  }
}

function computeLanes(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const laneEnds = [];
  const withLane = [];

  for (const it of sorted) {
    let placedLane = -1;
    for (let i = 0; i < laneEnds.length; i += 1) {
      if (it.startMin >= laneEnds[i]) {
        placedLane = i;
        break;
      }
    }
    if (placedLane === -1) {
      placedLane = laneEnds.length;
      laneEnds.push(it.endMin);
    } else {
      laneEnds[placedLane] = it.endMin;
    }
    withLane.push({ ...it, lane: placedLane });
  }
  return { items: withLane, laneCount: laneEnds.length || 1 };
}

function addDaysToDateKey(dateKey, deltaDays) {
  if (!dateKey || typeof dateKey !== 'string') return dateKey;
  const [y, m, d] = dateKey.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function snapTo5(min) {
  return Math.round(min / 5) * 5;
}

function hexToRgb(hex) {
  const h = String(hex || '').trim().replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return null;
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  const to = (n) => String(clamp(Math.round(n), 0, 255).toString(16)).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rr:
        h = ((gg - bb) / d) % 6;
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      default:
        h = (rr - gg) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rr = 0;
  let gg = 0;
  let bb = 0;
  if (h >= 0 && h < 60) [rr, gg, bb] = [c, x, 0];
  else if (h < 120) [rr, gg, bb] = [x, c, 0];
  else if (h < 180) [rr, gg, bb] = [0, c, x];
  else if (h < 240) [rr, gg, bb] = [0, x, c];
  else if (h < 300) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  return { r: (rr + m) * 255, g: (gg + m) * 255, b: (bb + m) * 255 };
}

function intensifyHex(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb);
  const next = {
    h: hsl.h,
    s: clamp(hsl.s * 1.7 + 0.15, 0, 1),
    l: clamp(hsl.l - 0.22, 0.08, 0.82),
  };
  return rgbToHex(hslToRgb(next));
}

export default function DayTimeline({
  dateKey,
  items,
  onPressItem,
  onLongPressItem,
  onToggleComplete,
  onSetCompleted,
  onUpdateItem,
  onRescheduleItem,
  bottomPadding = 0,
}) {
  const scrollRef = useRef(null);
  const tickerRef = useRef(null);
  const userInteractedRef = useRef(false);
  const lastAutoScrollKeyRef = useRef(null);
  const nowMinRef = useRef(0);
  const [nowParts, setNowParts] = useState(() => getNowParts());
  const nowMin = (nowParts?.hours || 0) * 60 + (nowParts?.minutes || 0);
  nowMinRef.current = nowMin;

  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    const intervalMs = __DEV__ ? 1000 : 30_000;
    tickerRef.current = setInterval(() => {
      setNowParts(getNowParts());
    }, intervalMs);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const todayKey = nowParts?.dateKey;
  const effectiveDateKey = dateKey || todayKey;
  const isTodayLiteral = !!effectiveDateKey && effectiveDateKey === todayKey;
  const isPastDayLiteral = !!effectiveDateKey && !!todayKey && effectiveDateKey < todayKey;

  const clean = useMemo(() => {
    const base = (items || [])
      .filter((x) => x && x.startTime && x.endTime)
      .map((x) => {
        const startMin = parseHHMM(x.startTime);
        const endMin = parseHHMM(x.endTime);
        if (startMin === null || endMin === null) return null;
        const safeEnd = Math.max(startMin + 5, endMin);
        return { raw: x, startMin, endMin: safeEnd };
      })
      .filter(Boolean);

    const { items: withLane, laneCount } = computeLanes(base);

    return { laneCount, items: withLane, startMin: 0, endMin: MINUTES_IN_DAY };
  }, [items]);

  const minutesSpan = clean.endMin - clean.startMin;
  const PX_PER_MIN = 1.25;
  const TOP_INSET = 26;
  const BOTTOM_INSET = 26;
  const ZERO_GAP = 12;
  const scrollBottomPad = Math.max(0, bottomPadding || 0);
  const timelineHeight = Math.max(240, Math.round(minutesSpan * PX_PER_MIN) + TOP_INSET + BOTTOM_INSET);
  const contentHeight = timelineHeight + scrollBottomPad;

  const isToday = useMemo(() => isTodayLiteral, [isTodayLiteral]);
  const isPastDay = useMemo(() => isPastDayLiteral, [isPastDayLiteral]);

  const showNow = isToday;
  const unclampedNowTop = TOP_INSET + (nowMin - clean.startMin) * PX_PER_MIN;
  const nowTop = clamp(unclampedNowTop, 0, Math.max(0, timelineHeight - 1));

  const activeNowItem = useMemo(() => {
    if (!isToday) return null;
    for (const it of clean.items) {
      const task = it.raw;
      if (!task) continue;
      if (task.status === 'completed') continue;
      if (nowMin >= it.startMin && nowMin < it.endMin) return task;
    }
    return null;
  }, [clean.items, isToday, nowMin]);

  const hoursLabels = useMemo(() => {
    const out = [];
    for (let m = 0; m <= MINUTES_IN_DAY - 60; m += 60) out.push(m);
    return out;
  }, []);

  const hoursTicks = useMemo(() => {
    const out = [];
    for (let m = 0; m <= MINUTES_IN_DAY; m += 60) out.push(m);
    return out;
  }, []);

  const suppressedHourLabels = useMemo(() => new Set(), []);

  const railSegments = useMemo(() => {
    const segH = RAIL_SEGMENT_H;
    const half = segH / 2;
    const out = [];
    const topCap = TOP_INSET + ZERO_GAP;
    const bottomCap = Math.max(
      topCap,
      timelineHeight - BOTTOM_INSET - ZERO_GAP - segH,
    );
    out.push({ key: 'seg-cap-top', top: topCap, height: segH });
    for (let i = 0; i < hoursTicks.length - 2; i += 1) {
      const midMin = (hoursTicks[i] + hoursTicks[i + 1]) / 2;
      const top = TOP_INSET + (midMin - clean.startMin) * PX_PER_MIN - half;
      out.push({ key: `seg-${hoursTicks[i]}`, top: clamp(top, topCap, bottomCap), height: segH });
    }
    out.push({ key: 'seg-cap-bottom', top: bottomCap, height: segH });
    return out;
  }, [TOP_INSET, BOTTOM_INSET, ZERO_GAP, hoursTicks, clean.startMin, PX_PER_MIN, timelineHeight]);

  const railBottomCapTop = useMemo(() => {
    const segH = RAIL_SEGMENT_H;
    const topCap = TOP_INSET + ZERO_GAP;
    return Math.max(
      topCap,
      timelineHeight - BOTTOM_INSET - ZERO_GAP - segH,
    );
  }, [TOP_INSET, ZERO_GAP, timelineHeight, BOTTOM_INSET]);

  const taskStartMarkers = useMemo(() => {
    const hourTops = new Set(hoursLabels.map((m) => Math.round(TOP_INSET + (m - clean.startMin) * PX_PER_MIN)));
    const seen = new Set();
    const out = [];
    for (const it of clean.items) {
      const startMin = it.startMin;
      if (startMin % 60 === 0) continue;
      if (showNow && startMin === nowMin) continue;
      const label = formatHHMM(startMin);
      if (seen.has(label)) continue;
      seen.add(label);
      const top = TOP_INSET + (startMin - clean.startMin) * PX_PER_MIN;
      const nearHour = hourTops.has(Math.round(top)) ||
        Array.from(hourTops).some((t) => Math.abs(t - top) < 22);
      if (nearHour) continue;
      out.push({ key: `mark-${label}`, top, label });
    }
    return out;
  }, [TOP_INSET, clean.items, clean.startMin, PX_PER_MIN, hoursLabels, nowMin, showNow]);

  const overlapGroupsByStart = useMemo(() => {
    const map = new Map();
    for (const it of clean.items) {
      const key = it.startMin;
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      if (!arr || arr.length < 2) {
        map.delete(k);
        continue;
      }
      const anyOverlap = arr.some((a, i) =>
        arr.some((b, j) => i !== j && a.startMin < b.endMin && a.endMin > b.startMin)
      );
      if (!anyOverlap) map.delete(k);
    }
    return map;
  }, [clean.items]);

  const [draggingId, setDraggingId] = useState(null);
  const isDragging = !!draggingId;

  const firstItemStartMin = useMemo(() => {
    return clean.items.reduce((acc, it) => Math.min(acc, it.startMin), Number.POSITIVE_INFINITY);
  }, [clean.items]);

  useEffect(() => {
    if (userInteractedRef.current) return;
    if (!effectiveDateKey) return;
    if (lastAutoScrollKeyRef.current === effectiveDateKey) return;

    const targetMin = isToday
      ? nowMinRef.current
      : (Number.isFinite(firstItemStartMin) ? firstItemStartMin : 0);
    const paddingMin = 45;
    const y = Math.max(0, TOP_INSET + (targetMin - clean.startMin - paddingMin) * PX_PER_MIN);

    const t = setTimeout(() => {
      scrollRef.current?.scrollTo?.({ y, animated: false });
      lastAutoScrollKeyRef.current = effectiveDateKey;
    }, 0);
    return () => clearTimeout(t);
  }, [effectiveDateKey, isToday, firstItemStartMin, TOP_INSET, clean.startMin, PX_PER_MIN]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 0 }}
      scrollEnabled={!isDragging}
      onScrollBeginDrag={() => {
        userInteractedRef.current = true;
      }}
      onMomentumScrollBegin={() => {
        userInteractedRef.current = true;
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <View style={[styles.content, { height: contentHeight }]}>
        <View
          style={[styles.railTopStem, { height: Math.max(0, TOP_INSET - ZERO_GAP) }]}
          pointerEvents="none"
        />
        <View
          style={[
            styles.railBottomStem,
            {
              top: railBottomCapTop + RAIL_SEGMENT_H,
              height: Math.max(0, contentHeight - (railBottomCapTop + RAIL_SEGMENT_H)),
            },
          ]}
          pointerEvents="none"
        />
        <View style={styles.scaleCol}>
          {hoursLabels.map((m) => (
            <View
              key={m}
              style={[
                styles.hourSlot,
                { top: TOP_INSET + (m - clean.startMin) * PX_PER_MIN },
                { transform: [{ translateY: TIME_LABEL_SHIFT_Y }] },
              ]}
            >
              {suppressedHourLabels.has(m) ? null : (
                <Text style={styles.hourText} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                  {`${String(Math.floor(m / 60)).padStart(2, '0')}:00`}
                </Text>
              )}
            </View>
          ))}
        </View>

        {railSegments.map((s) => (
          <View
            key={s.key}
            style={[
              styles.railSegment,
              { top: s.top, height: s.height },
            ]}
            pointerEvents="none"
          />
        ))}

        {hoursLabels.map((m) => (
          <View
            key={`cut-${m}`}
            style={[
              styles.hourRailCut,
              {
                top:
                  TOP_INSET +
                  (m - clean.startMin) * PX_PER_MIN +
                  TIME_LABEL_SHIFT_Y - HOUR_RAIL_GAP_Y,
              },
            ]}
            pointerEvents="none"
          />
        ))}

        {taskStartMarkers.map((m) => (
          <View
            key={m.key}
            style={[styles.taskStartMarker, { top: m.top }]}
            pointerEvents="none"
          >
            <Text style={styles.taskStartMarkerText} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
              {m.label}
            </Text>
          </View>
        ))}

        {showNow ? (
          <View style={[styles.nowRow, { top: nowTop - NOW_ROW_H / 2 }]} pointerEvents="none">
            <View style={styles.nowRailCut} />
            <View style={styles.nowStemTop} />
            <View style={styles.nowStemBottom} />
            <View style={styles.nowPill}>
              <Text style={styles.nowPillText}>{formatHHMM(nowMin)}</Text>
            </View>
            <View style={styles.nowLineLeft} />
            <View style={styles.nowLineRight} />
          </View>
        ) : null}

        <View style={styles.timelineCol}>
          {hoursTicks.map((m) => (
            <View
              key={`grid-${m}`}
              style={[
                styles.hourGridLine,
                { top: TOP_INSET + (m - clean.startMin) * PX_PER_MIN },
              ]}
              pointerEvents="none"
            />
          ))}

          <View style={[styles.itemsLayer, { height: timelineHeight }]}>
            {clean.items.map((it) => {
              const task = it.raw;
              const manualOverride = task?.autoDoneOverride;
              const isCompleted = task?.status === 'completed';
              const autoDoneByTime = isPastDay || (isToday && nowMin >= it.endMin);
              const autoDone = autoDoneByTime && manualOverride !== 'pending';
              const isVisuallyCompleted =
                manualOverride === 'pending'
                  ? false
                  : manualOverride === 'completed'
                    ? true
                    : (isCompleted || autoDone);
              const activeNow = isToday && nowMin >= it.startMin && nowMin < it.endMin && !isVisuallyCompleted;

              const rawTop = TOP_INSET + (it.startMin - clean.startMin) * PX_PER_MIN;
              const rawHeight = (it.endMin - it.startMin) * PX_PER_MIN;
              const top = rawTop + CARD_VERTICAL_GAP / 2;
              const height = Math.max(CARD_MIN_HEIGHT, rawHeight - CARD_VERTICAL_GAP);

              const overlaps = clean.items.filter(
                (x) => x !== it && x.startMin < it.endMin && x.endMin > it.startMin,
              );
              const group = [it, ...overlaps];
              const uniqueLanes = Array.from(new Set(group.map((x) => x.lane))).sort((a, b) => a - b);
              const laneIndex = Math.max(0, uniqueLanes.indexOf(it.lane));
              const concurrentCount = Math.max(1, uniqueLanes.length);
              const laneGap = 10;
              const laneWidth = 1 / concurrentCount;
              const leftPct = laneIndex * laneWidth;
              const widthPct = laneWidth;

              const baseColorRaw = task?.themeColor || COLORS.primary;
              const baseColorNorm = String(baseColorRaw || '').trim().toUpperCase();
              const baseColorHex = baseColorNorm.startsWith('#') ? baseColorNorm : `#${baseColorNorm}`;
              const isYellow =
                baseColorHex === '#DDF622' ||
                baseColorHex === '#FCFFC6' ||
                baseColorHex === '#FFFFBA';
              const isPink =
                baseColorHex === '#FFB3BA' ||
                baseColorHex === '#FFD9D9' ||
                baseColorHex === '#FF6666';
              const cardBg = isYellow ? '#FCFFC6' : isPink ? '#FFD9D9' : baseColorRaw;
              const stripColor =
                isYellow
                  ? '#DDF622'
                  : isPink
                    ? '#FF6666'
                    : (intensifyHex(baseColorHex) || '#000000');
              const durationLabel = formatDurationUk(it.endMin - it.startMin);
              const metaLabel = `${task.startTime}-${task.endTime}${durationLabel ? ` (${durationLabel})` : ''}`;
              const isSingleInDay = clean.items.length === 1 && concurrentCount === 1;

              const sameStartGroup = overlapGroupsByStart.get(it.startMin) || null;
              if (sameStartGroup && sameStartGroup[0] !== it) return null;

              const startMin0 = it.startMin;
              const endMin0 = it.endMin;
              const duration0 = Math.max(5, endMin0 - startMin0);
              const responder = PanResponder.create({
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                  if (!task?.id) return false;
                  return Math.abs(gestureState.dy) > 6;
                },
                onPanResponderGrant: () => {
                  setDraggingId(String(task.id));
                  userInteractedRef.current = true;
                },
                onPanResponderMove: () => {},
                onPanResponderRelease: (evt, gestureState) => {
                  const dy = gestureState?.dy || 0;
                  setDraggingId(null);
                  if (Math.abs(dy) < 6) return;
                  const deltaMin = snapTo5(dy / PX_PER_MIN);
                  let nextStart = startMin0 + deltaMin;
                  let dayShift = 0;
                  if (nextStart < 0) {
                    dayShift = -1;
                    nextStart = MINUTES_IN_DAY + nextStart;
                  } else if (nextStart >= MINUTES_IN_DAY) {
                    dayShift = 1;
                    nextStart = nextStart - MINUTES_IN_DAY;
                  }
                  nextStart = clamp(snapTo5(nextStart), 0, MINUTES_IN_DAY - 5);
                  const nextEnd = clamp(nextStart + duration0, nextStart + 5, MINUTES_IN_DAY);
                  const patch = {
                    startTime: formatHHMM(nextStart),
                    endTime: formatHHMM(nextEnd === MINUTES_IN_DAY ? MINUTES_IN_DAY - 1 : nextEnd),
                  };
                  if (typeof onUpdateItem === 'function') {
                    onUpdateItem(task.id, patch);
                  }
                  if (dayShift !== 0 && typeof onRescheduleItem === 'function') {
                    const nextKey = addDaysToDateKey(effectiveDateKey, dayShift);
                    onRescheduleItem(task.id, nextKey);
                  }
                },
                onPanResponderTerminate: () => {
                  setDraggingId(null);
                },
              });

              const renderSwipeCard = (taskIt) => {
                const t = taskIt.raw;
                const manual = t?.autoDoneOverride;
                const completed = t?.status === 'completed';
                const autoDoneTime = isPastDay || (isToday && nowMin >= taskIt.endMin);
                const autoDoneLocal = autoDoneTime && manual !== 'pending';
                const visuallyDone =
                  manual === 'pending' ? false : manual === 'completed' ? true : (completed || autoDoneLocal);

                const baseColorRaw2 = t?.themeColor || COLORS.primary;
                const baseNorm2 = String(baseColorRaw2 || '').trim().toUpperCase();
                const baseHex2 = baseNorm2.startsWith('#') ? baseNorm2 : `#${baseNorm2}`;
                const isYellow2 = baseHex2 === '#DDF622' || baseHex2 === '#FCFFC6' || baseHex2 === '#FFFFBA';
                const isPink2 = baseHex2 === '#FFB3BA' || baseHex2 === '#FFD9D9' || baseHex2 === '#FF6666';
                const cardBg2 = isYellow2 ? '#FCFFC6' : isPink2 ? '#FFD9D9' : baseColorRaw2;
                const stripColor2 =
                  isYellow2
                    ? '#DDF622'
                    : isPink2
                      ? '#FF6666'
                      : (intensifyHex(baseHex2) || '#000000');

                return (
                  <Pressable
                    key={String(t.id)}
                    style={styles.swipePanel}
                    onPress={() => onPressItem?.(t)}
                    onLongPress={() => onLongPressItem?.(t)}
                  >
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: cardBg2,
                          borderColor: isYellow2 ? 'rgba(69,44,22,0.20)' : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <View style={styles.stripSlot}>
                        <View
                          style={[
                            styles.stripPill,
                            { backgroundColor: stripColor2 },
                            isYellow2 ? styles.stripPillYellow : styles.stripPillDefault,
                          ]}
                        />
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.metaRow}>
                          <Text style={styles.timeRangeText} numberOfLines={1} ellipsizeMode="tail">
                            {`${t.startTime}-${t.endTime}`}
                          </Text>
                          <Image source={NOTE_ICON} style={styles.noteIcon} resizeMode="contain" />
                        </View>
                        <Text style={styles.titleText} numberOfLines={1}>
                          {t.title}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.checkBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          if (typeof onSetCompleted === 'function') onSetCompleted(t.id, !visuallyDone);
                          else onToggleComplete?.(t.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={visuallyDone ? DONE_ICON : EMPTY_ICON}
                          style={styles.checkIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                );
              };

              if (sameStartGroup) {
                return (
                  <View key={`swipe-${it.startMin}`} style={[styles.swipeWrap, { top, height }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {sameStartGroup.map(renderSwipeCard)}
                    </ScrollView>
                  </View>
                );
              }

              return (
                <Pressable
                  key={String(task.id)}
                  style={[
                    styles.cardWrap,
                    {
                      top: draggingId === String(task.id) ? top : top,
                      height,
                      left: `${leftPct * 100}%`,
                      width: `${widthPct * 100}%`,
                      paddingRight: concurrentCount > 1 ? laneGap : 0,
                    },
                  ]}
                  {...responder.panHandlers}
                  onPress={() => onPressItem?.(task)}
                  onLongPress={() => onLongPressItem?.(task)}
                >
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: cardBg,
                        borderColor: isYellow ? 'rgba(69,44,22,0.20)' : 'rgba(0,0,0,0.06)',
                      },
                      activeNow ? styles.cardActiveNow : null,
                    ]}
                  >
                    <View style={styles.stripSlot}>
                      <View
                        style={[
                          styles.stripPill,
                          { backgroundColor: stripColor },
                          isYellow ? styles.stripPillYellow : styles.stripPillDefault,
                        ]}
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.metaRow}>
                        <Text
                          style={styles.timeRangeText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {metaLabel}
                        </Text>
                        {isSingleInDay ? (
                          <TouchableOpacity
                            style={styles.editNearTimeBtn}
                            onPress={() => onPressItem?.(task)}
                            activeOpacity={0.85}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Image source={NOTE_ICON} style={styles.noteIcon} resizeMode="contain" />
                          </TouchableOpacity>
                        ) : (
                          <Image source={NOTE_ICON} style={styles.noteIcon} resizeMode="contain" />
                        )}
                      </View>

                      <Text
                        style={styles.titleText}
                        numberOfLines={height < 70 ? 1 : 2}
                      >
                        {task.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.checkBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        if (typeof onSetCompleted === 'function') {
                          onSetCompleted(task.id, !isVisuallyCompleted);
                        } else {
                          onToggleComplete?.(task.id);
                        }
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Image
                        source={isVisuallyCompleted ? DONE_ICON : EMPTY_ICON}
                        style={styles.checkIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const SCALE_COL_W = 56;
const FIGMA_RAIL_X = 45;
const NOW_PILL_W = 40;
const NOW_LINE_GAP = 8;
const NOW_ROW_H = 20;
const NOW_RAIL_GAP_Y = 10;
const NOW_STEM_EXTENT = 64;
const CARD_VERTICAL_GAP = 4;
const CARD_MIN_HEIGHT = 36;
const CARDS_LEFT_GAP_FROM_RAIL = 16;
const TIME_LABEL_W = 56;
const RAIL_SEGMENT_H = 48;
const TIME_LABEL_SHIFT_Y = -8;
const HOUR_LABEL_H = 16;
const HOUR_RAIL_GAP_Y = 6;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: SPACING.md,
    paddingBottom: 0,
    paddingLeft: 8,
    overflow: 'visible',
  },
  content: {
    flexDirection: 'row',
    paddingRight: SPACING.md,
    position: 'relative',
    overflow: 'visible',
  },
  scaleCol: {
    width: SCALE_COL_W,
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 2,
  },
  hourSlot: {
    position: 'absolute',
    left: FIGMA_RAIL_X - TIME_LABEL_W / 2,
    width: TIME_LABEL_W,
    alignItems: 'center',
  },
  hourText: {
    fontSize: 12,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    lineHeight: 15,
    textAlign: 'center',
    flexWrap: 'nowrap',
    includeFontPadding: false,
    width: TIME_LABEL_W,
  },
  timelineCol: {
    flex: 1,
    position: 'relative',
    paddingLeft: CARDS_LEFT_GAP_FROM_RAIL,
  },
  railSegment: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    width: 1,
    backgroundColor: FIGMA_STROKE,
  },
  railTopStem: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    top: 0,
    width: 1,
    backgroundColor: FIGMA_STROKE,
  },
  railBottomStem: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    width: 1,
    backgroundColor: FIGMA_STROKE,
  },
  hourRailCut: {
    position: 'absolute',
    left: FIGMA_RAIL_X - 6,
    width: 12,
    height: HOUR_LABEL_H + HOUR_RAIL_GAP_Y * 2,
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  taskStartMarker: {
    position: 'absolute',
    left: FIGMA_RAIL_X - TIME_LABEL_W / 2,
    width: TIME_LABEL_W,
    alignItems: 'center',
    transform: [{ translateY: TIME_LABEL_SHIFT_Y }],
  },
  taskStartMarkerText: {
    fontSize: 12,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    lineHeight: 15,
    flexWrap: 'nowrap',
    includeFontPadding: false,
    minWidth: TIME_LABEL_W,
    textAlign: 'center',
  },
  hourGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'transparent',
  },
  nowRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: NOW_ROW_H,
    justifyContent: 'center',
    zIndex: 1,
    elevation: 0,
    overflow: 'visible',
  },
  nowRailCut: {
    position: 'absolute',
    left: FIGMA_RAIL_X - 6,
    top: (NOW_ROW_H - 16) / 2 - NOW_RAIL_GAP_Y,
    width: 12,
    height: 16 + NOW_RAIL_GAP_Y * 2,
    backgroundColor: '#FFFFFF',
  },
  nowStemTop: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    top: -NOW_STEM_EXTENT,
    width: 1,
    height: Math.max(0, (NOW_ROW_H - 16) / 2 - NOW_RAIL_GAP_Y + NOW_STEM_EXTENT),
    backgroundColor: FIGMA_STROKE,
  },
  nowStemBottom: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    top: (NOW_ROW_H - 16) / 2 + 16 + NOW_RAIL_GAP_Y,
    width: 1,
    height: NOW_STEM_EXTENT,
    backgroundColor: FIGMA_STROKE,
  },
  nowPill: {
    width: NOW_PILL_W,
    height: 16,
    borderRadius: 8,
    backgroundColor: NOW_PILL_BG,
    borderWidth: 1,
    borderColor: NOW_PILL_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: (NOW_ROW_H - 16) / 2,
    left: FIGMA_RAIL_X - NOW_PILL_W / 2,
  },
  nowPillText: {
    fontSize: 12,
    color: FIGMA_BROWN,
    fontFamily: FONTS.medium,
    lineHeight: 16,
    includeFontPadding: false,
  },
  nowLineLeft: {
    position: 'absolute',
    left: 0,
    top: NOW_ROW_H / 2 - 1,
    width: 0,
    height: 0,
    borderTopWidth: 0,
  },
  nowLineRight: {
    position: 'absolute',
    left: FIGMA_RAIL_X + (NOW_PILL_W / 2) + NOW_LINE_GAP,
    right: 0,
    top: NOW_ROW_H / 2 - 1,
    height: 0,
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderColor: FIGMA_STROKE,
  },
  itemsLayer: {
    position: 'relative',
    paddingLeft: 8,
    paddingRight: 2,
    zIndex: 0,
  },
  cardWrap: {
    position: 'absolute',
  },
  swipeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
  },
  swipePanel: {
    width: 280,
    marginRight: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardActiveNow: {
    borderColor: FIGMA_BROWN,
    borderWidth: 1.5,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  stripSlot: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripPill: {
    width: 6,
    height: 46,
    borderRadius: 8,
    marginLeft: 9,
    shadowOpacity: 0,
    elevation: 0,
  },
  stripPillDefault: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  stripPillYellow: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 44,
    justifyContent: 'center',
    minHeight: 0,
  },
  editNearTimeBtn: {
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  timeRangeText: {
    fontSize: 10,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    flexShrink: 1,
    paddingRight: 0,
  },
  noteIcon: {
    width: 16,
    height: 16,
    tintColor: FIGMA_STROKE,
    marginLeft: 10,
  },
  titleText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  checkBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -14 }],
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
});

