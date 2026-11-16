import { useSyncExternalStore } from 'react';
import { DARK_SCHEME_QUERY } from '@/configs/theme';
import { useUiStore } from '@/states/ui.store';
import type { ResolvedTheme } from '@/types/theme.types';

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_SCHEME_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function readServerTheme(): ResolvedTheme {
  return 'light';
}

export function useTheme() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, readSystemTheme, readServerTheme);
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  return { theme, setTheme, resolvedTheme };
}
