import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../styles/theme';

const DAY_LABELS_UK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];

const parseStartMin = (t) => {
  if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
  const [hRaw, mRaw] = t.split(':');
  const h = Number(String(hRaw).trim());
  const m = Number(String(mRaw).trim());
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export default function WeekSchedule({
  weekDates,
  selectedKey,
  itemsByDate,
  onSelectDate,
  onPressItem,
  onLongPressItem,
  onToggleComplete,
  bottomPadding = 0,
}) {
  const cols = useMemo(() => {
    return (weekDates || []).map((d, idx) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const items = (itemsByDate?.[key] || []).slice().sort((a, b) => parseStartMin(a?.startTime) - parseStartMin(b?.startTime));
      return { date: d, key, dayIdx: idx, items };
    });
  }, [weekDates, itemsByDate]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.hScrollContent, { paddingBottom: Math.max(0, bottomPadding || 0) }]}
    >
      {cols.map((c) => {
        const isSelected = c.key === selectedKey;
        return (
          <View key={c.key} style={styles.dayCol}>
            <TouchableOpacity
              style={[styles.dayHeader, isSelected ? styles.dayHeaderSelected : null]}
              activeOpacity={0.85}
              onPress={() => onSelectDate?.(c.date)}
            >
              <Text style={[styles.dayLabel, isSelected ? styles.dayLabelSelected : null]}>
                {DAY_LABELS_UK[c.dayIdx] || 'ДН'}
              </Text>
              <Text style={[styles.dayNumber, isSelected ? styles.dayNumberSelected : null]}>
                {c.date.getDate()}
              </Text>
            </TouchableOpacity>

            <View style={styles.itemsCol}>
              {c.items.length ? c.items.map((it) => {
                const isCompleted = it?.status === 'completed';
                return (
                  <TouchableOpacity
                    key={String(it.id)}
                    style={[styles.itemCard, isCompleted ? styles.itemCardCompleted : null]}
                    activeOpacity={0.9}
                    onPress={() => onPressItem?.(it)}
                    onLongPress={() => onLongPressItem?.(it)}
                  >
                    <View style={styles.itemRow}>
                      <View style={styles.itemMain}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {it?.title || ''}
                        </Text>
                        <Text style={styles.itemTime} numberOfLines={1}>
                          {(it?.startTime || '--:--')}-{(it?.endTime || '--:--')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.itemCheck}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          onToggleComplete?.(it.id);
                        }}
                        activeOpacity={0.8}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {isCompleted ? (
                          <Icon name="checkmark-circle" size={22} color={COLORS.primaryDark} />
                        ) : (
                          <Icon name="ellipse-outline" size={22} color={COLORS.textSecondary} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }) : (
                <View style={styles.emptyHint}>
                  <Text style={styles.emptyHintText}>—</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  dayCol: {
    width: 160,
    marginRight: SPACING.md,
  },
  dayHeader: {
    backgroundColor: COLORS.panelLight,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.20)',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  dayHeaderSelected: {
    backgroundColor: COLORS.accentBrown,
    borderColor: 'rgba(69,44,22,0.35)',
  },
  dayLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  itemsCol: {
    marginTop: SPACING.sm,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(69,44,22,0.14)',
    padding: 12,
    marginBottom: SPACING.sm,
  },
  itemCardCompleted: {
    opacity: 0.55,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 16,
    color: COLORS.text,
  },
  itemTime: {
    marginTop: 6,
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemCheck: {
    marginLeft: 6,
  },
  emptyHint: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  emptyHintText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

