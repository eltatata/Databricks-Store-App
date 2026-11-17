'use client';

import { MotionGlobalConfig } from 'motion/react';
import { memo, useLayoutEffect, useRef } from 'react';
import { DEFAULT_ANIMATION_EASING } from './animation';

export interface SeriesPointMarkerStyle {
  fill?: string;

  stroke?: string;

  strokeWidth?: number;

  ringGap?: number;

  outlineWidth?: number;

  outlineColor?: string;

  radius?: number;

  fadeOnHover?: boolean;

  inactiveOpacity?: number;

  inactiveBlur?: number;

  enterBlur?: number;

  showActiveHighlight?: boolean;
}

interface MarkerCirclesProps {
  fill?: string;
  stroke?: string;
  strokeWidth: number;
  ringGap: number;
  outlineWidth: number;
  outlineColor?: string;
  radius: number;
}

function MarkerCircles({ fill, stroke, strokeWidth, ringGap, outlineWidth, outlineColor, radius }: MarkerCirclesProps) {
  const resolvedStroke = stroke ?? fill ?? 'currentColor';
  const resolvedOutlineColor = outlineColor ?? resolvedStroke;
  const ringOuter = strokeWidth > 0 ? radius + ringGap + strokeWidth : radius;
  const outlineRadius = outlineWidth > 0 ? ringOuter + outlineWidth / 2 : 0;

  return (
    <>
      {outlineWidth > 0 ? (
        <circle cx={0} cy={0} fill="none" r={outlineRadius} stroke={resolvedOutlineColor} strokeWidth={outlineWidth} />
      ) : null}
      <circle cx={0} cy={0} fill={fill} r={radius} />
      {strokeWidth > 0 ? (
        <circle
          cx={0}
          cy={0}
          fill="none"
          r={radius + ringGap + strokeWidth / 2}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
        />
      ) : null}
    </>
  );
}

interface StaticSeriesPointMarkerProps extends SeriesPointMarkerStyle {
  cx: number;
  cy: number;
  scale?: number;
}

export const StaticSeriesPointMarker = memo(function StaticSeriesPointMarker({
  cx,
  cy,
  scale = 1,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
}: StaticSeriesPointMarkerProps) {
  if (strokeWidth <= 0 && outlineWidth <= 0) {
    return <circle cx={cx} cy={cy} fill={fill} r={radius * scale} />;
  }
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <MarkerCircles
        fill={fill}
        outlineColor={outlineColor}
        outlineWidth={outlineWidth}
        radius={radius}
        ringGap={ringGap}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
});

interface SeriesPointMarkerProps extends SeriesPointMarkerStyle {
  dataKey: string;
  index: number;
  cx: number;
  cy: number;
  revealDelay: number;
  revealEpoch: number;
  enterDuration: number;
}

const MARKER_ENTERED_STYLE = { opacity: 1, filter: 'blur(0px)' } as const;

export function SeriesPointMarker({
  dataKey,
  index,
  cx,
  cy,
  enterBlur = 2,
  revealDelay,
  revealEpoch,
  enterDuration,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
}: SeriesPointMarkerProps) {
  const enterRef = useRef<SVGGElement>(null);
  const timingRef = useRef({ enterBlur, revealDelay, enterDuration });
  timingRef.current = { enterBlur, revealDelay, enterDuration };

  useLayoutEffect(() => {
    const element = enterRef.current;
    if (
      !element ||
      typeof element.animate !== 'function' ||
      MotionGlobalConfig.skipAnimations ||
      MotionGlobalConfig.instantAnimations
    ) {
      return;
    }
    const timing = timingRef.current;
    const animation = element.animate([{ opacity: 0, filter: `blur(${timing.enterBlur}px)` }, MARKER_ENTERED_STYLE], {
      delay: timing.revealDelay * 1000,
      duration: timing.enterDuration * 1000,
      easing: DEFAULT_ANIMATION_EASING,
      fill: 'backwards',
    });
    return () => animation.cancel();
  }, [revealEpoch]);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <g key={`${dataKey}-${index}-${revealEpoch}`} ref={enterRef} style={MARKER_ENTERED_STYLE}>
        <MarkerCircles
          fill={fill}
          outlineColor={outlineColor}
          outlineWidth={outlineWidth}
          radius={radius}
          ringGap={ringGap}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    </g>
  );
}

export function getSeriesMarkerVisualExtent(
  style: Pick<SeriesPointMarkerStyle, 'radius' | 'strokeWidth' | 'ringGap' | 'outlineWidth' | 'showActiveHighlight'>
): number {
  const radius = style.radius ?? 5;
  const strokeWidth = style.strokeWidth ?? 2;
  const ringGap = style.ringGap ?? 2;
  const outlineWidth = style.outlineWidth ?? 0;
  const showActiveHighlight = style.showActiveHighlight ?? true;
  const ring = strokeWidth > 0 ? ringGap + strokeWidth : 0;
  const outline = outlineWidth > 0 ? outlineWidth : 0;
  const highlightPad = showActiveHighlight ? radius * 0.35 : 0;
  return radius + ring + outline + highlightPad + 2;
}
