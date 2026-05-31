import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

export type Settings = {
  nom: string;
  role: string;
  siteDefaut: string;
  langue: 'fr' | 'en';
  formatDate: 'dd/mm/yyyy' | 'yyyy-mm-dd';
  nbLignesTableau: 10 | 100 | 1000;
};

const STORAGE_KEY = 'safran_settings';

const DEFAULTS: Settings = {
  nom: 'Opérateur SAFRAN',
  role: 'Opérateur',
  siteDefaut: 'Tous',
  langue: 'fr',
  formatDate: 'dd/mm/yyyy',
  nbLignesTableau: 100
};

function readFromStorage(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

type PreferencesContextType = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readFromStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function resetSettings() {
    setSettings(DEFAULTS);
  }

  return (
    <PreferencesContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export function useSettings() {
  return usePreferences();
}

export function useRowsPerPage() {
  const { settings } = usePreferences();
  return settings.nbLignesTableau;
}

export default useSettings;
