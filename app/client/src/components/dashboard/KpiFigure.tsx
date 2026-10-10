import NumberFlow, { type Format } from '@number-flow/react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { SignalDot } from '@/components/common/SignalDot';
import { cn } from '@/lib/utils';
import type { KpiFormat, KpiReading } from '@/types/dashboard.types';
import { formatSignedPercent, formatSignedPoints } from '@/utils/format';

const NUMBER_FORMATS: Record<KpiFormat, Format> = {
  currency: { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 },
  count: { maximumFractionDigits: 0 },
  score: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  percent: { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 },
};

const HERO_FORMATS: Partial<Record<KpiFormat, Format>> = {
  currency: { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 2 },
};

const describeChange = (reading: KpiReading) => {
  if (reading.change === null) {
    return null;
  }
  const kind = reading.definition.format;
  if (kind === 'percent') {
    return formatSignedPoints(reading.change);
  }
  if (kind === 'score') {
    return `${reading.change > 0 ? '+' : reading.change < 0 ? '−' : ''}${Math.abs(reading.change).toFixed(2)}`;
  }
  return formatSignedPercent(reading.change);
};

const DirectionIcon = ({ change }: { change: number }) => {
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  return <Icon aria-hidden className="size-3.5" strokeWidth={2} />;
};

interface KpiFigureProps {
  reading: KpiReading;
  isLargestMove: boolean;
  comparisonLabel: string | null;
  variant: 'hero' | 'standard';
}

export function KpiFigure({ reading, isLargestMove, comparisonLabel, variant }: KpiFigureProps) {
  const { definition, value, change } = reading;
  const changeText = describeChange(reading);
  const format =
    (variant === 'hero' ? HERO_FORMATS[definition.format] : undefined) ?? NUMBER_FORMATS[definition.format];
  const improved = change !== null && (definition.higherIsBetter ? change > 0 : change < 0);

  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-xs text-ink-3">{definition.label}</dt>
      <dd className="mt-2">
        <span
          className={cn(
            'relative inline-flex items-start gap-1.5 font-condensed tracking-[-0.03em] text-ink',
            variant === 'hero'
              ? 'text-[64px] leading-[0.95] font-extralight lg:text-[76px]'
              : 'text-[34px] leading-none font-light'
          )}
        >
          {value === null ? (
            '—'
          ) : (
            <NumberFlow
              value={value}
              format={format}
              locales="en-US"
              willChange
              className="[--number-flow-mask-height:0.1em]"
            />
          )}
          {isLargestMove ? (
            <SignalDot layoutId="kpi-signal" className={variant === 'hero' ? 'mt-3 size-3' : 'mt-1 size-2.5'} />
          ) : null}
        </span>
      </dd>
      <dd className="mt-2.5 flex min-h-4 items-center gap-1.5 text-xs">
        {changeText && change !== null ? (
          <>
            <span className={cn('inline-flex items-center gap-0.5', isLargestMove ? 'text-signal' : 'text-ink-2')}>
              <DirectionIcon change={change} />
              {changeText}
            </span>
            <span className="truncate text-ink-3">
              {isLargestMove ? 'largest move' : improved ? 'better' : change === 0 ? 'flat' : 'worse'}
              {variant === 'hero' && comparisonLabel ? ` · ${comparisonLabel}` : ''}
            </span>
          </>
        ) : (
          <span className="text-ink-3">No comparison period</span>
        )}
      </dd>
    </div>
  );
}
