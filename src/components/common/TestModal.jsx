import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const TestModal = ({ visible, onClose }) => {
  console.log('🔴🔴🔴 TestModal render, visible:', visible);
  console.log('🔴🔴🔴 TestModal visible type:', typeof visible);
  console.log('🔴🔴🔴 TestModal visible === true:', visible === true);
  
  if (!visible) {
    console.log('🔴 TestModal: visible is false, returning null');
    return null;
  }
  
  console.log('🔴 TestModal: visible is true, rendering Modal');
  
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      onShow={() => {
        console.log('✅✅✅ TestModal onShow called!');
      }}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <Text style={styles.text}>ТЕСТОВОЕ МОДАЛЬНОЕ ОКНО</Text>
          <Text style={styles.text}>Если вы видите это - Modal работает!</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'red',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TestModal;

