'use client';

import { type ReactNode, useCallback, useMemo } from 'react';
import { clipRevealTransition } from './animation';
import {
  type ChartHoverContextValue,
  defaultScatterColors,
  useChartHover,
  useChartHoverSelector,
  useChartStable,
  useYScale,
} from './chart-context';
import { useChartLegendHover } from './chart-legend-hover';
import {
  getSeriesMarkerVisualExtent,
  SeriesPointMarker,
  type SeriesPointMarkerStyle,
  StaticSeriesPointMarker,
} from './series-point-marker';

interface SeriesMarkersProps extends SeriesPointMarkerStyle {
  dataKey: string;

  fill?: string;

  animate?: boolean;

  getPointOffset?: (index: number, seriesIndex: number) => { x: number; y: number };
}

interface PointAt {
  index: number;
  cx: number;
  cy: number;
  revealDelay: number;
}

interface MarkerStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  ringGap: number;
  outlineWidth: number;
  outlineColor?: string;
  radius: number;
}

export function SeriesMarkers({
  dataKey,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
  animate = true,
  fadeOnHover = true,
  inactiveOpacity = 0.5,
  inactiveBlur = 2,
  enterBlur = 2,
  showActiveHighlight = true,
  getPointOffset,
}: SeriesMarkersProps) {
  const { data, xScale, innerWidth, enterTransition, animationDuration, revealEpoch, isLoaded, xAccessor, lines } =
    useChartStable();

  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line) => line.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);

  const seriesConfig = lines[seriesIndex];
  const yScale = useYScale(seriesConfig?.yAxisId);
  const seriesColor = defaultScatterColors[seriesIndex % defaultScatterColors.length] ?? defaultScatterColors[0];

  const resolvedFill = fill ?? seriesConfig?.stroke ?? seriesColor;
  const resolvedStroke = stroke ?? resolvedFill;

  const visualExtent = useMemo(
    () =>
      getSeriesMarkerVisualExtent({
        radius,
        strokeWidth,
        ringGap,
        outlineWidth,
        showActiveHighlight,
      }),
    [radius, strokeWidth, ringGap, outlineWidth, showActiveHighlight]
  );

  const revealDurationSec = clipRevealTransition(enterTransition).duration ?? animationDuration / 1000;
  const enterDuration = 0.5;
  const isRevealing = animate && !isLoaded;

  const getY = useCallback(
    (d: Record<string, unknown>) => {
      const value = d[dataKey];
      return typeof value === 'number' ? (yScale(value) ?? 0) : null;
    },
    [dataKey, yScale]
  );

  const points = useMemo<PointAt[]>(
    () =>
      data.flatMap((d, index) => {
        const cy = getY(d);
        if (cy === null) {
          return [];
        }
        const offset = getPointOffset?.(index, seriesIndex);
        const cx = (xScale(xAccessor(d)) ?? 0) + (offset?.x ?? 0);
        const leadingEdge = Math.max(0, cx - visualExtent);
        const revealDelay = innerWidth > 0 && isRevealing ? (leadingEdge / innerWidth) * revealDurationSec : 0;

        return [{ index, cx, cy: cy + (offset?.y ?? 0), revealDelay }];
      }),
    [
      data,
      getY,
      xScale,
      xAccessor,
      innerWidth,
      isRevealing,
      revealDurationSec,
      visualExtent,
      getPointOffset,
      seriesIndex,
    ]
  );

  const markerStyle = useMemo<MarkerStyle>(
    () => ({
      fill: resolvedFill,
      stroke: resolvedStroke,
      strokeWidth,
      ringGap,
      outlineWidth,
      outlineColor,
      radius,
    }),
    [resolvedFill, resolvedStroke, strokeWidth, ringGap, outlineWidth, outlineColor, radius]
  );

  if (isRevealing) {
    return (
      <g>
        {points.map((point) => (
          <SeriesPointMarker
            cx={point.cx}
            cy={point.cy}
            dataKey={dataKey}
            enterBlur={enterBlur}
            enterDuration={enterDuration}
            index={point.index}
            key={`${dataKey}-${point.index}`}
            revealDelay={point.revealDelay}
            revealEpoch={revealEpoch ?? 0}
            {...markerStyle}
          />
        ))}
      </g>
    );
  }

  const plainDots = strokeWidth <= 0 && outlineWidth <= 0;
  const baseMarkers = points.map((point) =>
    plainDots ? (
      <circle cx={point.cx} cy={point.cy} fill={resolvedFill} key={`${dataKey}-${point.index}`} r={radius} />
    ) : (
      <StaticSeriesPointMarker cx={point.cx} cy={point.cy} key={`${dataKey}-${point.index}`} {...markerStyle} />
    )
  );
  const activeScale = showActiveHighlight ? 1.35 : 1;

  return (
    <g>
      <SeriesMarkersDimWrapper
        enabled={fadeOnHover}
        inactiveBlur={inactiveBlur}
        inactiveOpacity={inactiveOpacity}
        seriesIndex={seriesIndex}
      >
        {baseMarkers}
      </SeriesMarkersDimWrapper>
      <SeriesMarkersActiveHighlight
        activeScale={activeScale}
        dataKey={dataKey}
        enabled={fadeOnHover}
        markerStyle={markerStyle}
        points={points}
      />
    </g>
  );
}

SeriesMarkers.displayName = 'SeriesMarkers';

interface SeriesMarkersDimWrapperProps {
  enabled: boolean;
  inactiveOpacity: number;
  inactiveBlur: number;
  seriesIndex: number;
  children: ReactNode;
}

const selectIsTooltipShown = (hover: ChartHoverContextValue) => hover.tooltipData !== null;

function SeriesMarkersDimWrapper({
  enabled,
  inactiveOpacity,
  inactiveBlur,
  seriesIndex,
  children,
}: SeriesMarkersDimWrapperProps) {
  const isHovered = useChartHoverSelector(selectIsTooltipShown);
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();
  const isLegendDimmed = legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;
  const dimBase = enabled && (isHovered || isLegendDimmed);
  return (
    <g
      opacity={dimBase ? inactiveOpacity : 1}
      style={{
        transition: 'opacity 0.15s ease-in-out, filter 0.15s ease-in-out',
        filter: dimBase && inactiveBlur > 0 ? `blur(${inactiveBlur}px)` : 'none',
      }}
    >
      {children}
    </g>
  );
}

interface SeriesMarkersActiveHighlightProps {
  dataKey: string;
  enabled: boolean;
  points: PointAt[];
  markerStyle: MarkerStyle;
  activeScale: number;
}

function SeriesMarkersActiveHighlight({
  dataKey,
  enabled,
  points,
  markerStyle,
  activeScale,
}: SeriesMarkersActiveHighlightProps) {
  const { tooltipData } = useChartHover();
  if (!enabled || tooltipData === null) {
    return null;
  }

  if (tooltipData.activeDataKey !== undefined && tooltipData.activeDataKey !== dataKey) {
    return null;
  }
  const activePoint = points.find((point) => point.index === tooltipData.index);
  if (!activePoint) {
    return null;
  }
  return <StaticSeriesPointMarker cx={activePoint.cx} cy={activePoint.cy} scale={activeScale} {...markerStyle} />;
}
