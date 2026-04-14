import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  ScrollView as GHScrollView,
  Pressable as GHPressable,
} from 'react-native-gesture-handler';
import Svg, { Line, Path } from 'react-native-svg';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../styles/theme';
import {
  TIMELINE_HORIZONTAL_RHYTHM_PX,
  TIMELINE_RAIL_STROKE_WIDTH_PX,
  TIMELINE_RAIL_VIEW_LINE_PX,
  TIMELINE_HOUR_LABEL_WIDTH_PX,
  TIMELINE_RAIL_CENTER_X_PX,
  TIMELINE_SCALE_COLUMN_WIDTH_PX,
  TIMELINE_RAIL_STROKE,
  TIMELINE_RAIL_AXIS_STROKE,
  TIMELINE_NOW_HORIZ_STROKE,
  TIMELINE_NOW_HORIZ_OPACITY,
  TIMELINE_NOW_HORIZ_DASH_ARRAY,
  TASK_STRIP_PILL_WIDTH_PX,
  TASK_STRIP_PILL_RADIUS_PX,
  TASK_STRIP_COLUMN_WIDTH_PX,
  TASK_CARD_INNER_PADDING_LEFT_PX,
  TASK_CARD_STRIP_TO_TEXT_GAP_PX,
  TASK_CARD_TEXT_INSET_FROM_CARD_LEFT_PX,
  OVERLAP_COLUMN_GUTTER_PX,
  TASK_CARD_BODY_PADDING_RIGHT_PX,
  TASK_CHECK_BTN_RIGHT_PX,
} from '../../constants/timelineLayout';
import {
  resolveTaskCardBackground,
  resolveTaskStripColor,
  isLemonTaskTheme,
  isWhiteTaskTheme,
  isSkyTaskTheme,
  isMintTaskTheme,
  isLilacTaskTheme,
} from '../../constants/taskThemeColors';

const MINUTES_IN_DAY = 24 * 60;

const NOW_PILL_BG = 'rgba(69, 44, 22, 0.4)';
const NOW_PILL_TEXT = '#FFFFFF';
const KYIV_TZ = 'Europe/Kyiv';

const TIMEZONE_MODE = 'device';

const TALL_TASK_CARD_MIN_PX = 90;

const MIN_READABLE_OVERLAP_COLUMN_PX = 118;


const OVERLAP_CAROUSEL_CARD_W = 196;
const OVERLAP_CAROUSEL_SLOT_GAP = TIMELINE_HORIZONTAL_RHYTHM_PX;

const DRAG_HOLD_MS = 420;

const NOTE_ICON = require('../../assets/icons/Group.png');
const DONE_ICON = require('../../assets/icons/Group34.png');
const EMPTY_ICON = require('../../assets/icons/Ellipse 32.png');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}


function stripLeadingListMarker(s) {
  return String(s ?? '')
    .trim()
    .replace(/^\s*[-–—•]\s+/, '')
    .trim();
}


const TASK_CARD_LINE_HEIGHT = 18;

const MAX_TASK_CARD_DESCRIPTION_LINES = 32;


function getTaskCardTitle(task) {
  if (!task) return '';
  const titleRaw = String(task.title ?? '').trim();
  if (titleRaw.length > 0) {
    const cleaned = stripLeadingListMarker(titleRaw);
    return cleaned.length > 0 ? cleaned : titleRaw;
  }
  const descRaw = String(task.description ?? '').trim();
  if (!descRaw) return '';
  const cleanedDesc = stripLeadingListMarker(descRaw);
  return cleanedDesc.length > 0 ? cleanedDesc : descRaw;
}

function taskHasExplicitTitle(task) {
  return String(task?.title ?? '').trim().length > 0;
}


function getTaskCardDescriptionBody(task) {
  if (!task || !taskHasExplicitTitle(task)) return '';
  const descRaw = String(task.description ?? '').trim();
  if (!descRaw) return '';
  const cleaned = stripLeadingListMarker(descRaw);
  return cleaned.length > 0 ? cleaned : descRaw;
}


function computeTaskCardTextLayout({
  cardHeightPx,
  compact,
  tallLayout,
  soloSlotLayout,
  singleWideLayout,
  showDescriptionFooter,
  carousel,
}) {
  if (!Number.isFinite(cardHeightPx) || cardHeightPx < 40) {
    return { titleLines: 1, descriptionLines: 0 };
  }

  const titleLH = TASK_CARD_LINE_HEIGHT;

  
  if (compact) {
    if (!showDescriptionFooter) return { titleLines: 1, descriptionLines: 0 };
    const padTop = 6;
    const padBottom = 6;
    const bottomForCheck = 14;
    const availableBase = cardHeightPx - padTop - padBottom - bottomForCheck;
    if (availableBase < titleLH * 1.15) return { titleLines: 1, descriptionLines: 0 };
    const totalSlots = Math.floor(availableBase / titleLH);
    if (totalSlots < 2) return { titleLines: 1, descriptionLines: 0 };
    const descriptionLines = Math.min(MAX_TASK_CARD_DESCRIPTION_LINES, Math.max(1, totalSlots - 1));
    const titleLines = Math.max(1, totalSlots - descriptionLines);
    return {
      titleLines: clamp(titleLines, 1, 4),
      descriptionLines: clamp(descriptionLines, 1, MAX_TASK_CARD_DESCRIPTION_LINES),
    };
  }

  let padTop;
  let padBottom;
  if (carousel) {
    padTop = tallLayout ? 6 : 8;
    padBottom = tallLayout ? 40 : 10;
  } else if (soloSlotLayout && singleWideLayout) {
    if (tallLayout) {
      padTop = 8;
      padBottom = 42;
    } else {
      padTop = 10;
      padBottom = 10;
    }
  } else if (tallLayout) {
    padTop = 6;
    padBottom = 40;
  } else {
    padTop = 8;
    padBottom = 10;
  }

  let metaReserve = 0;
  if (cardHeightPx >= 34) {
    metaReserve = carousel ? 20 : singleWideLayout ? 26 : 22;
  }

  const bottomForCheck = tallLayout ? 8 : soloSlotLayout || carousel ? 20 : 14;

  const availableBase =
    cardHeightPx - padTop - padBottom - metaReserve - bottomForCheck;
  if (availableBase < titleLH * 0.85) {
    return { titleLines: 1, descriptionLines: 0 };
  }

  if (!showDescriptionFooter) {
    const lines = Math.floor(availableBase / titleLH);
    return { titleLines: clamp(Number.isFinite(lines) && lines >= 1 ? lines : 1, 1, 12), descriptionLines: 0 };
  }

  const totalSlots = Math.floor(availableBase / titleLH);
  
  if (totalSlots < 2) {
    const lines = Math.floor(availableBase / titleLH);
    return { titleLines: clamp(Number.isFinite(lines) && lines >= 1 ? lines : 1, 1, 12), descriptionLines: 0 };
  }

  
  if (totalSlots === 2) {
    return { titleLines: 1, descriptionLines: 1 };
  }

  
  let titleLines = Math.max(1, Math.min(12, Math.round(totalSlots * 0.4)));
  let descriptionLines = totalSlots - titleLines;
  if (descriptionLines < 1) {
    titleLines = Math.max(1, totalSlots - 1);
    descriptionLines = 1;
  }
  descriptionLines = Math.min(MAX_TASK_CARD_DESCRIPTION_LINES, descriptionLines);
  return {
    titleLines: clamp(titleLines, 1, 12),
    descriptionLines: clamp(descriptionLines, 1, MAX_TASK_CARD_DESCRIPTION_LINES),
  };
}


function computeStripPillHeight(cardHeightPx, compact, tallLayout = false) {
  if (!Number.isFinite(cardHeightPx) || cardHeightPx < 16) return 12;
  if (tallLayout && !compact && cardHeightPx >= TALL_TASK_CARD_MIN_PX) {
    const vInset = 10;
    const h = Math.round(cardHeightPx - vInset * 2);
    return clamp(h, 36, Math.max(36, cardHeightPx - vInset * 2));
  }
  if (compact) {
    const byRatio = Math.round(cardHeightPx * 0.48);
    const maxH = Math.max(11, cardHeightPx - 12);
    return clamp(byRatio, 10, maxH);
  }
  if (cardHeightPx < 40) {
    return clamp(Math.round(cardHeightPx * 0.55), 12, Math.max(13, cardHeightPx - 7));
  }
  const verticalReserve = 18;
  const byRatio = Math.round(cardHeightPx * 0.74);
  const maxH = Math.max(36, cardHeightPx - verticalReserve);
  return clamp(byRatio, 20, maxH);
}

