import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import type { DateRange as PickerRange } from 'react-day-picker';
import { parseISO } from 'date-fns';
import { useShallow } from 'zustand/react/shallow';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AccentDot } from '@/components/common/AccentDot';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DATASET_END, DATASET_START, PERIOD_PRESETS, type PeriodPreset } from '@/configs/dashboard';
import { cn } from '@/lib/utils';
import { useDashboardFiltersStore } from '@/states/dashboard-filters.store';
import { toIsoDate } from '@/utils/period';

const PRESET_OPTIONS = PERIOD_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }));
const START_MONTH = parseISO(DATASET_START);
const END_MONTH = parseISO(DATASET_END);

interface DashboardFiltersProps {
  customLabel: string;
}

export function DashboardFilters({ customLabel }: DashboardFiltersProps) {
  const { presetId, customRange, selectPreset, selectCustomRange } = useDashboardFiltersStore(
    useShallow((state) => ({
      presetId: state.presetId,
      customRange: state.customRange,
      selectPreset: state.selectPreset,
      selectCustomRange: state.selectCustomRange,
    }))
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PickerRange | undefined>(undefined);
  const isCustom = presetId === 'custom';

  const openPicker = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraft(
        customRange.from && customRange.to
          ? { from: parseISO(customRange.from), to: parseISO(customRange.to) }
          : undefined
      );
    }
  };

  const applyDraft = () => {
    if (draft?.from && draft.to) {
      selectCustomRange({ from: toIsoDate(draft.from), to: toIsoDate(draft.to) });
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl<PeriodPreset['id']>
        label="Period"
        options={PRESET_OPTIONS}
        value={presetId === 'custom' ? null : presetId}
        onChange={selectPreset}
        accentId="period-signal"
      />
      <Popover open={open} onOpenChange={openPicker}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-pressed={isCustom}
            className={cn(
              'flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors duration-200 active:scale-[0.97]',
              isCustom
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-hairline text-ink-2 hover:border-hairline-strong hover:text-ink'
            )}
          >
            {isCustom ? (
              <AccentDot layoutId="period-signal" className="size-1.5" />
            ) : (
              <CalendarRange className="size-3.5" strokeWidth={1.75} />
            )}
            {isCustom ? customLabel : 'Custom range'}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-3">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft?.from ?? parseISO('2018-01-01')}
            startMonth={START_MONTH}
            endMonth={END_MONTH}
            disabled={{ before: START_MONTH, after: END_MONTH }}
          />
          <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <span className="text-xs text-ink-3">Orders exist from Sep 2016 to Oct 2018</span>
            <Button size="sm" onClick={applyDraft} disabled={!draft?.from || !draft.to}>
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
