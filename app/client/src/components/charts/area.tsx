'use client';

import { type CurveFactory, curveMonotoneX } from 'd3-shape';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { AreaGradientDefs } from './area-gradient-defs';
import { chartCssVars, useChartStable, useYScale } from './chart-context';
import type { ChartPhase, LoadingStyle } from './chart-phase';
import { type FadeEdges, resolveFadeSides } from './fade-edges';
import { type LineLoadingPulseMode, LineLoadingPulseStroke, resolveLineLoadingPulseMode } from './line-loading-pulse';
import { LINE_LOADING_LOOP_PAUSE_MS } from './line-loading-timing';
import { areaClosedD, LinePath, linePathD } from './line-path';
import { LineLoadingSweep } from './loading-sweep';
import { resolveDashTailBounds, usePathStrokeMetrics } from './path-stroke-utils';
import { SeriesDashTailOverlay } from './series-dash-tail-overlay';
import { SeriesHighlightLayer } from './series-highlight-layer';
import { SeriesHoverDim } from './series-hover-dim';
import { SeriesMarkers } from './series-markers';
import type { SeriesPointMarkerStyle } from './series-point-marker';

export interface AreaProps {
  dataKey: string;

  yAxisId?: string | number;

  fill?: string;

  fillOpacity?: number;

  stroke?: string;

  strokeWidth?: number;

  curve?: CurveFactory;

  animate?: boolean;

  showLine?: boolean;

  showHighlight?: boolean;

  gradientToOpacity?: number;

  gradientSpan?: number;

  fadeEdges?: FadeEdges;

  fadeBottom?: number;

  showMarkers?: boolean;

  markers?: SeriesPointMarkerStyle;

  showValue?: boolean;

  valueLabelMinCount?: number;

  valueLabelMaxCount?: number;

  valueLabelFormatter?: (value: number) => string;

  valueLabelColor?: string;

  fadeValueLabels?: boolean;

  dashFromIndex?: number;

  dashArray?: string;

  loadingStroke?: string;

  loadingStrokeOpacity?: number;

  loading?: boolean;

  loadingPulseMode?: LineLoadingPulseMode;

  loadingStyle?: LoadingStyle;
}

function useAreaLoadingPulseState(
  chartPhase: ChartPhase,
  loading: boolean | undefined,
  loadingPulseMode: LineLoadingPulseMode | undefined,
  notifyLoadingPulseComplete?: () => void
) {
  const phasePulseMode = resolveLineLoadingPulseMode(chartPhase);
  const pulseMode = loading === false ? null : (loadingPulseMode ?? (loading === true ? 'loop' : phasePulseMode));
  const showLoadingPulse = pulseMode != null;
  const showSeriesContent = chartPhase === 'revealing' || chartPhase === 'ready' || chartPhase === 'exitingReady';
  const [pulseEpoch, setPulseEpoch] = useState(0);

  const handleLoadingPulseComplete = useCallback(() => {
    if (pulseMode === 'loop') {
      window.setTimeout(() => {
        setPulseEpoch((epoch) => epoch + 1);
      }, LINE_LOADING_LOOP_PAUSE_MS);
      return;
    }
    notifyLoadingPulseComplete?.();
  }, [notifyLoadingPulseComplete, pulseMode]);

  return {
    handleLoadingPulseComplete,
    pulseMode,
    pulseEpoch,
    showLoadingPulse,
    showSeriesContent,
  };
}

