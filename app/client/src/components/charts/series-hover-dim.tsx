'use client';

import { m } from 'motion/react';
import type { ReactNode } from 'react';
import { selectIsChartHovering, useChartHoverSelector } from './chart-context';
import { useChartLegendHover } from './chart-legend-hover';

interface SeriesHoverDimProps {
  enabled?: boolean;

  dimOpacity?: number;

  durationSec?: number;

  seriesIndex?: number;

  children: ReactNode;
}

export function SeriesHoverDim({
  enabled = true,
  dimOpacity = 0.5,
  durationSec = 0.4,
  seriesIndex,
  children,
}: SeriesHoverDimProps) {
  const isChartHovering = useChartHoverSelector(selectIsChartHovering);
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isLegendDimmed = legendHoveredIndex !== null && seriesIndex !== undefined && legendHoveredIndex !== seriesIndex;
  const opacity = enabled && (isChartHovering || isLegendDimmed) ? dimOpacity : 1;
  return (
    <m.g animate={{ opacity }} initial={{ opacity: 1 }} transition={{ duration: durationSec, ease: 'easeInOut' }}>
      {children}
    </m.g>
  );
}

SeriesHoverDim.displayName = 'SeriesHoverDim';