function parseHHMM(value) {
  if (!value || typeof value !== 'string' || !value.includes(':')) return null;
  const [hRaw, mRaw] = value.split(':');
  const h = Number(String(hRaw).trim());
  const m = Number(String(mRaw).trim());
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


function formatTimelineLabel(totalMinutes) {
  const m = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, '0')}`;
}

function formatTimelineRangeFromStored(startStr, endStr) {
  const a = parseHHMM(startStr);
  const b = parseHHMM(endStr);
  if (a == null || b == null) return `${startStr ?? ''}-${endStr ?? ''}`;
  return `${formatTimelineLabel(a)}-${formatTimelineLabel(b)}`;
}

function getNowParts() {
  try {
    if (TIMEZONE_MODE === 'device') {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return {
        dateKey: `${y}-${m}-${day}`,
        hours: d.getHours(),
        minutes: d.getMinutes(),
      };
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
    return {
      dateKey: `${y}-${m}-${day}`,
      hours: d.getHours(),
      minutes: d.getMinutes(),
    };
  }
}

function durationMinForLane(it) {
  return Math.max(0, it.endMin - it.startMin);
}


function sortItemsForLanePlacement(a, b) {
  if (a.startMin !== b.startMin) return a.startMin - b.startMin;
  const da = durationMinForLane(a);
  const db = durationMinForLane(b);
  if (da !== db) return db - da;
  if (a.endMin !== b.endMin) return a.endMin - b.endMin;
  const ai = Number.isFinite(a.raw?.sortIndex) ? a.raw.sortIndex : 0;
  const bi = Number.isFinite(b.raw?.sortIndex) ? b.raw.sortIndex : 0;
  if (ai !== bi) return ai - bi;
  return String(a.raw?.id ?? '').localeCompare(String(b.raw?.id ?? ''));
}


function sortForGreedyLaneAssignment(a, b) {
  if (a.startMin !== b.startMin) return a.startMin - b.startMin;
  if (a.endMin !== b.endMin) return a.endMin - b.endMin;
  const ai = Number.isFinite(a.raw?.sortIndex) ? a.raw.sortIndex : 0;
  const bi = Number.isFinite(b.raw?.sortIndex) ? b.raw.sortIndex : 0;
  if (ai !== bi) return ai - bi;
  return String(a.raw?.id ?? '').localeCompare(String(b.raw?.id ?? ''));
}


function computeLanes(items) {
  if (items.length === 0) {
    return { items: [], laneCount: 1 };
  }

  const sortedGreedy = [...items].sort(sortForGreedyLaneAssignment);
  const laneEnds = [];
  const globalLaneById = new Map();

  for (const it of sortedGreedy) {
    const tid = String(it.raw?.id ?? '');
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
    globalLaneById.set(tid, placedLane);
  }

  const clusters = buildOverlapClusters(items);
  const idToLane = new Map();
  let globalMaxLane = 0;

  for (const cluster of clusters) {
    const laneSet = new Set();
    for (const cit of cluster) {
      laneSet.add(globalLaneById.get(String(cit.raw?.id ?? '')) ?? 0);
    }
    const sortedLanes = [...laneSet].sort((x, y) => x - y);
    const laneRemap = new Map();
    sortedLanes.forEach((oldL, idx) => laneRemap.set(oldL, idx));

    for (const cit of cluster) {
      const tid = String(cit.raw?.id ?? '');
      const g = globalLaneById.get(tid) ?? 0;
      const displayLane = laneRemap.get(g) ?? 0;
      idToLane.set(tid, displayLane);
      globalMaxLane = Math.max(globalMaxLane, displayLane);
    }
  }

  const withLane = items.map((it) => ({
    ...it,
    lane: idToLane.get(String(it.raw?.id ?? '')) ?? 0,
  }));
  withLane.sort(sortItemsForLanePlacement);
  return { items: withLane, laneCount: Math.max(1, globalMaxLane + 1) };
}


function buildOverlapClusters(items) {
  const n = items.length;
  if (n === 0) return [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const a = items[i];
      const b = items[j];
      if (a.startMin < b.endMin && a.endMin > b.startMin) union(i, j);
    }
  }
  const buckets = new Map();
  for (let i = 0; i < n; i += 1) {
    const r = find(i);
    if (!buckets.has(r)) buckets.set(r, []);
    buckets.get(r).push(items[i]);
  }
  return Array.from(buckets.values());
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


function createTimeMovePanResponder({
  taskId,
  startMin0,
  endMin0,
  PX_PER_MIN,
  effectiveDateKey,
  onUpdateItem,
  onRescheduleItem,
  setDraggingId,
  userInteractedRef,
  shouldClaimDrag,
  clearDragHoldArm,
  onTimeMoveApplied,
}) {
  const duration0 = Math.max(5, endMin0 - startMin0);
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      if (!taskId || !shouldClaimDrag?.()) return false;
      const { dx, dy } = gestureState;
      if (Math.abs(dx) > Math.abs(dy)) return false;
      return Math.abs(dy) > 6;
    },
    onPanResponderGrant: () => {
      if (!shouldClaimDrag?.()) return;
      setDraggingId(String(taskId));
      if (userInteractedRef) userInteractedRef.current = true;
    },
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gestureState) => {
      const dy = gestureState?.dy || 0;
      setDraggingId(null);
      clearDragHoldArm?.();
      if (Math.abs(dy) < 6) return;
      onTimeMoveApplied?.(taskId);
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
        onUpdateItem(taskId, patch);
      }
      if (dayShift !== 0 && typeof onRescheduleItem === 'function') {
        const nextKey = addDaysToDateKey(effectiveDateKey, dayShift);
        onRescheduleItem(taskId, nextKey);
      }
    },
    onPanResponderTerminate: () => {
      setDraggingId(null);
      clearDragHoldArm?.();
    },
  });
}

const LIVE_HOUR_PILL_MIN_GAP = 10;

export default function DayTimeline({
  dateKey,
  items,
  onPressItem,
  onLongPressItem: _onLongPressItem,
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

  const todayKey = nowParts?.dateKey;
  const effectiveDateKey = dateKey || todayKey;
  const isTodayLiteral = !!effectiveDateKey && effectiveDateKey === todayKey;

  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    setNowParts(getNowParts());
    const intervalMs = 60_000;
    tickerRef.current = setInterval(() => {
      setNowParts(getNowParts());
    }, intervalMs);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [isTodayLiteral]);

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
      .filter(Boolean)
      .sort((a, b) => {
        if (a.startMin !== b.startMin) return a.startMin - b.startMin;
        const ai = Number.isFinite(a.raw?.sortIndex) ? a.raw.sortIndex : 1e9;
        const bi = Number.isFinite(b.raw?.sortIndex) ? b.raw.sortIndex : 1e9;
        if (ai !== bi) return ai - bi;
        return String(a.raw?.id ?? '').localeCompare(String(b.raw?.id ?? ''));
      });

    const { items: withLane, laneCount } = computeLanes(base);

    
    const startMin = 0;
    const endMin = MINUTES_IN_DAY;

    return { laneCount, items: withLane, startMin, endMin };
  }, [items]);

  const minutesSpan = clean.endMin - clean.startMin;
  const PX_PER_MIN = 1.25;
  const TOP_INSET = 22;
  const BOTTOM_INSET = clean.items.length > 0 ? 0 : 12;
  const scrollBottomPad = Math.max(0, bottomPadding || 0);
  const timelineHeight = Math.max(
    160,
    Math.round(minutesSpan * PX_PER_MIN) + TOP_INSET + BOTTOM_INSET,
  );
  const contentHeight = timelineHeight + scrollBottomPad;
  const railGeometryHeight = contentHeight + RAIL_EXTEND_BELOW_CONTENT_PX;

  const isToday = useMemo(() => isTodayLiteral, [isTodayLiteral]);

  const showNow = isToday;
  const unclampedNowTop = TOP_INSET + (nowMin - clean.startMin) * PX_PER_MIN;
  const nowTop = clamp(unclampedNowTop, 0, Math.max(0, timelineHeight - 1));

  const hoursLabels = useMemo(() => {
    const out = [];
    const firstHour = Math.floor(clean.startMin / 60) * 60;
    const lastHour =
      Math.floor(Math.max(clean.startMin, clean.endMin - 1) / 60) * 60;
    for (let m = firstHour; m <= lastHour; m += 60) {
      if (m <= MINUTES_IN_DAY - 60) out.push(m);
    }
    return out;
  }, [clean.startMin, clean.endMin]);

  const suppressedHourLabels = useMemo(() => {
    const s = new Set();
    if (!showNow) return s;

    const hourStartMin = Math.floor(nowMin / 60) * 60;
    s.add(hourStartMin);

    const nowBandTop = nowTop - NOW_ROW_H / 2 - NOW_BAND_VERTICAL_PAD_PX;
    const nowBandBottom = nowTop + NOW_ROW_H / 2 + NOW_BAND_VERTICAL_PAD_PX;

    for (const m of hoursLabels) {
      if (s.has(m)) continue;
      if (nowMin % 60 === 0 && m === nowMin) {
        s.add(m);
        continue;
      }
      const labelTop =
        TOP_INSET + (m - clean.startMin) * PX_PER_MIN + TIME_LABEL_SHIFT_Y;
      const labelBottom = labelTop + HOUR_LABEL_H;
      if (labelBottom >= nowBandTop && labelTop <= nowBandBottom) {
        s.add(m);
      }
    }
    return s;
  }, [
    showNow,
    hoursLabels,
    TOP_INSET,
    clean.startMin,
    PX_PER_MIN,
    nowTop,
    nowMin,
  ]);

  const liveHourBand = useMemo(() => {
    if (!showNow) return null;
    if (nowMin % 60 === 0) return null;
    const hourStartMin = Math.floor(nowMin / 60) * 60;
    const nextHourStart = hourStartMin + 60;
    const yHourTop = TOP_INSET + (hourStartMin - clean.startMin) * PX_PER_MIN;
    const yNextHourTop = TOP_INSET + (nextHourStart - clean.startMin) * PX_PER_MIN;
    const blockTopBase = yHourTop + TIME_LABEL_SHIFT_Y;
    const pillTop = nowTop - NOW_ROW_H / 2;
    const blockBottom = blockTopBase + HOUR_LABEL_H;
    const overlap = blockBottom - (pillTop - LIVE_HOUR_PILL_MIN_GAP);
    const anchorShiftY =
      overlap > 0 ? -Math.min(Math.ceil(overlap), 56) : 0;
    return {
      hourStartMin,
      nextHourStart,
      yHourTop,
      yNextHourTop,
      anchorShiftY,
    };
  }, [
    showNow,
    nowMin,
    TOP_INSET,
    clean.startMin,
    PX_PER_MIN,
    nowTop,
  ]);

  
  const railVerticalBodySegments = useMemo(() => {
    const yMax = railGeometryHeight;
    const blocks = [];

    for (const m of hoursLabels) {
      if (suppressedHourLabels.has(m)) continue;
      const top =
        TOP_INSET +
        (m - clean.startMin) * PX_PER_MIN +
        TIME_LABEL_SHIFT_Y -
        HOUR_RAIL_GAP_Y;
      blocks.push({ top, bottom: top + HOUR_LABEL_RAIL_GAP_H });
    }

    if (liveHourBand) {
      const top =
        liveHourBand.yHourTop +
        TIME_LABEL_SHIFT_Y +
        liveHourBand.anchorShiftY -
        HOUR_RAIL_GAP_Y;
      blocks.push({ top, bottom: top + HOUR_LABEL_RAIL_GAP_H });
    }

    if (showNow) {
      const labelSet = new Set(hoursLabels);
      const onRoundHour = nowMin % 60 === 0 && labelSet.has(nowMin);
      if (onRoundHour) {
        const m = nowMin;
        const hourTop =
          TOP_INSET +
          (m - clean.startMin) * PX_PER_MIN +
          TIME_LABEL_SHIFT_Y -
          HOUR_RAIL_GAP_Y;
        const hourBottom = hourTop + HOUR_LABEL_RAIL_GAP_H;
        const bandH = NOW_ROW_H + NOW_BAND_VERTICAL_PAD_PX * 2;
        const bandTop = nowTop - bandH / 2;
        const bandBottom = bandTop + bandH;
        blocks.push({
          top: Math.min(hourTop, bandTop),
          bottom: Math.max(hourBottom, bandBottom),
        });
      } else {
        const half = NOW_PILL_BLOCK_H / 2 + 2;
        blocks.push({ top: nowTop - half, bottom: nowTop + half });
      }
    }

    blocks.sort((a, b) => a.top - b.top);
    const merged = [];
    for (const b of blocks) {
      if (!merged.length || b.top > merged[merged.length - 1].bottom + 0.5) {
        merged.push({ top: b.top, bottom: b.bottom });
      } else {
        merged[merged.length - 1].bottom = Math.max(merged[merged.length - 1].bottom, b.bottom);
      }
    }

    const segments = [];
    let cur = 0;
    for (const b of merged) {
      const gapEnd = Math.min(b.top, yMax);
      if (gapEnd > cur + 0.5) {
        segments.push({ y1: cur, y2: gapEnd });
      }
      cur = Math.max(cur, Math.min(b.bottom, yMax));
      if (cur >= yMax) break;
    }
    if (yMax > cur + 0.5) {
      segments.push({ y1: cur, y2: yMax });
    }
    return segments;
  }, [
    railGeometryHeight,
    hoursLabels,
    suppressedHourLabels,
    liveHourBand,
    showNow,
    nowMin,
    nowTop,
    TOP_INSET,
    clean.startMin,
    PX_PER_MIN,
  ]);

  
  const taskIdToOverlapCluster = useMemo(() => {
    const clusters = buildOverlapClusters(clean.items);
    const m = new Map();
    for (const g of clusters) {
      for (const item of g) {
        m.set(String(item.raw?.id ?? ''), g);
      }
    }
    return m;
  }, [clean.items]);

  const [draggingId, setDraggingId] = useState(null);
  const isDragging = !!draggingId;
  const draggingIdRef = useRef(null);
  useEffect(() => {
    draggingIdRef.current = draggingId;
  }, [draggingId]);

  const dragHoldRef = useRef({ taskId: null, timer: null, armed: false });
  
  const dragArmFiredRef = useRef(false);
  const lastTimeDragTaskIdRef = useRef(null);

  const clearDragHoldArm = useCallback(() => {
    const h = dragHoldRef.current;
    if (h.timer) clearTimeout(h.timer);
    h.timer = null;
    h.taskId = null;
    h.armed = false;
  }, []);

  const beginDragHoldArm = useCallback(
    (taskId) => {
      dragArmFiredRef.current = false;
      clearDragHoldArm();
      const id = String(taskId ?? '');
      if (!id) return;
      dragHoldRef.current.taskId = id;
      dragHoldRef.current.timer = setTimeout(() => {
        if (dragHoldRef.current.taskId === id) {
          dragHoldRef.current.armed = true;
          dragArmFiredRef.current = true;
        }
      }, DRAG_HOLD_MS);
    },
    [clearDragHoldArm]
  );

  const markTimeMoveApplied = useCallback((movedTaskId) => {
    if (movedTaskId != null) lastTimeDragTaskIdRef.current = String(movedTaskId);
  }, []);

  useEffect(() => () => clearDragHoldArm(), [clearDragHoldArm]);

  const [timelineLaneWidth, setTimelineLaneWidth] = useState(0);
  const [timelineContentW, setTimelineContentW] = useState(0);
  const { width: windowWidth } = useWindowDimensions();

  
  const nowHorizontalDashGeom = useMemo(() => {
    if (!showNow) return null;
    const measured = timelineContentW;
    const padApprox = TIMELINE_HORIZONTAL_RHYTHM_PX * 2 + SPACING.md * 2;
    const w =
      measured > 8 ? measured : Math.max(120, Math.round(windowWidth - padApprox));
    const cx = TIMELINE_RAIL_CENTER_X_PX;
    const x1 = cx + NOW_PILL_TOTAL_W / 2 + NOW_HORIZ_DASH_AFTER_PILL_GAP_PX;
    const x2 = w - TIMELINE_HORIZONTAL_RHYTHM_PX;
    if (x2 <= x1 + 2) return null;
    const y = nowTop;
    return { x1, x2, y };
  }, [showNow, nowTop, timelineContentW, windowWidth]);

  const firstItemStartMin = useMemo(() => {
    return clean.items.reduce((acc, it) => Math.min(acc, it.startMin), Number.POSITIVE_INFINITY);
  }, [clean.items]);

  
  useEffect(() => {
    userInteractedRef.current = false;
    lastAutoScrollKeyRef.current = null;
  }, [effectiveDateKey]);

  useEffect(() => {
    if (userInteractedRef.current) return;
    if (!effectiveDateKey) return;

    const hasTasks = Number.isFinite(firstItemStartMin);
    const scrollIdentity = `${effectiveDateKey}:${hasTasks ? String(firstItemStartMin) : 'none'}`;
    if (lastAutoScrollKeyRef.current === scrollIdentity) return;

    
    let targetMin;
    if (hasTasks) {
      targetMin = firstItemStartMin;
    } else if (isToday) {
      targetMin = nowMinRef.current;
    } else {
      targetMin = 0;
    }
    const paddingMin = 45;
    const y = Math.max(0, TOP_INSET + (targetMin - clean.startMin - paddingMin) * PX_PER_MIN);

    const t = setTimeout(() => {
      scrollRef.current?.scrollTo?.({ y, animated: false });
      lastAutoScrollKeyRef.current = scrollIdentity;
    }, 0);
    return () => clearTimeout(t);
  }, [effectiveDateKey, isToday, firstItemStartMin, TOP_INSET, clean.startMin, PX_PER_MIN]);

  return (
    <GHScrollView
      ref={scrollRef}
      style={styles.wrap}
      contentContainerStyle={{ paddingBottom: 0 }}
      scrollEnabled={!isDragging}
      nestedScrollEnabled
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
      <View
        style={[styles.content, { height: contentHeight }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setTimelineContentW((prev) => (Math.abs(prev - w) < 1 ? prev : w));
        }}
      >
        <View style={styles.scaleColSpacer} pointerEvents="none" />

        <View
          pointerEvents="none"
          style={[styles.railVerticalDashLayer, { height: railGeometryHeight }]}
        >
          <Svg width="100%" height={railGeometryHeight}>
            {railVerticalBodySegments.map((seg, i) => (
              <Line
                key={`rv-${i}-${Math.round(seg.y1)}`}
                x1={TIMELINE_RAIL_CENTER_X_PX}
                y1={seg.y1}
                x2={TIMELINE_RAIL_CENTER_X_PX}
                y2={seg.y2}
                stroke={TIMELINE_RAIL_AXIS_STROKE}
                strokeOpacity={1}
                strokeWidth={
                  Platform.OS === 'android'
                    ? Math.max(2, TIMELINE_RAIL_STROKE_WIDTH_PX)
                    : TIMELINE_RAIL_STROKE_WIDTH_PX
                }
                strokeLinecap="butt"
              />
            ))}
          </Svg>
        </View>

        {hoursLabels.map((m) => (
          <View
            key={m}
            style={[
              styles.hourSlot,
              styles.hourSlotPositioned,
              { top: TOP_INSET + (m - clean.startMin) * PX_PER_MIN },
              { transform: [{ translateY: TIME_LABEL_SHIFT_Y }] },
            ]}
            pointerEvents="box-none"
            collapsable={false}
          >
            {suppressedHourLabels.has(m) ? null : (
              <Text style={styles.hourText} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                {formatTimelineLabel(m)}
              </Text>
            )}
          </View>
        ))}

        {liveHourBand ? (
          <View
            pointerEvents="none"
            style={[
              styles.hourSlot,
              styles.hourSlotPositioned,
              { top: liveHourBand.yHourTop },
              {
                transform: [
                  { translateY: TIME_LABEL_SHIFT_Y + liveHourBand.anchorShiftY },
                ],
              },
            ]}
            collapsable={false}
          >
            <Text style={styles.hourText} numberOfLines={1} allowFontScaling={false}>
              {formatTimelineLabel(liveHourBand.hourStartMin)}
            </Text>
          </View>
        ) : null}

        {showNow ? (
          <View
            style={[
              styles.nowRow,
              {
                top: nowTop - NOW_ROW_H / 2,
                width: SCALE_COL_W,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.nowPill}>
              <Text
                style={styles.nowPillText}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {formatTimelineLabel(nowMin)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.timelineCol}>
          <View
            style={[
              styles.itemsLayer,
              { height: timelineHeight },
            ]}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) {
                setTimelineLaneWidth((prev) => (Math.abs(prev - w) < 1 ? prev : w));
              }
            }}
          >
            {clean.items.map((it) => {
              const task = it.raw;
              const tid = String(task?.id ?? '');

              const overlapCluster = taskIdToOverlapCluster.get(tid) ?? [it];
              const clusterSize = overlapCluster.length;
              
              const maxLaneInCluster = overlapCluster.reduce(
                (m, x) => Math.max(m, x.lane ?? 0),
                0,
              );
              const overlapLaneCount = Math.max(1, maxLaneInCluster + 1);
              
              const overlapColumnIndex = it.lane ?? 0;

              const laneW = timelineLaneWidth > 0 ? timelineLaneWidth : undefined;
              const overlapGutterTotal =
                OVERLAP_COLUMN_GUTTER_PX * Math.max(0, overlapLaneCount - 1);
              const rawOverlapColW =
                overlapLaneCount > 1 && laneW != null && laneW > 0
                  ? (laneW - overlapGutterTotal) / overlapLaneCount
                  : 0;
              const useOverlapSideBySide =
                overlapLaneCount > 1 && rawOverlapColW >= MIN_READABLE_OVERLAP_COLUMN_PX;

              if (clusterSize > 1 && !useOverlapSideBySide) {
                const sortedCluster = [...overlapCluster].sort((a, b) => {
                  if (a.lane !== b.lane) return a.lane - b.lane;
                  const da = durationMinForLane(a);
                  const db = durationMinForLane(b);
                  if (da !== db) return db - da;
                  return a.startMin - b.startMin;
                });
                const repId = String(sortedCluster[0].raw?.id ?? '');
                if (tid !== repId) return null;

                const minStart = Math.min(...sortedCluster.map((x) => x.startMin));
                const maxEnd = Math.max(...sortedCluster.map((x) => x.endMin));
                const rowTop =
                  TOP_INSET +
                  (minStart - clean.startMin) * PX_PER_MIN +
                  CARD_VERTICAL_GAP / 2;
                const rowHeight = Math.max(
                  CARD_SLOT_MIN_HEIGHT,
                  (maxEnd - minStart) * PX_PER_MIN - CARD_VERTICAL_GAP,
                );

                const carouselMaxLane = sortedCluster.reduce(
                  (m, x) => Math.max(m, x.lane ?? 0),
                  0,
                );
                const carouselLaneCount = Math.max(1, carouselMaxLane + 1);
                const carouselSlotStride =
                  OVERLAP_CAROUSEL_CARD_W + OVERLAP_CAROUSEL_SLOT_GAP;
                const carouselContentWidth =
                  carouselLaneCount * OVERLAP_CAROUSEL_CARD_W +
                  Math.max(0, carouselLaneCount - 1) * OVERLAP_CAROUSEL_SLOT_GAP;

                return (
                  <View
                    key={`ov-${sortedCluster.map((x) => x.raw?.id).join('-')}`}
                    style={[
                      styles.swipeWrap,
                      {
                        top: rowTop,
                        height: rowHeight,
                        left: 0,
                        right: 0,
                        width: '100%',
                      },
                    ]}
                  >
                    <GHScrollView
                      horizontal
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsHorizontalScrollIndicator={carouselLaneCount > 1}
                      style={[styles.carouselScroll, { width: '100%' }]}
                      contentContainerStyle={styles.carouselContent}
                      bounces
                      directionalLockEnabled={Platform.OS === 'ios'}
                      removeClippedSubviews={false}
                      overScrollMode={Platform.OS === 'android' ? 'always' : undefined}
                    >
                      <View
                        style={{
                          position: 'relative',
                          width: carouselContentWidth,
                          height: rowHeight,
                        }}
                      >
                      {sortedCluster.map((taskIt) => {
                        const t = taskIt.raw;
                        const tidi = String(t?.id ?? '');
                        const carouselLane = taskIt.lane ?? 0;
                        const carouselLeft = carouselLane * carouselSlotStride;
                        const offsetTop = (taskIt.startMin - minStart) * PX_PER_MIN;
                        const naturalCarouselH =
                          (taskIt.endMin - taskIt.startMin) * PX_PER_MIN - CARD_VERTICAL_GAP;
                        const itemHeight = Math.max(CARD_SLOT_MIN_HEIGHT, naturalCarouselH);
                        const carouselCompact =
                          naturalCarouselH < COMPACT_LAYOUT_MAX_NATURAL_H;
                        const carouselTall =
                          !carouselCompact && itemHeight >= TALL_TASK_CARD_MIN_PX;

                        const manualC = t?.autoDoneOverride;
                        const completedC = t?.status === 'completed';
                        const visuallyDone =
                          manualC === 'pending'
                            ? false
                            : manualC === 'completed'
                              ? true
                              : completedC;

                        const cardBg2 = resolveTaskCardBackground(t?.themeColor);
                        const stripColor2 = resolveTaskStripColor(t?.themeColor);
                        const isLemonCard2 = isLemonTaskTheme(t?.themeColor);
                        const isWhiteCard2 = isWhiteTaskTheme(t?.themeColor);
                        const isSkyCard2 = isSkyTaskTheme(t?.themeColor);
                        const isMintCard2 = isMintTaskTheme(t?.themeColor);
                        const isLilacCard2 = isLilacTaskTheme(t?.themeColor);

                        const stripPillH2 = computeStripPillHeight(
                          itemHeight,
                          carouselCompact,
                          carouselTall,
                        );
                        const carouselDescBody = getTaskCardDescriptionBody(t);
                        const carouselDurationMin = Math.max(0, taskIt.endMin - taskIt.startMin);
                        const carouselDurationLabel = formatDurationUk(carouselDurationMin);
                        const showCarouselDescriptionFooter =
                          carouselDurationMin > 60 && carouselDescBody.length > 0;

                        const { titleLines: ctl, descriptionLines: cdl } = computeTaskCardTextLayout({
                          cardHeightPx: itemHeight,
                          compact: carouselCompact,
                          tallLayout: carouselTall,
                          soloSlotLayout: false,
                          singleWideLayout: false,
                          showDescriptionFooter: showCarouselDescriptionFooter,
                          carousel: true,
                        });
                        const cTitleGrow =
                          carouselTall && !(showCarouselDescriptionFooter && cdl > 0);

                        const carouselCheckBtnStyle = carouselTall
                          ? [styles.checkBtnBase, styles.checkBtnBottom]
                          : [styles.checkBtnBase, styles.checkBtnCentered];

                        const carouselPan = createTimeMovePanResponder({
                          taskId: t?.id,
                          startMin0: taskIt.startMin,
                          endMin0: taskIt.endMin,
                          PX_PER_MIN,
                          effectiveDateKey,
                          onUpdateItem,
                          onRescheduleItem,
                          setDraggingId,
                          userInteractedRef,
                          shouldClaimDrag: () =>
                            dragHoldRef.current.armed &&
                            dragHoldRef.current.taskId === String(t?.id),
                          clearDragHoldArm,
                          onTimeMoveApplied: markTimeMoveApplied,
                        });

                        return (
                          <View
                            key={tidi}
                            style={{
                              position: 'absolute',
                              top: offsetTop,
                              left: carouselLeft,
                              width: OVERLAP_CAROUSEL_CARD_W,
                              height: itemHeight,
                            }}
                          >
                                <View
                                  style={[
                                    styles.card,
                                    {
                                      flex: 0,
                                      height: itemHeight,
                                      backgroundColor: cardBg2,
                                      opacity: visuallyDone ? 0.55 : 1,
                                      borderColor: isLemonCard2
                                        ? 'rgba(69,44,22,0.20)'
                                        : isWhiteCard2
                                          ? 'rgba(0,0,0,0.12)'
                                          : isSkyCard2
                                            ? 'rgba(0,7,210,0.16)'
                                            : isMintCard2
                                              ? 'rgba(104,179,129,0.35)'
                                              : isLilacCard2
                                                ? 'rgba(161,0,164,0.22)'
                                                : 'rgba(0,0,0,0.06)',
                                    },
                                    draggingId === tidi ? styles.cardWrapDragging : null,
                                  ]}
                                >
                                  <GHPressable
                                    style={styles.cardMainTap}
                                    android_ripple={{ color: 'rgba(69,44,22,0.06)' }}
                                    onPressIn={() => beginDragHoldArm(t.id)}
                                    onPressOut={() => {
                                      if (draggingIdRef.current !== tidi) clearDragHoldArm();
                                    }}
                                    onPress={() => {
                                      if (lastTimeDragTaskIdRef.current === tidi) {
                                        lastTimeDragTaskIdRef.current = null;
                                        return;
                                      }
                                      if (dragArmFiredRef.current) {
                                        dragArmFiredRef.current = false;
                                        return;
                                      }
                                      onPressItem?.(t);
                                    }}
                                  >
                                    <View
                                      {...carouselPan.panHandlers}
                                      collapsable={false}
                                      style={styles.cardDragSurface}
                                    >
                                      <View
                                        style={[
                                          styles.stripSlot,
                                          carouselTall
                                            ? styles.stripSlotCarouselTall
                                            : styles.stripSlotCenter,
                                        ]}
                                      >
                                        <View
                                          style={[
                                            styles.stripSlotInner,
                                            carouselTall
                                              ? styles.stripSlotInnerTall
                                              : styles.stripSlotInnerCenter,
                                          ]}
                                        >
                                          <View
                                            style={[
                                              styles.stripPill,
                                              carouselTall ? styles.stripPillTall : null,
                                              {
                                                backgroundColor: stripColor2,
                                                height: stripPillH2,
                                              },
                                              isLemonCard2 ? styles.stripPillYellow : styles.stripPillDefault,
                                            ]}
                                          />
                                        </View>
                                      </View>
                                      <View
                                        style={[
                                          styles.cardBody,
                                          carouselTall
                                            ? styles.cardBodyTall
                                            : cdl > 0 ||
                                                (carouselCompact && showCarouselDescriptionFooter)
                                              ? styles.cardBodyStackFromTop
                                              : styles.cardBodyCentered,
                                          {
                                            paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
                                            paddingBottom: carouselCompact
                                              ? TIMELINE_HORIZONTAL_RHYTHM_PX
                                              : carouselTall
                                                ? 40
                                                : TIMELINE_HORIZONTAL_RHYTHM_PX + 2,
                                            paddingLeft: TASK_CARD_STRIP_TO_TEXT_GAP_PX,
                                            paddingRight: TASK_CARD_BODY_PADDING_RIGHT_PX,
                                          },
                                        ]}
                                      >
                                        {carouselCompact ? (
                                          <View
                                            style={[
                                              styles.compactTaskLineWrap,
                                              showCarouselDescriptionFooter && cdl > 0
                                                ? styles.compactTaskLineWrapWithDesc
                                                : null,
                                            ]}
                                          >
                                            <Text
                                              style={[styles.compactLineOuter, styles.compactTitleOnly]}
                                              numberOfLines={ctl}
                                              ellipsizeMode="tail"
                                              {...(Platform.OS === 'android'
                                                ? { includeFontPadding: false }
                                                : {})}
                                            >
                                              {getTaskCardTitle(t)}
                                            </Text>
                                          </View>
                                        ) : (
                                          <>
                                            <View style={styles.metaRow}>
                                              <Text
                                                style={styles.timeRangeText}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                              >
                                                {formatTimelineRangeFromStored(t.startTime, t.endTime)}
                                              </Text>
                                              {!carouselTall ? (
                                                <Image
                                                  source={NOTE_ICON}
                                                  style={[
                                                    styles.noteIcon,
                                                    {
                                                      marginLeft: TIMELINE_HORIZONTAL_RHYTHM_PX,
                                                      width: 14,
                                                      height: 14,
                                                    },
                                                  ]}
                                                  resizeMode="contain"
                                                />
                                              ) : null}
                                            </View>
                                            <View
                                              style={[
                                                carouselTall
                                                  ? styles.tallTitleBlockBase
                                                  : styles.mediumTitleBlock,
                                                cTitleGrow ? styles.tallTitleBlockGrow : null,
                                              ]}
                                            >
                                              <Text
                                                style={[styles.titleText, visuallyDone ? styles.titleCompleted : null]}
                                                numberOfLines={ctl}
                                                ellipsizeMode="tail"
                                              >
                                                {getTaskCardTitle(t)}
                                              </Text>
                                            </View>
                                          </>
                                        )}
                                        {showCarouselDescriptionFooter && cdl > 0 ? (
                                          <View style={styles.tallNoteFooter}>
                                            <Text
                                              style={styles.tallFooterLeadText}
                                              numberOfLines={cdl}
                                              ellipsizeMode="tail"
                                              {...(Platform.OS === 'android'
                                                ? { includeFontPadding: false }
                                                : {})}
                                            >
                                              {carouselDescBody}
                                            </Text>
                                          </View>
                                        ) : null}
                                      </View>
                                    </View>
                                  </GHPressable>
                                  {carouselTall &&
                                  carouselDurationMin >= 60 &&
                                  carouselDurationLabel.length > 0 ? (
                                    <View
                                      style={styles.tallDurationByCheckCarousel}
                                      pointerEvents="none"
                                    >
                                      <Text
                                        style={styles.tallDurationByCheckCarouselText}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                      >
                                        {carouselDurationLabel}
                                      </Text>
                                    </View>
                                  ) : null}
                                  <TouchableOpacity
                                    style={carouselCheckBtnStyle}
                                    onPress={() => {
                                      if (typeof onSetCompleted === 'function') {
                                        onSetCompleted(t.id, !visuallyDone);
                                      } else {
                                        onToggleComplete?.(t.id);
                                      }
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
                          </View>
                        );
                      })}
                      </View>
                    </GHScrollView>
                  </View>
                );
              }

              const manualOverride = task?.autoDoneOverride;
              const isCompleted = task?.status === 'completed';
              const isVisuallyCompleted =
                manualOverride === 'pending'
                  ? false
                  : manualOverride === 'completed'
                    ? true
                    : isCompleted;
              
              const soloSlotLayout = clusterSize === 1;

              const rawTop = TOP_INSET + (it.startMin - clean.startMin) * PX_PER_MIN;
              const rawHeight = (it.endMin - it.startMin) * PX_PER_MIN;
              const naturalContentH = rawHeight - CARD_VERTICAL_GAP;
              const top = rawTop + CARD_VERTICAL_GAP / 2;
              const height = Math.max(CARD_SLOT_MIN_HEIGHT, naturalContentH);
              const compact = naturalContentH < COMPACT_LAYOUT_MAX_NATURAL_H;
              const tallLayout = !compact && height >= TALL_TASK_CARD_MIN_PX;
              const stripPillH = soloSlotLayout
                ? (() => {
                    if (tallLayout && !compact) {
                      const vInset = 10;
                      const h = Math.round(height - vInset * 2);
                      return clamp(h, 40, Math.max(40, height - vInset * 2));
                    }
                    const maxH = compact
                      ? Math.max(11, height - 14)
                      : Math.max(40, height - 14);
                    return clamp(
                      Math.round(height * (compact ? 0.5 : 0.76)),
                      compact ? 10 : 22,
                      maxH
                    );
                  })()
                : computeStripPillHeight(height, compact, tallLayout);
              const singleWideLayout = soloSlotLayout && !compact;
              const durationMinutes = Math.max(0, it.endMin - it.startMin);
              const descBodyForCard = getTaskCardDescriptionBody(task);
              const showDescriptionFooter =
                durationMinutes > 60 && descBodyForCard.length > 0;
              const { titleLines: titleLineCount, descriptionLines: descriptionLineCount } =
                computeTaskCardTextLayout({
                  cardHeightPx: height,
                  compact,
                  tallLayout,
                  soloSlotLayout,
                  singleWideLayout,
                  showDescriptionFooter,
                  carousel: false,
                });
              const titleBlockGrow =
                tallLayout && !(showDescriptionFooter && descriptionLineCount > 0);
              const checkBtnStyle = tallLayout
                ? [styles.checkBtnBase, styles.checkBtnBottom]
                : [styles.checkBtnBase, styles.checkBtnCentered];

              const cardBg = resolveTaskCardBackground(task?.themeColor);
              const stripColor = resolveTaskStripColor(task?.themeColor);
              const isLemonCard = isLemonTaskTheme(task?.themeColor);
              const isWhiteCard = isWhiteTaskTheme(task?.themeColor);
              const isSkyCard = isSkyTaskTheme(task?.themeColor);
              const isMintCard = isMintTaskTheme(task?.themeColor);
              const isLilacCard = isLilacTaskTheme(task?.themeColor);
              const durationLabel = formatDurationUk(durationMinutes);
              const showTallDurationFooter =
                tallLayout &&
                durationMinutes >= 60 &&
                durationLabel.length > 0 &&
                !soloSlotLayout;
              const timeRangeUi = formatTimelineRangeFromStored(task.startTime, task.endTime);
              const metaLabel =
                height < 34
                  ? timeRangeUi
                  : showTallDurationFooter
                    ? timeRangeUi
                    : `${timeRangeUi}${durationLabel ? ` (${durationLabel})` : ''}`;

              const responder = createTimeMovePanResponder({
                taskId: task?.id,
                startMin0: it.startMin,
                endMin0: it.endMin,
                PX_PER_MIN,
                effectiveDateKey,
                onUpdateItem,
                onRescheduleItem,
                setDraggingId,
                userInteractedRef,
                shouldClaimDrag: () =>
                  dragHoldRef.current.armed && dragHoldRef.current.taskId === String(task?.id),
                clearDragHoldArm,
                onTimeMoveApplied: markTimeMoveApplied,
              });

              let cardWrapLayout;
              if (useOverlapSideBySide && laneW != null && laneW > 0) {
                const gutterTotal = OVERLAP_COLUMN_GUTTER_PX * (overlapLaneCount - 1);
                const colW = (laneW - gutterTotal) / overlapLaneCount;
                const leftPx =
                  overlapColumnIndex * (colW + OVERLAP_COLUMN_GUTTER_PX);
                cardWrapLayout = { top, height, left: leftPx, width: colW, right: undefined };
              } else if (useOverlapSideBySide) {
                const wPct = 100 / overlapLaneCount;
                const leftPct = overlapColumnIndex * wPct;
                cardWrapLayout = {
                  top,
                  height,
                  left: `${leftPct}%`,
                  width: `${wPct}%`,
                  right: undefined,
                };
              } else {
                cardWrapLayout = { top, height, left: 0, right: 0, width: '100%' };
              }

              return (
                <View
                  key={String(task.id)}
                  style={[
                    styles.cardWrap,
                    cardWrapLayout,
                    draggingId === String(task.id) ? styles.cardWrapDragging : null,
                  ]}
                >
                  <GHScrollView
                    horizontal
                    nestedScrollEnabled
                    style={{ width: '100%', height }}
                    contentContainerStyle={[
                      styles.carouselContent,
                      styles.carouselContentSoloFullWidth,
                    ]}
                    scrollEnabled={false}
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    directionalLockEnabled={Platform.OS === 'ios'}
                    removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
                    overScrollMode={Platform.OS === 'android' ? 'always' : undefined}
                  >
                    <View style={{ flex: 1, height, minWidth: 0, width: '100%' }}>
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: cardBg,
                        opacity: isVisuallyCompleted ? 0.55 : 1,
                        borderColor: isLemonCard
                          ? 'rgba(69,44,22,0.20)'
                          : isWhiteCard
                            ? 'rgba(0,0,0,0.12)'
                            : isSkyCard
                              ? 'rgba(0,7,210,0.16)'
                              : isMintCard
                                ? 'rgba(104,179,129,0.35)'
                                : isLilacCard
                                  ? 'rgba(161,0,164,0.22)'
                                  : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <GHPressable
                      style={styles.cardMainTap}
                      android_ripple={{ color: 'rgba(69,44,22,0.06)' }}
                      onPressIn={() => beginDragHoldArm(task.id)}
                      onPressOut={() => {
                        if (draggingIdRef.current !== String(task.id)) clearDragHoldArm();
                      }}
                      onPress={() => {
                        const id = String(task.id);
                        if (lastTimeDragTaskIdRef.current === id) {
                          lastTimeDragTaskIdRef.current = null;
                          return;
                        }
                        if (dragArmFiredRef.current) {
                          dragArmFiredRef.current = false;
                          return;
                        }
                        onPressItem?.(task);
                      }}
                    >
                      <View
                        {...responder.panHandlers}
                        collapsable={false}
                        style={styles.cardDragSurface}
                      >
                        <View
                          style={[
                            styles.stripPanHandle,
                            tallLayout ? styles.stripPanHandleTall : styles.stripPanHandleCenter,
                          ]}
                        >
                          <View
                            style={[
                              styles.stripSlotInner,
                              tallLayout ? styles.stripSlotInnerTall : styles.stripSlotInnerCenter,
                            ]}
                          >
                            <View
                              style={[
                                styles.stripPill,
                                {
                                  backgroundColor: stripColor,
                                  height: stripPillH,
                                },
                                soloSlotLayout ? styles.stripPillSingle : null,
                                tallLayout && soloSlotLayout ? styles.stripPillSingleTall : null,
                                tallLayout && !soloSlotLayout ? styles.stripPillTall : null,
                                isLemonCard ? styles.stripPillYellow : styles.stripPillDefault,
                              ]}
                            />
                          </View>
                        </View>

                        <View
                          style={[
                            styles.cardBody,
                            tallLayout
                              ? styles.cardBodyTall
                              : descriptionLineCount > 0 || (compact && showDescriptionFooter)
                                ? styles.cardBodyStackFromTop
                                : styles.cardBodyCentered,
                            {
                              paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
                              paddingBottom: compact
                                ? TIMELINE_HORIZONTAL_RHYTHM_PX
                                : tallLayout
                                  ? 40
                                  : TIMELINE_HORIZONTAL_RHYTHM_PX + 2,
                              paddingLeft: TASK_CARD_STRIP_TO_TEXT_GAP_PX,
                              paddingRight: TASK_CARD_BODY_PADDING_RIGHT_PX,
                            },
                            singleWideLayout && tallLayout
                              ? styles.cardBodySingleTall
                              : singleWideLayout
                                ? styles.cardBodySingle
                                : null,
                          ]}
                        >
                        {compact ? (
                          <View
                            style={[
                              styles.compactTaskLineWrap,
                              showDescriptionFooter && descriptionLineCount > 0
                                ? styles.compactTaskLineWrapWithDesc
                                : null,
                            ]}
                          >
                            <Text
                              style={[styles.compactLineOuter, styles.compactTitleOnly]}
                              numberOfLines={titleLineCount}
                              ellipsizeMode="tail"
                              {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                            >
                              {getTaskCardTitle(task)}
                            </Text>
                          </View>
                        ) : (
                          <>
                            <View
                              style={[
                                styles.metaRow,
                                singleWideLayout ? styles.metaRowSingleHeader : null,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.timeRangeText,
                                  singleWideLayout ? styles.timeRangeTextSingle : null,
                                  tallLayout ? styles.timeRangeTextTall : null,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {metaLabel}
                              </Text>
                              {!tallLayout && soloSlotLayout ? (
                                <TouchableOpacity
                                  style={[
                                    styles.editNearTimeBtn,
                                    singleWideLayout ? styles.editNearTimeBtnSingleTrailing : null,
                                  ]}
                                  onPress={() => onPressItem?.(task)}
                                  activeOpacity={0.85}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <Image
                                    source={NOTE_ICON}
                                    style={[
                                      styles.noteIcon,
                                      singleWideLayout ? styles.noteIconSingleTrailing : null,
                                    ]}
                                    resizeMode="contain"
                                  />
                                </TouchableOpacity>
                              ) : !tallLayout && !soloSlotLayout ? (
                                <Image source={NOTE_ICON} style={styles.noteIcon} resizeMode="contain" />
                              ) : null}
                            </View>

                            <View
                              style={[
                                tallLayout ? styles.tallTitleBlockBase : styles.mediumTitleBlock,
                                titleBlockGrow ? styles.tallTitleBlockGrow : null,
                              ]}
                            >
                              <Text
                                style={[styles.titleText, isVisuallyCompleted ? styles.titleCompleted : null]}
                                numberOfLines={titleLineCount}
                                ellipsizeMode="tail"
                              >
                                {getTaskCardTitle(task)}
                              </Text>
                            </View>
                          </>
                        )}
                        {showDescriptionFooter && descriptionLineCount > 0 ? (
                          <View style={styles.tallNoteFooter}>
                            <Text
                              style={styles.tallFooterLeadText}
                              numberOfLines={descriptionLineCount}
                              ellipsizeMode="tail"
                              {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                            >
                              {descBodyForCard}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      </View>
                    </GHPressable>

                    {showTallDurationFooter ? (
                      <View style={styles.tallDurationByCheck} pointerEvents="none">
                        <Text
                          style={styles.tallDurationByCheckText}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {durationLabel}
                        </Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={checkBtnStyle}
                      onPress={() => {
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
                    </View>
                  </GHScrollView>
                </View>
              );
            })}
          </View>
        </View>

        {nowHorizontalDashGeom ? (
          <View
            pointerEvents="none"
            style={[styles.nowHorizontalDashOverlay, { height: contentHeight }]}
          >
            <Svg width="100%" height={contentHeight}>
              <Path
                d={`M ${nowHorizontalDashGeom.x1} ${nowHorizontalDashGeom.y} L ${nowHorizontalDashGeom.x2} ${nowHorizontalDashGeom.y}`}
                fill="none"
                stroke={TIMELINE_NOW_HORIZ_STROKE}
                strokeOpacity={TIMELINE_NOW_HORIZ_OPACITY}
                strokeWidth={TIMELINE_RAIL_STROKE_WIDTH_PX}
                strokeDasharray={TIMELINE_NOW_HORIZ_DASH_ARRAY}
                strokeLinecap="butt"
              />
            </Svg>
          </View>
        ) : null}

      </View>
    </GHScrollView>
  );
}

const TIME_LABEL_W = TIMELINE_HOUR_LABEL_WIDTH_PX;
const FIGMA_RAIL_X = TIMELINE_RAIL_CENTER_X_PX;
const SCALE_COL_W = TIMELINE_SCALE_COLUMN_WIDTH_PX;

const NOW_PILL_TOTAL_W = 40;
const NOW_PILL_BLOCK_H = 16;
const NOW_PILL_RADIUS = 8;

const NOW_ROW_H = 28;

const NOW_HORIZ_DASH_AFTER_PILL_GAP_PX = 5;

const NOW_BAND_VERTICAL_PAD_PX = 8;

const TASK_TIMELINE_INSET = TIMELINE_HORIZONTAL_RHYTHM_PX;
const CARD_VERTICAL_GAP = TASK_TIMELINE_INSET;

const CARD_SLOT_MIN_HEIGHT = 44;

const COMPACT_LAYOUT_MAX_NATURAL_H = 56;
const CAROUSEL_CARD_GAP = TASK_TIMELINE_INSET;

const TIME_LABEL_SHIFT_Y = -12;

const HOUR_LABEL_PAD_Y = 4;

const HOUR_TEXT_LINE_HEIGHT_PX = 15;

const HOUR_LABEL_H = HOUR_TEXT_LINE_HEIGHT_PX + HOUR_LABEL_PAD_Y * 2;

const HOUR_RAIL_GAP_Y = 2;
const HOUR_LABEL_RAIL_GAP_H = HOUR_LABEL_H + HOUR_RAIL_GAP_Y * 2;

const RAIL_EXTEND_BELOW_CONTENT_PX = 14;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: SPACING.md,
    paddingBottom: 0,
    paddingLeft: 0,
    overflow: 'visible',
  },
  content: {
    flexDirection: 'row',
    paddingRight: SPACING.md,
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
    position: 'relative',
    overflow: 'visible',
  },
  
  scaleColSpacer: {
    width: SCALE_COL_W,
    flexShrink: 0,
  },
  hourSlot: {
    left: TIMELINE_RAIL_CENTER_X_PX - TIME_LABEL_W / 2,
    width: TIME_LABEL_W,
    alignItems: 'center',
  },
  hourSlotPositioned: {
    position: 'absolute',
    zIndex: 8,
  },
  
  hourText: {
    fontSize: 12,
    color: TIMELINE_RAIL_STROKE,
    fontFamily: FONTS.medium,
    lineHeight: HOUR_TEXT_LINE_HEIGHT_PX,
    letterSpacing: 0,
    textAlign: 'center',
    flexWrap: 'nowrap',
    includeFontPadding: false,
    width: TIME_LABEL_W,
    paddingVertical: HOUR_LABEL_PAD_Y,
    ...Platform.select({
      android: { textAlignVertical: 'center' },
      default: {},
    }),
  },
  timelineCol: {
    flex: 1,
    position: 'relative',
    paddingLeft: 0,
    paddingTop: 0,
  },
  
  railVerticalDashLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  nowHorizontalDashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
    ...Platform.select({ android: { elevation: 0 }, default: {} }),
  },
  nowRow: {
    position: 'absolute',
    left: 0,
    height: NOW_ROW_H,
    justifyContent: 'center',
    zIndex: 30,
    ...Platform.select({ android: { elevation: 0 }, default: { elevation: 0 } }),
    overflow: 'visible',
  },
  nowPill: {
    width: NOW_PILL_TOTAL_W,
    paddingHorizontal: 0,
    height: NOW_PILL_BLOCK_H,
    borderRadius: NOW_PILL_RADIUS,
    backgroundColor: NOW_PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: (NOW_ROW_H - NOW_PILL_BLOCK_H) / 2,
    left: FIGMA_RAIL_X - NOW_PILL_TOTAL_W / 2,
    overflow: 'hidden',
    zIndex: 1,
    ...Platform.select({ android: { elevation: 0 }, default: {} }),
  },
  
  nowPillText: {
    fontSize: 12,
    color: NOW_PILL_TEXT,
    fontFamily: FONTS.medium,
    lineHeight: 16,
    letterSpacing: 0,
    includeFontPadding: false,
    textAlign: 'center',
    ...Platform.select({
      android: { textAlignVertical: 'center' },
      default: {},
    }),
  },
  itemsLayer: {
    position: 'relative',
    paddingLeft: 0,
    paddingRight: TIMELINE_HORIZONTAL_RHYTHM_PX,
    zIndex: 1,
    overflow: 'visible',
  },
  cardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'visible',
  },
  cardWrapDragging: {
    opacity: 0.9,
    zIndex: 4,
  },
  
  cardDragSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  swipeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'visible',
  },
  carouselScroll: {
    flexGrow: 0,
    height: '100%',
  },
  carouselContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexGrow: 1,
  },
  
  carouselContentSoloFullWidth: {
    width: '100%',
    minWidth: '100%',
  },
  carouselSeparator: {
    width: CAROUSEL_CARD_GAP,
    alignItems: 'center',
    justifyContent: 'stretch',
    alignSelf: 'stretch',
  },
  carouselSeparatorLine: {
    width: TIMELINE_RAIL_VIEW_LINE_PX,
    flex: 1,
    minHeight: 24,
    marginVertical: TIMELINE_HORIZONTAL_RHYTHM_PX,
    backgroundColor: TIMELINE_RAIL_AXIS_STROKE,
  },
  swipeWrapOverlap: {
    borderTopWidth: TIMELINE_RAIL_VIEW_LINE_PX,
    borderTopColor: TIMELINE_RAIL_AXIS_STROKE,
    borderStyle: 'solid',
  },
  swipePanel: {
    width: 280,
    marginRight: TIMELINE_HORIZONTAL_RHYTHM_PX,
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
    position: 'relative',
    paddingLeft: TASK_CARD_INNER_PADDING_LEFT_PX,
  },
  cardMainTap: {
    flex: 1,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'stretch',
    minWidth: 0,
    minHeight: 0,
  },
  
  stripSlot: {
    width: TASK_STRIP_COLUMN_WIDTH_PX,
    flexShrink: 0,
    alignSelf: 'stretch',
    alignItems: 'stretch',
    paddingLeft: 0,
    paddingRight: 0,
  },
  stripSlotTop: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  
  stripSlotCarouselTall: {
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  stripSlotCenter: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  
  stripPanHandle: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    width: TASK_STRIP_COLUMN_WIDTH_PX,
    flexShrink: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  stripPanHandleTop: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  
  stripPanHandleTall: {
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  stripPanHandleCenter: {
    justifyContent: 'center',
    paddingTop: 0,
  },
  stripSlotInner: {
    width: TASK_STRIP_COLUMN_WIDTH_PX,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  stripSlotInnerTop: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  stripSlotInnerTall: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    minHeight: 0,
  },
  stripSlotInnerCenter: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    paddingTop: 0,
  },
  stripPill: {
    width: TASK_STRIP_PILL_WIDTH_PX,
    minHeight: 14,
    borderRadius: TASK_STRIP_PILL_RADIUS_PX,
    marginLeft: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  stripPillSingle: {
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
  
  stripPillSingleTall: {
    marginLeft: 0,
    alignSelf: 'center',
  },
  stripPillTall: {
    marginLeft: 0,
    alignSelf: 'center',
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
    minWidth: 0,
    paddingLeft: TASK_CARD_STRIP_TO_TEXT_GAP_PX,
    paddingRight: TASK_CARD_BODY_PADDING_RIGHT_PX,
    minHeight: 0,
  },
  cardBodyCentered: {
    justifyContent: 'center',
    paddingVertical: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  
  cardBodyStackFromTop: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
    paddingBottom: TIMELINE_HORIZONTAL_RHYTHM_PX + 2,
  },
  cardBodyTall: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
    paddingBottom: 40,
  },
  cardBodySingle: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
    paddingBottom: TIMELINE_HORIZONTAL_RHYTHM_PX + 2,
  },
  
  cardBodySingleTall: {
    justifyContent: 'flex-start',
    paddingTop: TIMELINE_HORIZONTAL_RHYTHM_PX,
    paddingBottom: 42,
  },
  editNearTimeBtn: {
    marginLeft: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  editNearTimeBtnSingleTrailing: {
    marginLeft: 0,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  
  compactTaskLineWrap: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    justifyContent: 'center',
  },
  compactTaskLineWrapWithDesc: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  compactLineOuter: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.medium,
  },
  compactTitleOnly: {
    color: '#1A1A1A',
  },
  
  metaRowSingleHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TIMELINE_HORIZONTAL_RHYTHM_PX,
    paddingLeft: 0,
    width: '100%',
  },
  timeRangeText: {
    fontSize: 12,
    lineHeight: 18,
    color: TIMELINE_RAIL_STROKE,
    fontFamily: FONTS.regular,
    flexShrink: 1,
    paddingRight: 0,
  },
  timeRangeTextSingle: {
    textAlign: 'left',
    flex: 1,
    minWidth: 0,
    paddingRight: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  timeRangeTextTall: {
    color: 'rgba(137,137,137,0.95)',
  },
  
  tallDurationByCheck: {
    position: 'absolute',
    left: TASK_CARD_TEXT_INSET_FROM_CARD_LEFT_PX,
    bottom: TIMELINE_HORIZONTAL_RHYTHM_PX * 2,
    zIndex: 3,
    maxWidth: '56%',
    pointerEvents: 'none',
  },
  tallDurationByCheckText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.medium,
    color: TIMELINE_RAIL_STROKE,
    textAlign: 'left',
  },
  tallDurationByCheckCarousel: {
    position: 'absolute',
    left: TASK_CARD_TEXT_INSET_FROM_CARD_LEFT_PX,
    bottom: TIMELINE_HORIZONTAL_RHYTHM_PX * 2,
    zIndex: 3,
    maxWidth: 98,
    pointerEvents: 'none',
  },
  tallDurationByCheckCarouselText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.medium,
    color: TIMELINE_RAIL_STROKE,
    textAlign: 'left',
  },
  tallTitleBlockBase: {
    marginTop: 2,
    alignSelf: 'stretch',
    minHeight: 0,
    flexShrink: 1,
  },
  
  tallTitleBlockGrow: {
    flex: 1,
    minHeight: 0,
  },
  mediumTitleBlock: {
    alignSelf: 'stretch',
    minWidth: 0,
    flexShrink: 1,
  },
  tallNoteFooter: {
    marginTop: 4,
    paddingBottom: 0,
    alignSelf: 'stretch',
  },
  tallFooterLeadText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONTS.medium,
    color: TIMELINE_RAIL_STROKE,
  },
  noteIcon: {
    width: 16,
    height: 16,
    tintColor: TIMELINE_RAIL_STROKE,
    marginLeft: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  noteIconSingleTrailing: {
    marginLeft: 0,
  },
  titleText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: FONTS.medium,
    lineHeight: 18,
    flexShrink: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  checkBtnBase: {
    position: 'absolute',
    right: TASK_CHECK_BTN_RIGHT_PX,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.round,
  },
  checkBtnCentered: {
    top: '50%',
    transform: [{ translateY: -14 }],
  },
  checkBtnBottom: {
    bottom: TIMELINE_HORIZONTAL_RHYTHM_PX,
  },
  checkIcon: {
    width: 24,
    height: 24,
  },
});