export function Area({
  dataKey,
  yAxisId,
  fill = chartCssVars.linePrimary,
  fillOpacity = 0.4,
  stroke,
  strokeWidth = 2,
  curve = curveMonotoneX,
  animate = true,
  showLine = true,
  showHighlight = true,
  gradientToOpacity = 0,
  gradientSpan = 1,
  fadeEdges = false,
  fadeBottom,
  showMarkers = false,
  markers,
  dashFromIndex,
  dashArray = '6,4',
  loading,
  loadingStroke = chartCssVars.foreground,
  loadingStrokeOpacity = 0.5,
  loadingPulseMode,
  loadingStyle = 'pulse',
}: AreaProps) {
  const {
    data,
    renderData,
    xScale,
    innerHeight,
    innerWidth,
    xAccessor,
    lines,
    chartPhase,
    notifyLoadingPulseComplete,
  } = useChartStable();
  const yScale = useYScale(yAxisId);
  const { handleLoadingPulseComplete, pulseMode, pulseEpoch, showLoadingPulse, showSeriesContent } =
    useAreaLoadingPulseState(chartPhase, loading, loadingPulseMode, notifyLoadingPulseComplete);

  const seriesIndex = useMemo(() => {
    const index = lines.findIndex((line) => line.dataKey === dataKey);
    return index >= 0 ? index : 0;
  }, [lines, dataKey]);

  const pathRef = useRef<SVGPathElement>(null);
  const hasDashTail = resolveDashTailBounds(dashFromIndex, data.length);
  const { pathLength, pathD } = usePathStrokeMetrics(
    pathRef,
    [renderData, innerWidth, dashFromIndex, showLine, showSeriesContent, showLoadingPulse],

    hasDashTail || showLoadingPulse || chartPhase !== 'ready'
  );

  const uniqueId = useId();
  const gradientId = `area-gradient-${dataKey}-${uniqueId}`;
  const strokeGradientId = `area-stroke-gradient-${dataKey}-${uniqueId}`;
  const edgeMaskId = `area-edge-mask-${dataKey}-${uniqueId}`;
  const edgeGradientId = `${edgeMaskId}-gradient`;

  const isPatternFill = fill.startsWith('url(');
  const showAreaFill = isPatternFill || fillOpacity > 0;
  const areaFill = isPatternFill ? fill : `url(#${gradientId})`;

  const resolvedStroke = stroke || (isPatternFill ? chartCssVars.linePrimary : fill);

  const getY = useCallback(
    (d: Record<string, unknown>) => {
      const value = d[dataKey];
      return typeof value === 'number' ? (yScale(value) ?? 0) : 0;
    },
    [dataKey, yScale]
  );

  const fadeSides = resolveFadeSides(fadeEdges);
  const useViewportEdgeFade = fadeSides.any && !isPatternFill;
  let strokePaint = resolvedStroke;
  if (!useViewportEdgeFade && fadeSides.any) {
    strokePaint = `url(#${strokeGradientId})`;
  }
  const highlightEnabled = showHighlight && showLine && !showLoadingPulse && showSeriesContent;
  const showSeriesStroke = showSeriesContent && showLine;
  let visibleStroke = 'transparent';
  if (showSeriesStroke && !hasDashTail) {
    visibleStroke = strokePaint;
  }
  const shouldMeasurePath = showLine && (showSeriesContent || showLoadingPulse);
  const showFill = showSeriesContent && showAreaFill;

  const getX = useCallback((d: Record<string, unknown>) => xScale(xAccessor(d)) ?? 0, [xAccessor, xScale]);
  const areaPathD = useMemo(
    () => (showFill ? areaClosedD(renderData, { curve, x: getX, y: getY, yScale }) : ''),
    [curve, getX, getY, renderData, showFill, yScale]
  );
  const strokePathD = useMemo(
    () => (shouldMeasurePath ? linePathD(renderData, { curve, x: getX, y: getY }) : ''),
    [curve, getX, getY, renderData, shouldMeasurePath]
  );

  const seriesLayers = (
    <>
      {showFill ? <path d={areaPathD} fill={areaFill} /> : null}

      {shouldMeasurePath ? (
        <>
          <LinePath
            d={strokePathD}
            innerRef={pathRef}
            stroke={visibleStroke}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          {showSeriesStroke && hasDashTail ? (
            <SeriesDashTailOverlay
              dashArray={dashArray}
              dashFromIndex={dashFromIndex}
              data={data}
              innerHeight={innerHeight}
              innerWidth={innerWidth}
              pathD={pathD}
              pathLength={pathLength}
              stroke={strokePaint}
              strokeWidth={strokeWidth}
              xAccessor={xAccessor}
              xScale={xScale}
            />
          ) : null}
        </>
      ) : null}
    </>
  );

  const sweepLoading = showLoadingPulse && innerWidth > 0 && loadingStyle === 'sweep';
  const pulseLoading = showLoadingPulse && innerWidth > 0 && !sweepLoading;

  return (
    <>
      <AreaGradientDefs
        edgeGradientId={edgeGradientId}
        edgeMaskId={edgeMaskId}
        fadeBottom={fadeBottom}
        fadeEdges={fadeEdges}
        fill={fill}
        fillOpacity={fillOpacity}
        gradientId={gradientId}
        gradientSpan={gradientSpan}
        gradientToOpacity={gradientToOpacity}
        innerHeight={innerHeight}
        innerWidth={innerWidth}
        isPatternFill={isPatternFill}
        resolvedStroke={resolvedStroke}
        strokeGradientId={strokeGradientId}
      />

      <SeriesHoverDim dimOpacity={0.6} enabled={showHighlight} seriesIndex={seriesIndex}>
        {useViewportEdgeFade ? <g mask={`url(#${edgeMaskId})`}>{seriesLayers}</g> : seriesLayers}
      </SeriesHoverDim>

      <SeriesHighlightLayer
        enabled={highlightEnabled}
        height={innerHeight}
        pathRef={pathRef}
        stroke={resolvedStroke}
        strokeWidth={strokeWidth}
      />

      {showMarkers && showSeriesContent ? (
        <SeriesMarkers
          animate={animate}
          dataKey={dataKey}
          {...markers}
          fill={markers?.fill ?? resolvedStroke}
          stroke={markers?.stroke ?? markers?.fill ?? resolvedStroke}
        />
      ) : null}

      {sweepLoading ? (
        <LineLoadingSweep
          curve={curve}
          key="loading-sweep"
          mode={pulseMode ?? 'loop'}
          onTransitionComplete={handleLoadingPulseComplete}
          stroke={loadingStroke}
          strokeOpacity={loadingStrokeOpacity}
          strokeWidth={strokeWidth}
          withArea
        />
      ) : null}
      {pulseLoading && pathD ? (
        <LineLoadingPulseStroke
          key="loading-pulse"
          loopEpoch={pulseEpoch}
          mode={pulseMode ?? undefined}
          onCycleComplete={handleLoadingPulseComplete}
          pathD={pathD}
          stroke={loadingStroke}
          strokeOpacity={loadingStrokeOpacity}
          strokeWidth={strokeWidth}
        />
      ) : null}
    </>
  );
}

Area.displayName = 'Area';
