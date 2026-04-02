import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../styles/theme';

const MINUTES_IN_DAY = 24 * 60;
const FIGMA_STROKE = '#898989';
const FIGMA_BROWN = '#452C16';
const FIGMA_BROWN_40 = 'rgba(69,44,22,0.40)';
const KYIV_TZ = 'Europe/Kyiv';
const TIMEZONE_MODE = 'device'; // 'device' | 'kyiv'

const NOTE_ICON = require('../../assets/icons/Group.png');
// Use vector icon for "empty" state to avoid filled-looking bitmap on some devices.
// (The Figma-provided ellipse bitmap can appear filled depending on scaling.)

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
  // Returns { dateKey: 'YYYY-MM-DD', hours: number, minutes: number }.
  // TIMEZONE_MODE:
  // - 'device': uses the user's device time zone
  // - 'kyiv': forces Europe/Kyiv
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

function darkenHex(hex, amount = 0.25) {
  // amount: 0..1 (towards black)
  const h = typeof hex === 'string' ? hex.replace('#', '') : '';
  if (h.length !== 6) return hex || COLORS.primaryStrong;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `rgb(${dr},${dg},${db})`;
}

function computeLanes(items) {
  // Simple greedy interval graph coloring for overlaps (same-day only).
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

export default function DayTimeline({
  dateKey,
  items,
  onPressItem,
  onLongPressItem,
  onToggleComplete,
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
  const effectiveDateKey = dateKey || todayKey; // fallback so "now" works even if dateKey is missing
  const isTodayLiteral = !!effectiveDateKey && effectiveDateKey === todayKey;
  const isPastDayLiteral =
    !!effectiveDateKey && !!todayKey && effectiveDateKey < todayKey; // YYYY-MM-DD compares lexicographically

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

    // Full-day timeline: 00:00 → 24:00 (next day's 00:00)
    return { laneCount, items: withLane, startMin: 0, endMin: MINUTES_IN_DAY };
  }, [items]);

  const minutesSpan = clean.endMin - clean.startMin;
  const PX_PER_MIN = 1.25; // tuned for visual density
  // Make the 00:00 "breathing space" clearly visible and symmetric.
  const TOP_INSET = 26; // keeps 00:00 visible and stable under header
  const BOTTOM_INSET = 26; // symmetric bottom space (end of day)
  const ZERO_GAP = 12; // gap before/after 00:00 and before/after day end
  // Bottom space should match the real bottom panel only.
  // Avoid adding extra blank area when there are no late tasks.
  const scrollBottomPad = Math.max(0, bottomPadding || 0);
  const timelineHeight = Math.max(240, Math.round(minutesSpan * PX_PER_MIN) + TOP_INSET + BOTTOM_INSET);
  // Container includes ScrollView bottom padding so the rail can reach panel bottom.
  const contentHeight = timelineHeight + scrollBottomPad;

  const isToday = useMemo(() => isTodayLiteral, [isTodayLiteral]);
  const isPastDay = useMemo(() => isPastDayLiteral, [isPastDayLiteral]);

  // Show "now" line for today's selected date even if "now" is outside the
  // currently computed visible range (we clamp the position).
  const showNow = isToday;
  const unclampedNowTop = TOP_INSET + (nowMin - clean.startMin) * PX_PER_MIN;
  const nowTop = clamp(unclampedNowTop, 0, Math.max(0, timelineHeight - 1));

  const activeNowItem = useMemo(() => {
    if (!isToday) return null;
    // Prefer a non-completed item that is currently running.
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
    // Labels: 00:00 ... 23:00 (no 24:00 label)
    for (let m = 0; m <= MINUTES_IN_DAY - 60; m += 60) out.push(m);
    return out;
  }, []);

  const hoursTicks = useMemo(() => {
    const out = [];
    // Ticks for lines/segments: 00:00 ... 24:00 (include end-of-day tick)
    for (let m = 0; m <= MINUTES_IN_DAY; m += 60) out.push(m);
    return out;
  }, []);

  const suppressedHourLabels = useMemo(() => {
    // If "now" is too close to an hour label, hide the hour label to avoid overlaps.
    if (!showNow) return new Set();
    const thresholdMin = 5;
    const s = new Set();
    for (const h of hoursLabels) {
      if (Math.abs(h - nowMin) <= thresholdMin) s.add(h);
    }
    return s;
  }, [hoursLabels, nowMin, showNow]);

  const railSegments = useMemo(() => {
    // Design: vertical segments between hour labels.
    // Segment length in Figma is 42px.
    const segH = RAIL_SEGMENT_H;
    const half = segH / 2;
    const out = [];
    const topCap = TOP_INSET + ZERO_GAP; // start rail AFTER 00:00 gap
    const bottomCap = Math.max(
      topCap,
      timelineHeight - BOTTOM_INSET - ZERO_GAP - segH,
    ); // end rail BEFORE day-end gap
    // Caps: keep rail visible before first and after last hour
    out.push({ key: 'seg-cap-top', top: topCap, height: segH });
    // IMPORTANT: skip the last interval (23→24) so after 23:00 we only have ONE short segment.
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
    // Show exact start times (e.g. 10:15) near the rail, aligned with cards.
    // Only for non-hour times to avoid duplicating hour labels.
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
      // Avoid overlapping with hour labels (keep only one label in the gutter)
      const nearHour = hourTops.has(Math.round(top)) ||
        Array.from(hourTops).some((t) => Math.abs(t - top) < 14);
      if (nearHour) continue;
      out.push({ key: `mark-${label}`, top, label });
    }
    return out;
  }, [TOP_INSET, clean.items, clean.startMin, PX_PER_MIN, hoursLabels, nowMin, showNow]);

  const firstItemStartMin = useMemo(() => {
    return clean.items.reduce((acc, it) => Math.min(acc, it.startMin), Number.POSITIVE_INFINITY);
  }, [clean.items]);

  useEffect(() => {
    // Auto-scroll ONLY once per selected day, and never after user starts scrolling.
    if (userInteractedRef.current) return;
    if (!effectiveDateKey) return;
    if (lastAutoScrollKeyRef.current === effectiveDateKey) return;

    // Today → near "now"; other days → near first item; fallback → top.
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
        {/* Top stem: visible BEFORE 00:00, but with a gap around 00:00 */}
        <View
          style={[styles.railTopStem, { height: Math.max(0, TOP_INSET - ZERO_GAP) }]}
          pointerEvents="none"
        />
        {/* Bottom stem: visible AFTER day end (symmetric) */}
        <View
          style={[
            styles.railBottomStem,
            {
              // Start immediately after the last short segment and go straight to the panel bottom.
              top: railBottomCapTop + RAIL_SEGMENT_H,
              height: Math.max(0, contentHeight - (railBottomCapTop + RAIL_SEGMENT_H)),
            },
          ]}
          pointerEvents="none"
        />
        {/* Hour scale */}
        <View style={styles.scaleCol}>
          {hoursLabels.map((m) => (
            <View
              key={m}
              style={[
                styles.hourSlot,
                { top: TOP_INSET + (m - clean.startMin) * PX_PER_MIN },
                m === 0
                  ? { transform: [{ translateY: -6 }] } // keep 00:00 a bit higher
                  : { transform: [{ translateY: -9 }] },
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

        {/* Rail segments + exact start-time markers (left gutter) */}
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
          <View style={[styles.nowRow, { top: nowTop }]} pointerEvents="none">
            <View style={styles.nowPillStem} />
            <View style={styles.nowPill}>
              <Text style={styles.nowPillText}>{formatHHMM(nowMin)}</Text>
            </View>
            <View style={styles.nowLineLeft} />
            <View style={styles.nowLineRight} />
            {activeNowItem ? (
              <View style={styles.nowActiveLabel}>
                <Text style={styles.nowActiveLabelText} numberOfLines={1} ellipsizeMode="tail">
                  {activeNowItem.title}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Grid + items */}
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
              const isCompleted = task?.status === 'completed';
              const autoDone = isPastDay || (isToday && nowMin >= it.endMin); // past day => all done
              const isVisuallyCompleted = isCompleted || autoDone;
              const activeNow = isToday && nowMin >= it.startMin && nowMin < it.endMin && !isVisuallyCompleted;

              const top = TOP_INSET + (it.startMin - clean.startMin) * PX_PER_MIN;
              const height = Math.max(64, (it.endMin - it.startMin) * PX_PER_MIN);

              // Width should depend on overlaps at THIS time, not overall day.
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

              const baseColor = task?.themeColor || COLORS.primary;
              const cardBg = baseColor;
              const stripColor = darkenHex(baseColor, 0.25);
              const durationLabel = formatDurationUk(it.endMin - it.startMin);
              const metaLabel = `${task.startTime}-${task.endTime}${durationLabel ? ` (${durationLabel})` : ''}`;

              return (
                <TouchableOpacity
                  key={String(task.id)}
                  activeOpacity={0.9}
                  style={[
                    styles.cardWrap,
                    {
                      top,
                      height,
                      left: `${leftPct * 100}%`,
                      width: `${widthPct * 100}%`,
                      paddingRight: clean.laneCount > 1 ? laneGap : 0,
                    },
                  ]}
                  onPress={() => onPressItem?.(task)}
                  onLongPress={() => onLongPressItem?.(task)}
                >
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: cardBg, opacity: isVisuallyCompleted ? 0.55 : 1 },
                      activeNow ? styles.cardActiveNow : null,
                    ]}
                  >
                    <View style={styles.stripSlot}>
                      <View style={[styles.stripPill, { backgroundColor: stripColor }]} />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.metaRow}>
                        <Text style={styles.timeRangeText} numberOfLines={1} ellipsizeMode="tail">
                          {metaLabel}
                        </Text>
                        <Image source={NOTE_ICON} style={styles.noteIcon} resizeMode="contain" />
                      </View>

                      <Text
                        style={[styles.titleText, isVisuallyCompleted ? styles.titleCompleted : null]}
                        numberOfLines={height < 70 ? 1 : 2}
                      >
                        {task.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.checkBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        // If task is already in the past, we show it as completed automatically.
                        // Avoid toggling back/forth into confusing state.
                        if (autoDone) return;
                        onToggleComplete?.(task.id);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {isVisuallyCompleted ? (
                        <View style={styles.checkFilled}>
                          <Icon name="checkmark" size={18} color="#FFF" />
                        </View>
                      ) : (
                        <Icon name="ellipse-outline" size={24} color={FIGMA_STROKE} />
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Figma coordinates (inside the timeline component)
// Left column (with time labels) in design is ~40px.
// Keep labels BETWEEN left edge and the rail (not outside the screen).
const SCALE_COL_W = 56;
const FIGMA_RAIL_X = 29; // vertical axis x
const NOW_PILL_W = 40;
const NOW_LINE_GAP = 6;
const CARDS_LEFT_GAP_FROM_RAIL = 16; // small gap between axis and cards
const TIME_LABEL_X = 15; // Figma: time text starts around x=15
const RAIL_SEGMENT_H = 42;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: SPACING.md,
    paddingBottom: 0,
    paddingLeft: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    paddingRight: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  scaleCol: {
    width: SCALE_COL_W,
    alignItems: 'flex-start',
    position: 'relative',
  },
  hourSlot: {
    position: 'absolute',
    left: 0,
    width: SCALE_COL_W,
    alignItems: 'flex-start',
    paddingLeft: TIME_LABEL_X,
    paddingRight: 6,
  },
  hourText: {
    fontSize: 12,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    lineHeight: 15,
    textAlign: 'left',
    flexWrap: 'nowrap',
    includeFontPadding: false,
    minWidth: 44,
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
  taskStartMarker: {
    position: 'absolute',
    left: 0,
    width: SCALE_COL_W,
    alignItems: 'flex-start',
    paddingLeft: TIME_LABEL_X,
    paddingRight: 6,
    transform: [{ translateY: -7 }],
  },
  taskStartMarkerText: {
    fontSize: 12,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    lineHeight: 15,
    flexWrap: 'nowrap',
    includeFontPadding: false,
    minWidth: 44,
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
    height: 20,
    justifyContent: 'center',
  },
  nowPillStem: {
    position: 'absolute',
    left: FIGMA_RAIL_X,
    top: -20,
    width: 1,
    height: 20,
    backgroundColor: FIGMA_STROKE,
  },
  nowPill: {
    width: NOW_PILL_W,
    height: 16,
    borderRadius: 8,
    backgroundColor: FIGMA_BROWN_40,
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -8,
    // Center the pill on the rail (between the vertical segments).
    left: FIGMA_RAIL_X - NOW_PILL_W / 2,
  },
  nowPillText: {
    fontSize: 12,
    color: FIGMA_BROWN,
    fontFamily: FONTS.medium,
    lineHeight: 16,
    includeFontPadding: false,
  },
  nowActiveLabel: {
    position: 'absolute',
    left: FIGMA_RAIL_X + 12,
    right: 12,
    height: 18,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.20)',
  },
  nowActiveLabelText: {
    fontSize: 12,
    color: FIGMA_BROWN,
    fontFamily: FONTS.medium,
    lineHeight: 16,
    includeFontPadding: false,
  },
  nowLineLeft: {
    position: 'absolute',
    left: 0,
    width: FIGMA_RAIL_X - (NOW_PILL_W / 2) - NOW_LINE_GAP,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: FIGMA_STROKE,
  },
  nowLineRight: {
    position: 'absolute',
    left: FIGMA_RAIL_X + (NOW_PILL_W / 2) + NOW_LINE_GAP,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: FIGMA_STROKE,
  },
  itemsLayer: {
    position: 'relative',
    paddingLeft: 8,
    paddingRight: 2,
  },
  cardWrap: {
    position: 'absolute',
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
  },
  cardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingRight: 44,
    justifyContent: 'center',
    minHeight: 64,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeRangeText: {
    fontSize: 10,
    color: FIGMA_STROKE,
    fontFamily: FONTS.medium,
    flex: 1,
    paddingRight: 8,
  },
  noteIcon: {
    width: 12,
    height: 12,
    tintColor: FIGMA_STROKE,
  },
  titleText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  // empty icon uses Ionicons directly
  checkFilled: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentBrown,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
});

