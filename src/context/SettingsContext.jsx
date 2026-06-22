import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../utils/whatsapp.js';

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: true });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
