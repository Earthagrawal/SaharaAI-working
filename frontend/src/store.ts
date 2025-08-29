import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'high-contrast';
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;
  micMode: 'hold' | 'toggle';
  setMicMode: (mode: 'hold' | 'toggle') => void;
  cameraConsent: boolean;
  setCameraConsent: (consent: boolean) => void;
  sessionId: string;
  setSessionId: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem('theme') as UIState['theme']) || 'light',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  micMode: 'hold',
  setMicMode: (micMode) => set({ micMode }),
  cameraConsent: false,
  setCameraConsent: (cameraConsent) => set({ cameraConsent }),
  sessionId: 's1',
  setSessionId: (sessionId) => set({ sessionId }),
}));
