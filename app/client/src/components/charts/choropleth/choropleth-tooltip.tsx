'use client';

import { intFmt } from '../chart-formatters';
import { CursorTooltipBox } from '../tooltip/cursor-tooltip-box';
import { TooltipContent, type TooltipRow } from '../tooltip/tooltip-content';
import { TOOLTIP_HIDE_DELAY_MS, useDelayedTooltipData } from '../tooltip/use-delayed-tooltip-data';
import { type ChoroplethFeature, useChoroplethInteraction, useChoroplethStable } from './choropleth-context';

interface ChoroplethTooltipProps {
  content?: (props: { feature: ChoroplethFeature; index: number }) => React.ReactNode;

  formatValue?: (value: number) => string;

  getFeatureName?: (feature: ChoroplethFeature, index: number) => string;

  getFeatureValue?: (feature: ChoroplethFeature, index: number) => number | undefined;

  valueLabel?: string;

  className?: string;

  panelStyle?: React.CSSProperties;

  backgroundColor?: string;

  exit?: boolean;

  hideDelay?: number;
}

export function ChoroplethTooltip({
  content,
  formatValue = intFmt,
  getFeatureName,
  getFeatureValue,
  valueLabel = 'Value',
  className = '',
  panelStyle,
  backgroundColor,
  exit = true,
  hideDelay = TOOLTIP_HIDE_DELAY_MS,
}: ChoroplethTooltipProps) {
  const { containerRef, features } = useChoroplethStable();
  const { tooltipData: hoverData, markerTooltip: hoverMarker } = useChoroplethInteraction();
  const tooltipData = useDelayedTooltipData(hoverData, 0, hideDelay);
  const marker = useDelayedTooltipData(hoverMarker ?? null, 0, hideDelay);

  const feature = tooltipData ? features[tooltipData.featureIndex] : undefined;

  let body: React.ReactNode = null;
  if (marker) {
    const [lon, lat] = marker.coordinates;
    body = (
      <TooltipContent
        rows={[
          {
            color: 'var(--chart-foreground-muted)',
            label: 'Location',
            value: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          },
        ]}
        title={marker.label}
      />
    );
  } else if (tooltipData && feature) {
    const index = tooltipData.featureIndex;
    if (content) {
      body = content({ feature, index });
    } else {
      const featureName = getFeatureName
        ? getFeatureName(feature, index)
        : (feature.properties?.name ?? `Feature ${index}`);
      const value = getFeatureValue?.(feature, index);
      const rows: TooltipRow[] =
        value === undefined
          ? []
          : [
              {
                color: 'var(--chart-1)',
                label: valueLabel,
                value: formatValue(value),
              },
            ];
      body = <TooltipContent rows={rows} title={featureName} />;
    }
  }

  return (
    <CursorTooltipBox
      backgroundColor={backgroundColor}
      className={className}
      containerRef={containerRef}
      exit={exit}
      panelStyle={panelStyle}
      visible={Boolean(marker || (tooltipData && feature))}
    >
      {body}
    </CursorTooltipBox>
  );
}

ChoroplethTooltip.displayName = 'ChoroplethTooltip';
