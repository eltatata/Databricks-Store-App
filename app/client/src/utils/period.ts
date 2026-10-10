import { format, parseISO, subYears } from 'date-fns';
import { PERIOD_PRESETS, type PeriodPresetId } from '@/configs/dashboard';
import type { DateRange } from '@/types/dashboard.types';

const ISO_DATE = 'yyyy-MM-dd';

export interface ResolvedPeriod {
  range: DateRange;
  comparison: DateRange | null;
  label: string;
  comparisonLabel: string | null;
}

const shiftYearBack = (value: string) => format(subYears(parseISO(value), 1), ISO_DATE);

const formatRangeLabel = (range: DateRange) =>
  range.from && range.to
    ? `${format(parseISO(range.from), 'MMM d, yyyy')} – ${format(parseISO(range.to), 'MMM d, yyyy')}`
    : 'All time';

const comparisonOf = (range: DateRange): DateRange | null =>
  range.from && range.to ? { from: shiftYearBack(range.from), to: shiftYearBack(range.to) } : null;

export const resolvePeriod = (presetId: PeriodPresetId, customRange: DateRange): ResolvedPeriod => {
  const preset = PERIOD_PRESETS.find((candidate) => candidate.id === presetId);
  const range = preset ? { from: preset.from, to: preset.to } : customRange;
  const comparison = comparisonOf(range);
  return {
    range,
    comparison,
    label: preset?.label ?? formatRangeLabel(range),
    comparisonLabel: comparison ? `vs ${formatRangeLabel(comparison)}` : null,
  };
};

export const toIsoDate = (date: Date) => format(date, ISO_DATE);
