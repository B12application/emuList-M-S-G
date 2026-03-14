import React, { createContext, useContext, useEffect, useState } from 'react';
import useSound from 'use-sound';

// @ts-ignore
import popSound from '/sounds/pop.mp3';
// @ts-ignore
import successSound from '/sounds/success.mp3';
// @ts-ignore
import clickSound from '/sounds/click.mp3';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playPop: () => void;
  playSuccess: () => void;
  playClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load preference from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('emuSoundEnabled');
    if (saved !== null) {
      setSoundEnabled(JSON.parse(saved));
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('emuSoundEnabled', JSON.stringify(newVal));
  };

  const [playPopSound] = useSound(popSound, { volume: 0.5, soundEnabled });
  const [playSuccessSound] = useSound(successSound, { volume: 0.5, soundEnabled });
  const [playClickSound] = useSound(clickSound, { volume: 0.7, soundEnabled });

  const playPop = () => {
    if (soundEnabled) playPopSound();
  };
  
  const playSuccess = () => {
    if (soundEnabled) playSuccessSound();
  };

  const playClick = () => {
    if (soundEnabled) playClickSound();
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playPop, playSuccess, playClick }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useAppSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useAppSound must be used within a SoundProvider');
  }
  return context;
};
