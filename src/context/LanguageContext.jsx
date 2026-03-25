import React, { createContext, useContext, useState } from 'react';
import { DEV_CONFIG } from '../config/devConfig';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(
    DEV_CONFIG.SKIP_ONBOARDING ? DEV_CONFIG.DEFAULT_LANGUAGE : null,
  );

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

