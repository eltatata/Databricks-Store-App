import { memo } from 'react';
import {
  areaVerticalFadeStops,
  type FadeEdges,
  fadeGradientStops,
  resolveFadeSides,
  viewportFadeGradientAttrs,
} from './fade-edges';

interface AreaGradientDefsProps {
  gradientId: string;
  strokeGradientId: string;
  edgeMaskId: string;
  edgeGradientId: string;
  fill: string;
  fillOpacity: number;
  gradientToOpacity: number;

  gradientSpan?: number;
  resolvedStroke: string;
  isPatternFill: boolean;
  fadeEdges: FadeEdges;

  fadeBottom?: number;
  innerWidth: number;
  innerHeight: number;
}

export const AreaGradientDefs = memo(function AreaGradientDefs({
  gradientId,
  strokeGradientId,
  edgeMaskId,
  edgeGradientId,
  fill,
  fillOpacity,
  gradientToOpacity,
  gradientSpan = 1,
  resolvedStroke,
  isPatternFill,
  fadeEdges,
  fadeBottom,
  innerWidth,
  innerHeight,
}: AreaGradientDefsProps) {
  const sides = resolveFadeSides(fadeEdges);

  const strokeStops = sides.any ? fadeGradientStops(sides) : null;
  const showEdgeMask = sides.any && !isPatternFill;
  const edgeStops = showEdgeMask ? fadeGradientStops(sides) : null;
  const verticalStops = areaVerticalFadeStops({
    topOpacity: fillOpacity,
    fadeBottom,
    gradientToOpacity,
    gradientSpan,
  });

  return (
    <defs>
      {isPatternFill ? null : (
        <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
          {verticalStops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} style={{ stopColor: fill, stopOpacity: stop.opacity }} />
          ))}
        </linearGradient>
      )}

      {strokeStops ? (
        <linearGradient id={strokeGradientId} {...viewportFadeGradientAttrs(innerWidth)}>
          {strokeStops.map((stop) => (
            <stop
              key={stop.offset}
              offset={stop.offset}
              style={{ stopColor: resolvedStroke, stopOpacity: stop.opacity }}
            />
          ))}
        </linearGradient>
      ) : null}

      {edgeStops ? (
        <>
          <linearGradient id={edgeGradientId} {...viewportFadeGradientAttrs(innerWidth)}>
            {edgeStops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} style={{ stopColor: 'white', stopOpacity: stop.opacity }} />
            ))}
          </linearGradient>
          <mask id={edgeMaskId}>
            <rect fill={`url(#${edgeGradientId})`} height={innerHeight} width={innerWidth} x="0" y="0" />
          </mask>
        </>
      ) : null}
    </defs>
  );
});
