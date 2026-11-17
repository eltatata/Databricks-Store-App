import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/hooks/common/useTheme';
import type { ResolvedTheme } from '@/types/theme.types';

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  const background = getComputedStyle(root).getPropertyValue('--background').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  return children;
}
