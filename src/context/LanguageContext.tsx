import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchSettings, updateLocale } from "@/services/notificationService";

type Locale = "it" | "en";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>("it");

  useEffect(() => {
    fetchSettings()
      .then((settings) => {
        const saved = (settings?.locale ?? "it") as Locale;
        setLocaleState(saved);
        void i18n.changeLanguage(saved);
      })
      .catch(() => {
        // fall back to i18next default ("it") on error
      });
  }, [i18n]);

  async function setLocale(next: Locale) {
    setLocaleState(next);
    await Promise.all([i18n.changeLanguage(next), updateLocale(next)]);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
