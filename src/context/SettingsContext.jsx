import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('speakup_settings');
    return saved ? JSON.parse(saved) : {
      groqApiKey: '',
      technicalTopics: ['Machine Learning', 'System Design', 'Reinforcement Learning', 'RAG'],
      generalTopics: ['Leadership', 'Communication', 'Storytelling', 'Daily Routine'],
      durationPreference: 10,
      fillerWords: ['um', 'uh', 'like', 'you know', 'basically', 'sort of', 'kind of', 'actually', 'literally', 'right', 'so', 'i mean'],
    };
  });

  useEffect(() => {
    localStorage.setItem('speakup_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
