import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/configs/theme';
import type { Theme } from '@/types/theme.types';

interface UiState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: ({ theme }) => ({ theme }),
    }
  )
);
