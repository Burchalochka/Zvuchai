import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../styles/theme';
import WheelPicker from '../calendar/WheelPicker';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const parseHHMM = (value) => {
  const str = typeof value === 'string' ? value : '09:00';
  const [hRaw, mRaw] = str.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  return {
    h: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9,
    m: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
};

export default function EditTaskModal({ visible, task, onCancel, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHourIdx, setStartHourIdx] = useState(9);
  const [startMinuteIdx, setStartMinuteIdx] = useState(0);
  const [endHourIdx, setEndHourIdx] = useState(10);
  const [endMinuteIdx, setEndMinuteIdx] = useState(0);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    const s = parseHHMM(task.startTime);
    const e = parseHHMM(task.endTime);
    setStartHourIdx(s.h);
    setStartMinuteIdx(s.m);
    setEndHourIdx(e.h);
    setEndMinuteIdx(e.m);
  }, [task, visible]);

  const startTime = useMemo(() => `${HOURS[startHourIdx]}:${MINUTES[startMinuteIdx]}`, [startHourIdx, startMinuteIdx]);
  const endTime = useMemo(() => `${HOURS[endHourIdx]}:${MINUTES[endMinuteIdx]}`, [endHourIdx, endMinuteIdx]);

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>Редагувати</Text>

          <Text style={styles.label}>Назва</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Введіть назву"
            placeholderTextColor={COLORS.textSecondary}
          />

          <Text style={styles.label}>Опис</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            placeholder="Додайте опис (необов’язково)"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />

          <Text style={styles.label}>Час</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeCaption}>Початок</Text>
              <View style={styles.wheelsRow}>
                <WheelPicker
                  data={HOURS}
                  selectedIndex={startHourIdx}
                  onChange={(idx) => setStartHourIdx(idx)}
                  width={90}
                  itemHeight={44}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                />
                <Text style={styles.colon}>:</Text>
                <WheelPicker
                  data={MINUTES}
                  selectedIndex={startMinuteIdx}
                  onChange={(idx) => setStartMinuteIdx(idx)}
                  width={90}
                  itemHeight={44}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                />
              </View>
            </View>

            <View style={styles.timeCol}>
              <Text style={styles.timeCaption}>Кінець</Text>
              <View style={styles.wheelsRow}>
                <WheelPicker
                  data={HOURS}
                  selectedIndex={endHourIdx}
                  onChange={(idx) => setEndHourIdx(idx)}
                  width={90}
                  itemHeight={44}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                />
                <Text style={styles.colon}>:</Text>
                <WheelPicker
                  data={MINUTES}
                  selectedIndex={endMinuteIdx}
                  onChange={(idx) => setEndMinuteIdx(idx)}
                  width={90}
                  itemHeight={44}
                  visibleItems={5}
                  textStyle={styles.wheelItem}
                  selectedTextStyle={styles.wheelSelectedItem}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Скасувати</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() =>
                onSave?.({
                  title: title.trim(),
                  description: description.trim(),
                  startTime,
                  endTime,
                })
              }
            >
              <Text style={styles.saveText}>Зберегти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    width: '90%',
    maxWidth: 460,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.panelLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontFamily: Platform.OS === 'android' ? undefined : FONTS.regular,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xs },
  timeCol: { flex: 1 },
  timeCaption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  wheelsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  colon: { marginHorizontal: 6, fontSize: 18, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  wheelItem: {
    color: COLORS.textSecondary,
    fontSize: 20,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    height: 44,
    lineHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  wheelSelectedItem: { color: COLORS.primaryDark, fontWeight: '700' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panelLight,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.text, fontFamily: FONTS.medium, fontSize: FONTS.sizes.md },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accentBrown,
    alignItems: 'center',
  },
  saveText: { color: '#FFF', fontFamily: FONTS.bold, fontSize: FONTS.sizes.md },
});

