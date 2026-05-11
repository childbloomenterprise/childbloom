import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme, PALETTE_KEYS } from '../components/cb/theme';

const useThemeStore = create(
  persist(
    (set, get) => ({
      palette: 'emerald',
      mode: 'light',
      setPalette: (palette) => {
        if (!PALETTE_KEYS.includes(palette)) return;
        set({ palette });
        applyTheme(palette, get().mode);
      },
      setMode: (mode) => {
        if (mode !== 'light' && mode !== 'dark') return;
        set({ mode });
        applyTheme(get().palette, mode);
      },
      toggleMode: () => {
        const next = get().mode === 'light' ? 'dark' : 'light';
        set({ mode: next });
        applyTheme(get().palette, next);
      },
      // Call once at app boot to push the persisted theme onto :root
      init: () => applyTheme(get().palette, get().mode),
    }),
    { name: 'childbloom_theme' }
  )
);

export default useThemeStore;
