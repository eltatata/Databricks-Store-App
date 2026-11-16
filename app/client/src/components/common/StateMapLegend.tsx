import type { StateMapStep } from '@/types/state-map.types';

interface StateMapLegendProps {
  steps: StateMapStep[];
  valueLabel: string;
  formatValue: (value: number) => string;
}

export function StateMapLegend({ steps, valueLabel, formatValue }: StateMapLegendProps) {
  const lastIndex = steps.length - 1;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ink-3">{valueLabel} by state, darker is higher</p>
      <ol className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => (
          <li key={step.color} className="flex flex-col gap-1.5">
            <span aria-hidden className="h-2 rounded-[2px]" style={{ backgroundColor: step.color }} />
            <span className="flex flex-wrap justify-between gap-x-2 text-[11px] text-ink-3 tabular-nums">
              <span>{formatValue(step.min)}</span>
              <span className={index === lastIndex ? undefined : 'sr-only'}>
                <span className="sr-only">to </span>
                {formatValue(step.max)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
