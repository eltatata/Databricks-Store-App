'use client';

import type { ReactNode } from 'react';

interface PatternTileProps {
  id: string;

  children: ReactNode;

  size?: number;

  scale?: number;

  color?: string;

  opacity?: number;

  background?: string;
}

export function PatternTile({
  id,
  children,
  size = 48,
  scale = 1,
  color = 'var(--chart-1)',
  opacity = 1,
  background,
}: PatternTileProps) {
  const tile = size * scale;
  return (
    <defs>
      <pattern height={tile} id={id} patternUnits="userSpaceOnUse" viewBox={`0 0 ${size} ${size}`} width={tile}>
        {background ? <rect fill={background} height={size} width={size} /> : null}
        <g opacity={opacity} style={{ color }}>
          {children}
        </g>
      </pattern>
    </defs>
  );
}

PatternTile.displayName = 'PatternTile';
