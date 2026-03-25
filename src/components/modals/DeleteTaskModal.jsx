import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { FONTS, SPACING, COLORS } from '../../styles/theme';

const DeleteTaskModal = ({ visible, task, onConfirm, onCancel }) => {
  if (!task) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.card}>
            {/* Іконка кошика */}
            <View style={styles.iconWrapper}>
              <Icon name="trash" size={28} color="#E57373" />
            </View>

            {/* Заголовок */}
            <Text style={styles.title}>Видалити завдання?</Text>

            {/* Роздільник */}
            <View style={styles.divider} />

            {/* Опис */}
            <Text style={styles.description}>
              <Text style={styles.taskName}>"{task.title}"</Text>
              {'\n'}буде видалено з дня
            </Text>

            {/* Кнопки */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(task.id)}>
                <Text style={styles.confirmText}>Видалити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#2C1A00',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0EBE0',
    marginBottom: 16,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: '#6B5B4E',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    lineHeight: 22,
    marginBottom: 28,
  },
  taskName: {
    fontFamily: 'Montserrat-Medium',
    color: '#2C1A00',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C5BAA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
    color: '#2C1A00',
    fontFamily: 'Montserrat-Medium',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#452C16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: FONTS.sizes.md,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
});

export default DeleteTaskModal;
