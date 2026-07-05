import React, { createContext, useContext, useEffect, useState } from 'react';

type TranslationDictionary = Record<string, { en: string; ar: string; ur: string }>;

interface TranslationContextType {
  dictionary: TranslationDictionary;
  language: 'en' | 'ar' | 'ur';
  setLanguage: (lang: 'en' | 'ar' | 'ur') => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dictionary, setDictionary] = useState<TranslationDictionary>({});
  const [language, setLanguage] = useState<'en' | 'ar' | 'ur'>('en');

  useEffect(() => {
    fetch('/api/translation/dictionary')
      .then((res) => res.json())
      .then((data) => setDictionary(data))
      .catch((err) => console.error('Failed to load translations:', err));
  }, []);

  const t = (key: string) => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[language] || key;
  };

  return (
    <TranslationContext.Provider value={{ dictionary, language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
