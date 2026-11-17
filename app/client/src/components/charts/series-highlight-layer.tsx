'use client';

import type { RefObject } from 'react';
import { useChartStable } from './chart-context';
import { HighlightSegment, type HighlightSegmentGlow } from './highlight-segment';
import { useHighlightSegment } from './use-highlight-segment';

interface SeriesHighlightLayerProps {
  enabled: boolean;
  height: number;
  pathRef: RefObject<SVGPathElement | null>;
  stroke: string;
  strokeWidth: number;

  span?: number;

  fadeLength?: number;
  glow?: HighlightSegmentGlow;
}

export function SeriesHighlightLayer({
  enabled,
  height,
  pathRef,
  stroke,
  strokeWidth,
  span,
  fadeLength,
  glow,
}: SeriesHighlightLayerProps) {
  const { isLoaded } = useChartStable();
  const { xSpring, widthSpring, isActive } = useHighlightSegment({
    enabled,
    span,
  });
  return (
    <HighlightSegment
      fadeLength={fadeLength}
      glow={glow}
      height={height}
      pathRef={pathRef}
      stroke={stroke}
      strokeWidth={strokeWidth}
      visible={enabled && isActive && isLoaded}
      width={widthSpring}
      x={xSpring}
    />
  );
}

SeriesHighlightLayer.displayName = 'SeriesHighlightLayer';
