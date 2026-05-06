import { createContext, useContext, useState, useEffect } from 'react';
import { readStorage, writeStorage } from '../utils/storageAdapter';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  groqApiKey: '',
  technicalTopics: ['Machine Learning', 'System Design', 'Reinforcement Learning', 'RAG'],
  generalTopics: ['Leadership', 'Communication', 'Storytelling', 'Daily Routine'],
  durationPreference: 10,
  fillerWords: ['um', 'uh', 'like', 'you know', 'basically', 'sort of', 'kind of', 'actually', 'literally', 'right', 'so', 'i mean'],
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    return readStorage('speakup_settings', DEFAULT_SETTINGS);
  });

  useEffect(() => {
    writeStorage('speakup_settings', settings);
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const overwriteSettings = (newSettings) => {
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, overwriteSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
