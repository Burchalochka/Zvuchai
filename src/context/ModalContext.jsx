import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const openAddModal = React.useCallback(() => {
    setIsAddModalVisible(true);
  }, []);

  const closeAddModal = React.useCallback(() => {
    setIsAddModalVisible(false);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isAddModalVisible,
        openAddModal,
        closeAddModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

