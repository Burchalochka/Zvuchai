import React, { createContext, useState, useContext } from 'react';

const SelectedDateContext = createContext();

export const useSelectedDate = () => {
  const context = useContext(SelectedDateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used within SelectedDateProvider');
  }
  return context;
};

export const SelectedDateProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
};
