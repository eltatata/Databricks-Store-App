import type { Theme } from '@/types/theme.types';

export const THEME_STORAGE_KEY = 'olist-store-theme';
export const DEFAULT_THEME: Theme = 'system';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];
