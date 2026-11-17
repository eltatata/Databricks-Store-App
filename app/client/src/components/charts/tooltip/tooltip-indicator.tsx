'use client';

import { m, useSpring } from 'motion/react';
import { useEffect, useId } from 'react';
import { type SpringConfig, useChartConfig } from '../chart-config-context';
import { chartCssVars } from '../chart-context';
import { type IndicatorFadeEdges, indicatorFadeGradientStops, resolveVerticalFadeSides } from '../indicator-fade';

type IndicatorWidth = number | 'line' | 'thin' | 'medium' | 'thick';

interface TooltipIndicatorProps {
  x: number;

  height: number;

  visible: boolean;

  width?: IndicatorWidth;

  span?: number;

  columnWidth?: number;

  colorEdge?: string;

  colorMid?: string;

  colorEnd?: string;

  bottom?: number;

  fadeEdges?: IndicatorFadeEdges | boolean;

  fadeLength?: number;

  animate?: boolean;

  gradientId?: string;

  springConfig?: SpringConfig;

  strokeDasharray?: string;
}

function resolveWidth(width: IndicatorWidth): number {
  if (typeof width === 'number') {
    return width;
  }
  switch (width) {
    case 'line':
      return 1;
    case 'thin':
      return 2;
    case 'medium':
      return 4;
    case 'thick':
      return 8;
    default:
      return 1;
  }
}

function verticalRampColor(top: string, end: string, offset: string): string {
  const percent = Number.parseFloat(offset);
  if (percent <= 0) {
    return top;
  }
  if (percent >= 100) {
    return end;
  }
  return `color-mix(in srgb, ${end} ${percent}%, ${top})`;
}

export function TooltipIndicator(props: TooltipIndicatorProps) {
  if (!props.visible) {
    return null;
  }
  return <TooltipIndicatorInner {...props} />;
}

function TooltipIndicatorInner({
  x,
  visible,
  height,
  width = 'line',
  span,
  columnWidth,
  colorEdge = chartCssVars.crosshair,
  colorMid = chartCssVars.crosshair,
  colorEnd,
  bottom,
  fadeEdges = 'both',
  fadeLength = 10,
  animate = true,
  gradientId: gradientIdProp,
  springConfig,
  strokeDasharray,
}: TooltipIndicatorProps) {
  const generatedId = useId();
  const gradientId = gradientIdProp ?? `tooltip-indicator-gradient-${generatedId}`;
  const { tooltipSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipSpring;

  const pixelWidth = span !== undefined && columnWidth !== undefined ? span * columnWidth : resolveWidth(width);

  const rectX = x - pixelWidth / 2;
  const lineX = x;
  const endY = Math.max(0, Math.min(height, bottom ?? height));
  const animatedX = useSpring(rectX, effectiveSpring);
  const animatedLineX = useSpring(lineX, effectiveSpring);
  const animatedEndY = useSpring(endY, effectiveSpring);

  if (animate) {
    animatedX.set(rectX);
    animatedLineX.set(lineX);
    animatedEndY.set(endY);
  }

  useEffect(() => {
    animatedX.set(rectX);
    animatedLineX.set(lineX);
    animatedEndY.set(endY);
  }, [animatedLineX, animatedX, animatedEndY, endY, lineX, rectX, visible]);

  const indicatorFill = colorMid || colorEdge;
  const fadeSides = resolveVerticalFadeSides(fadeEdges);
  const dashed = Boolean(strokeDasharray);

  if (dashed) {
    const strokeWidth = Math.max(1, pixelWidth);
    return animate ? (
      <m.line
        stroke={indicatorFill}
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
        x1={animatedLineX}
        x2={animatedLineX}
        y1={0}
        y2={animatedEndY}
      />
    ) : (
      <line
        stroke={indicatorFill}
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
        x1={lineX}
        x2={lineX}
        y1={0}
        y2={endY}
      />
    );
  }

  if (!(fadeSides.any || colorEnd)) {
    return animate ? (
      <m.rect fill={indicatorFill} height={animatedEndY} width={pixelWidth} x={animatedX} y={0} />
    ) : (
      <rect fill={indicatorFill} height={endY} width={pixelWidth} x={rectX} y={0} />
    );
  }

  const fadeStops = indicatorFadeGradientStops(fadeSides, fadeLength);
  if (colorEnd && fadeStops.length === 1) {
    fadeStops.push({ offset: '100%', opacity: 1 });
  }

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
          {fadeStops.map((stop) => (
            <stop
              key={stop.offset}
              offset={stop.offset}
              style={{
                stopColor: colorEnd ? verticalRampColor(indicatorFill, colorEnd, stop.offset) : indicatorFill,
                stopOpacity: stop.opacity,
              }}
            />
          ))}
        </linearGradient>
      </defs>
      {animate ? (
        <m.rect fill={`url(#${gradientId})`} height={animatedEndY} width={pixelWidth} x={animatedX} y={0} />
      ) : (
        <rect fill={`url(#${gradientId})`} height={endY} width={pixelWidth} x={rectX} y={0} />
      )}
    </g>
  );
}

TooltipIndicator.displayName = 'TooltipIndicator';
