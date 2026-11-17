'use client';

import { memo, useMemo } from 'react';
import { useChoroplethCamera } from './choropleth-camera';
import { useChoroplethStable } from './choropleth-context';
import { graticulePath } from './choropleth-projection';

interface ChoroplethGraticuleProps {
  stroke?: string;

  strokeWidth?: number;

  step?: [number, number];

  hideOnFocus?: boolean;
}

export const ChoroplethGraticule = memo(function ChoroplethGraticule({
  stroke = 'var(--chart-grid)',
  strokeWidth = 0.5,
  step,
  hideOnFocus = true,
}: ChoroplethGraticuleProps) {
  const { rawPathGenerator } = useChoroplethStable();
  const { focusedKey } = useChoroplethCamera();
  const hidden = hideOnFocus && focusedKey !== null;
  const stepX = step?.[0];
  const stepY = step?.[1];

  const d = useMemo(
    () => graticulePath(rawPathGenerator, stepX === undefined || stepY === undefined ? undefined : [stepX, stepY]),
    [rawPathGenerator, stepX, stepY]
  );

  return (
    <g
      className="visx-group visx-geo-graticule"
      style={{ opacity: hidden ? 0 : 1, transition: 'opacity 0.3s ease-out' }}
      transform="translate(0, 0)"
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
});

ChoroplethGraticule.displayName = 'ChoroplethGraticule';
