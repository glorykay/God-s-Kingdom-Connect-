import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, translations } from '@/i18n/translations';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'glory-lang';

function detectInitialLang(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'fr' || stored === 'zh' || stored === 'es' || stored === 'pt' || stored === 'ja') return stored;
  const browser = navigator.language.slice(0, 2);
  if (browser === 'fr') return 'fr';
  if (browser === 'zh') return 'zh';
  if (browser === 'es') return 'es';
  if (browser === 'pt') return 'pt';
  if (browser === 'ja') return 'ja';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    setLangState(detectInitialLang());
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations.en;
      let str = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
