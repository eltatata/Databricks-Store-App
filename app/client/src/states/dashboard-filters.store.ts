import { create } from 'zustand';
import { DEFAULT_PERIOD_PRESET, DEFAULT_TREND_GRANULARITY, type PeriodPresetId } from '@/configs/dashboard';
import type { DateRange, TrendGranularity } from '@/types/dashboard.types';

interface DashboardFiltersState {
  presetId: PeriodPresetId;
  customRange: DateRange;
  granularity: TrendGranularity;
  topProductsCategory: string | null;
  selectPreset: (presetId: Exclude<PeriodPresetId, 'custom'>) => void;
  selectCustomRange: (range: DateRange) => void;
  setGranularity: (granularity: TrendGranularity) => void;
  setTopProductsCategory: (category: string | null) => void;
}

export const useDashboardFiltersStore = create<DashboardFiltersState>()((set) => ({
  presetId: DEFAULT_PERIOD_PRESET,
  customRange: {},
  granularity: DEFAULT_TREND_GRANULARITY,
  topProductsCategory: null,
  selectPreset: (presetId) => set({ presetId }),
  selectCustomRange: (customRange) => set({ presetId: 'custom', customRange }),
  setGranularity: (granularity) => set({ granularity }),
  setTopProductsCategory: (topProductsCategory) => set({ topProductsCategory }),
}));
