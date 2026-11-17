import { useMemo, useRef } from 'react';
import { useElementSize } from '@/components/charts/chart-parent-size';
import {
  type ChoroplethFeature,
  ChoroplethChart,
  ChoroplethFeatureComponent,
  ChoroplethTooltip,
} from '@/components/charts/choropleth';
import { TooltipContent } from '@/components/charts/tooltip/tooltip-content';
import { BRAZIL_STATES } from '@/configs/brazil-states';
import {
  BRAZIL_CENTER,
  BRAZIL_SCALE_PER_PIXEL,
  STATE_MAP_ASPECT_RATIO,
  STATE_MAP_BORDER_COLOR,
  STATE_MAP_COLORS,
  STATE_MAP_EMPTY_COLOR,
} from '@/configs/geo';
import { cn } from '@/lib/utils';
import type { StateMapDatum } from '@/types/state-map.types';
import { buildStateMapSteps, indexByState, stepColorOf } from '@/utils/state-map';
import { StateMapLegend } from './StateMapLegend';

interface BrazilStateMapProps {
  data: StateMapDatum[];
  valueLabel: string;
  formatValue: (value: number) => string;
  detailLabel?: string;
  revealSignature?: string;
  className?: string;
}

const stateIdOf = (feature: ChoroplethFeature) => String(feature.properties.id ?? '');

export function BrazilStateMap({
  data,
  valueLabel,
  formatValue,
  detailLabel,
  revealSignature,
  className,
}: BrazilStateMapProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(frameRef);
  const byState = useMemo(() => indexByState(data), [data]);
  const steps = useMemo(
    () =>
      buildStateMapSteps(
        data.map((datum) => datum.value),
        STATE_MAP_COLORS
      ),
    [data]
  );

  const colorOf = (feature: ChoroplethFeature) => {
    const datum = byState.get(stateIdOf(feature));
    return datum ? stepColorOf(steps, datum.value, STATE_MAP_EMPTY_COLOR) : STATE_MAP_EMPTY_COLOR;
  };

  const renderTooltip = ({ feature }: { feature: ChoroplethFeature }) => {
    const datum = byState.get(stateIdOf(feature));
    const rows = datum
      ? [
          { color: colorOf(feature), label: valueLabel, value: formatValue(datum.value) },
          ...(detailLabel && datum.detail
            ? [{ color: 'var(--chart-foreground-muted)', label: detailLabel, value: datum.detail }]
            : []),
        ]
      : [{ color: STATE_MAP_EMPTY_COLOR, label: valueLabel, value: 'No sales' }];
    return <TooltipContent title={`${String(feature.properties.name ?? '')} (${stateIdOf(feature)})`} rows={rows} />;
  };

  return (
    <figure className={cn('flex flex-col gap-4', className)}>
      <div ref={frameRef} className="w-full" style={{ aspectRatio: STATE_MAP_ASPECT_RATIO }}>
        {width > 0 ? (
          <ChoroplethChart
            data={BRAZIL_STATES}
            aspectRatio={STATE_MAP_ASPECT_RATIO}
            center={BRAZIL_CENTER}
            scale={width * BRAZIL_SCALE_PER_PIXEL}
            translate={[width / 2, width / 2]}
            clickToZoom
            focusMaxZoom={3}
            revealSignature={revealSignature}
          >
            <ChoroplethFeatureComponent
              getFeatureColor={colorOf}
              stroke={STATE_MAP_BORDER_COLOR}
              strokeWidth={1}
              fadedOpacity={0.55}
            />
            <ChoroplethTooltip content={renderTooltip} />
          </ChoroplethChart>
        ) : null}
      </div>
      <figcaption>
        <StateMapLegend steps={steps} valueLabel={valueLabel} formatValue={formatValue} />
      </figcaption>
    </figure>
  );
}
