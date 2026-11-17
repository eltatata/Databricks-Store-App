'use client';

import { m, useReducedMotion, useSpring } from 'motion/react';
import { type CSSProperties, memo, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { resolveTooltipBoxMotion, type SpringConfig, useChartConfig } from '../chart-config-context';
import {
  chartCssVars,
  DISCRETE_INTERACTION_LABEL_THRESHOLD,
  type LineConfig,
  type Margin,
  type TooltipData,
  useChart,
  useChartPortalContainer,
  useChartStable,
} from '../chart-context';
import { formatBandRange, weekdayDateFmt } from '../chart-formatters';
import { registerDatePill } from '../date-pill-store';
import type { IndicatorFadeEdges } from '../indicator-fade';
import { DateTicker, type DateTickerAnimation, type DateTickerVariant } from './date-ticker';
import { TooltipBox, type TooltipBoxProps } from './tooltip-box';
import { TooltipContent, type TooltipRow } from './tooltip-content';
import { TooltipDot } from './tooltip-dot';
import { TooltipIndicator } from './tooltip-indicator';
import { type DatePillVelocityConfig, resolveDatePillVelocity, useVelocityStretch } from './use-velocity-stretch';

interface ChartTooltipDatePillRenderProps {
  label: string;

  index: number;

  point: Record<string, unknown>;
}

interface ChartTooltipProps {
  showDatePill?: boolean;

  datePillAnimation?: DateTickerAnimation;

  datePillVariant?: DateTickerVariant;

  datePillVelocity?: boolean | DatePillVelocityConfig;

  datePillClassName?: string;

  datePillStyle?: CSSProperties;

  datePill?: (props: ChartTooltipDatePillRenderProps) => React.ReactNode;

  showCrosshair?: boolean;

  showDots?: boolean;

  dotVariant?: 'dot' | 'ring';

  dotSize?: number;

  dotHaloScale?: number;

  dotHaloOpacity?: number;

  dotHaloBlur?: number;

  dotRadiusFraction?: number;

  dotScale?: number;

  dotStrokeWidth?: number;

  indicatorColor?: string | ((point: Record<string, unknown>) => string);

  indicatorEndColor?: string;

  indicatorEnd?: 'plot' | 'point';

  content?: (props: { point: Record<string, unknown>; index: number }) => React.ReactNode;

  rows?: (point: Record<string, unknown>) => TooltipRow[];

  dotColor?: string | ((point: Record<string, unknown>, line: LineConfig) => string);

  children?: React.ReactNode;

  className?: string;

  dateLabels?: string[];

  springConfig?: SpringConfig;

  matchCrosshair?: boolean;

  damping?: number;

  indicatorDasharray?: string;

  indicatorFadeEdges?: IndicatorFadeEdges;

  indicatorFadeLength?: number;

  boxSpringConfig?: SpringConfig;

  panelStyle?: React.CSSProperties;

  backgroundColor?: string;

  exit?: boolean;

  animateSize?: boolean;

  topOffset?: number;
}

interface ChartTooltipInnerProps extends ChartTooltipProps {
  container: HTMLElement;
}

function resolveActivePoint(
  tooltipData: TooltipData | null,
  lines: LineConfig[]
): { line: LineConfig; index: number; x: number; y: number } | null {
  if (!tooltipData) {
    return null;
  }
  const { activeDataKey, xPositions, yPositions } = tooltipData;
  const hasY = (line: LineConfig) => yPositions[line.dataKey] !== undefined;
  const line = lines.find((l) => l.dataKey === activeDataKey && hasY(l)) ?? lines.find(hasY);
  const y = line ? yPositions[line.dataKey] : undefined;
  if (!line || y === undefined) {
    return null;
  }
  return {
    line,
    index: lines.indexOf(line),
    x: xPositions?.[line.dataKey] ?? tooltipData.x,
    y,
  };
}

function resolveTopmostPointY(tooltipData: TooltipData | null, lines: LineConfig[]): number | undefined {
  if (!tooltipData) {
    return undefined;
  }
  let topmost: number | undefined;
  for (const line of lines) {
    const y = tooltipData.yPositions[line.dataKey];
    if (y !== undefined && (topmost === undefined || y < topmost)) {
      topmost = y;
    }
  }
  return topmost;
}

function resolveBoxPlacement({
  activePoint,
  tooltipData,
  lines,
  margin,
  isHorizontal,
  xWithMargin,
  topOffset,
}: {
  activePoint: ReturnType<typeof resolveActivePoint>;
  tooltipData: TooltipData | null;
  lines: LineConfig[];
  margin: Margin;
  isHorizontal: boolean;
  xWithMargin: number;
  topOffset: number;
}): Pick<TooltipBoxProps, 'x' | 'y' | 'top' | 'flipX' | 'replayOnFlip'> {
  if (activePoint) {
    return {
      flipX: xWithMargin,
      replayOnFlip: false,
      x: activePoint.x + margin.left,
      y: activePoint.y + margin.top,
    };
  }
  if (isHorizontal) {
    const firstLineDataKey = lines[0]?.dataKey;
    const firstLineY = firstLineDataKey ? (tooltipData?.yPositions[firstLineDataKey] ?? 0) : 0;
    return { x: xWithMargin, y: firstLineY + margin.top };
  }
  const top = margin.top + topOffset;
  return { top, x: xWithMargin, y: top };
}

const ChartTooltipInner = memo(function ChartTooltipInner({
  showDatePill = true,
  datePillAnimation,
  datePillVariant,
  datePillVelocity,
  datePillClassName,
  datePillStyle,
  datePill,
  showCrosshair: showCrosshairProp,
  showDots = true,
  dotVariant = 'dot',
  dotSize = 5,
  dotHaloScale,
  dotHaloOpacity,
  dotHaloBlur,
  dotRadiusFraction,
  dotScale = 1,
  dotStrokeWidth,
  indicatorColor: indicatorColorProp,
  indicatorEndColor,
  indicatorEnd = 'plot',
  content,
  rows: rowsRenderer,
  dotColor: dotColorProp,
  children,
  className = '',
  container,
  springConfig,
  matchCrosshair = false,
  damping,
  indicatorDasharray,
  indicatorFadeEdges,
  indicatorFadeLength,
  boxSpringConfig,
  panelStyle,
  backgroundColor,
  dateLabels: dateLabelsProp,
  exit = true,
  animateSize = true,
  topOffset = 0,
}: ChartTooltipInnerProps) {
  const {
    tooltipData,
    width,
    height,
    innerHeight,
    margin,
    columnWidth,
    lines,
    bands,
    xAccessor,
    dateLabels: contextDateLabels,
    containerRef,
    orientation,
    barXAccessor,
    bandWidth,
    squareSnap,
    nearestPointHover,
  } = useChart();
  const tooltipBands = useMemo(() => (bands ?? []).filter((band) => band.showInTooltip), [bands]);
  const { tooltipSpring } = useChartConfig();
  const dateLabels = dateLabelsProp ?? contextDateLabels;

  const isHorizontal = orientation === 'horizontal';
  const datePillEnabled = showDatePill && !isHorizontal && dateLabels.length > 0;

  useEffect(() => {
    if (!datePillEnabled) {
      return;
    }
    return registerDatePill(container);
  }, [container, datePillEnabled]);

  const showCrosshair = showCrosshairProp ?? !(barXAccessor || nearestPointHover);
  const discreteInteraction = dateLabels.length > DISCRETE_INTERACTION_LABEL_THRESHOLD;

  const resolvedDotSize = useMemo(() => {
    if (dotVariant !== 'ring' || !bandWidth || lines.length === 0) {
      return dotSize * dotScale;
    }
    const seriesCount = lines.length;
    const gap = squareSnap?.groupGap ?? (seriesCount > 1 ? 4 : 0);
    const squareSize = (bandWidth - gap * (seriesCount - 1)) / seriesCount;
    return (squareSize / 2) * dotScale;
  }, [bandWidth, dotScale, dotSize, dotVariant, lines.length, squareSnap?.groupGap]);
  const boxMotion = useMemo(() => {
    if (boxSpringConfig) {
      return {
        animate: !discreteInteraction,
        springConfig: boxSpringConfig,
      };
    }
    if (matchCrosshair) {
      return {
        animate: !discreteInteraction,
        springConfig: springConfig ?? tooltipSpring,
      };
    }
    return resolveTooltipBoxMotion(damping);
  }, [boxSpringConfig, damping, discreteInteraction, matchCrosshair, springConfig, tooltipSpring]);

  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const xWithMargin = x + margin.left;

  const activePoint = nearestPointHover ? resolveActivePoint(tooltipData, lines) : null;
  const boxPlacement = resolveBoxPlacement({
    activePoint,
    tooltipData,
    lines,
    margin,
    isHorizontal,
    xWithMargin,
    topOffset,
  });

  const tooltipRows = useMemo(() => {
    if (!tooltipData) {
      return [];
    }

    if (rowsRenderer) {
      return rowsRenderer(tooltipData.point);
    }

    const rowLines = nearestPointHover
      ? lines.filter((line) => typeof tooltipData.point[line.dataKey] === 'number')
      : lines;
    const rows: TooltipRow[] = rowLines.map((line) => ({
      color: line.stroke,
      label: line.dataKey,
      value: (tooltipData.point[line.dataKey] as number) ?? 0,
    }));
    for (const band of tooltipBands) {
      const value = formatBandRange(tooltipData.point, band.upperKey, band.lowerKey);
      if (value != null) {
        rows.push({ color: band.color, label: band.label, value });
      }
    }
    return rows;
  }, [tooltipData, lines, tooltipBands, rowsRenderer, nearestPointHover]);

  const bandDots = useMemo(() => {
    const lineKeys = new Set(lines.map((line) => line.dataKey));
    const seen = new Set<string>();
    const dots: { key: string; color: string }[] = [];
    for (const band of tooltipBands) {
      for (const key of [band.upperKey, band.lowerKey]) {
        if (lineKeys.has(key) || seen.has(key)) {
          continue;
        }
        seen.add(key);
        dots.push({ key, color: band.color });
      }
    }
    return dots;
  }, [lines, tooltipBands]);

  const resolveDotColor = useMemo(() => {
    return (line: LineConfig, index: number): string => {
      if (rowsRenderer && tooltipRows[index]?.color) {
        return tooltipRows[index].color;
      }
      if (dotColorProp != null) {
        if (typeof dotColorProp === 'function' && tooltipData) {
          return dotColorProp(tooltipData.point, line);
        }
        if (typeof dotColorProp === 'string') {
          return dotColorProp;
        }
      }
      return line.stroke;
    };
  }, [dotColorProp, rowsRenderer, tooltipData, tooltipRows]);

  const indicatorColor = useMemo(() => {
    if (indicatorColorProp == null) {
      return chartCssVars.crosshair;
    }
    if (typeof indicatorColorProp === 'function') {
      return tooltipData ? indicatorColorProp(tooltipData.point) : chartCssVars.crosshair;
    }
    return indicatorColorProp;
  }, [indicatorColorProp, tooltipData]);

  const indicatorBottom = indicatorEnd === 'point' ? resolveTopmostPointY(tooltipData, lines) : undefined;

  const title = useMemo(() => {
    if (!tooltipData) {
      return undefined;
    }

    if (barXAccessor) {
      return barXAccessor(tooltipData.point);
    }

    return weekdayDateFmt.format(xAccessor(tooltipData.point));
  }, [tooltipData, barXAccessor, xAccessor]);

  const tooltipContent = (
    <>
      {showCrosshair && visible && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible"
          height="100%"
          width="100%"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            <TooltipIndicator
              animate={!discreteInteraction}
              bottom={indicatorBottom}
              colorEdge={indicatorColor}
              colorEnd={indicatorEndColor}
              colorMid={indicatorColor}
              columnWidth={columnWidth}
              fadeEdges={indicatorDasharray ? 'none' : (indicatorFadeEdges ?? 'both')}
              fadeLength={indicatorFadeLength}
              height={innerHeight}
              springConfig={springConfig}
              strokeDasharray={indicatorDasharray}
              visible={visible}
              width="line"
              x={x}
            />
          </g>
        </svg>
      )}

      {showDots && visible && !isHorizontal && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible"
          height="100%"
          width="100%"
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {nearestPointHover
              ? activePoint && (
                  <TooltipDot
                    animate={!discreteInteraction}
                    color={resolveDotColor(activePoint.line, activePoint.index)}
                    cornerRadiusFraction={dotVariant === 'ring' ? dotRadiusFraction : undefined}
                    haloBlur={dotHaloBlur}
                    haloOpacity={dotHaloOpacity}
                    haloScale={dotHaloScale}
                    size={resolvedDotSize}
                    springConfig={springConfig}
                    strokeColor={chartCssVars.background}
                    strokeWidth={dotStrokeWidth}
                    variant={dotVariant}
                    visible={visible}
                    x={activePoint.x}
                    y={activePoint.y}
                  />
                )
              : lines.map((line, index) => (
                  <TooltipDot
                    animate={!discreteInteraction}
                    color={resolveDotColor(line, index)}
                    cornerRadiusFraction={dotVariant === 'ring' ? dotRadiusFraction : undefined}
                    haloBlur={dotHaloBlur}
                    haloOpacity={dotHaloOpacity}
                    haloScale={dotHaloScale}
                    key={line.dataKey}
                    size={resolvedDotSize}
                    springConfig={springConfig}
                    strokeColor={chartCssVars.background}
                    strokeWidth={dotStrokeWidth}
                    variant={dotVariant}
                    visible={visible}
                    x={tooltipData?.xPositions?.[line.dataKey] ?? x}
                    y={tooltipData?.yPositions[line.dataKey] ?? 0}
                  />
                ))}
            {bandDots.map((dot) => {
              const y = tooltipData?.yPositions[dot.key];
              if (y == null) {
                return null;
              }
              return (
                <TooltipDot
                  animate={!discreteInteraction}
                  color={typeof dotColorProp === 'string' ? dotColorProp : dot.color}
                  cornerRadiusFraction={dotVariant === 'ring' ? dotRadiusFraction : undefined}
                  haloBlur={dotHaloBlur}
                  haloOpacity={dotHaloOpacity}
                  haloScale={dotHaloScale}
                  key={`band-${dot.key}`}
                  size={resolvedDotSize}
                  springConfig={springConfig}
                  strokeColor={chartCssVars.background}
                  strokeWidth={dotStrokeWidth}
                  variant={dotVariant}
                  visible={visible}
                  x={x}
                  y={y}
                />
              );
            })}
          </g>
        </svg>
      )}

      <TooltipBox
        animate={boxMotion.animate}
        animateSize={animateSize}
        backgroundColor={backgroundColor}
        className={className}
        containerHeight={height}
        containerRef={containerRef}
        containerWidth={width}
        exit={exit}
        panelStyle={panelStyle}
        springConfig={boxMotion.springConfig}
        {...boxPlacement}
        visible={visible}
      >
        {content && tooltipData
          ? content({
              point: tooltipData.point,
              index: tooltipData.index,
            })
          : !content && (
              <TooltipContent rows={tooltipRows} title={title}>
                {children}
              </TooltipContent>
            )}
      </TooltipBox>

      <DatePillTracker
        animation={datePillAnimation}
        className={datePillClassName}
        currentIndex={tooltipData?.index ?? 0}
        discreteInteraction={discreteInteraction}
        enabled={datePillEnabled}
        labels={dateLabels}
        point={tooltipData?.point}
        render={datePill}
        springConfig={springConfig}
        style={datePillStyle}
        variant={datePillVariant}
        velocity={datePillVelocity}
        visible={visible}
        xWithMargin={xWithMargin}
      />
    </>
  );

  return createPortal(tooltipContent, container);
});

export function ChartTooltip(props: ChartTooltipProps) {
  const { containerRef } = useChartStable();

  const container = useChartPortalContainer(containerRef);
  if (!container) {
    return null;
  }

  return <ChartTooltipInner {...props} container={container} />;
}

ChartTooltip.displayName = 'ChartTooltip';

interface DatePillTrackerProps {
  enabled: boolean;
  visible: boolean;
  labels: string[];
  currentIndex: number;
  xWithMargin: number;
  discreteInteraction: boolean;
  springConfig?: SpringConfig;
  point?: Record<string, unknown>;
  animation?: DateTickerAnimation;
  className?: string;
  style?: CSSProperties;
  render?: ChartTooltipProps['datePill'];
  variant?: DateTickerVariant;
  velocity?: ChartTooltipProps['datePillVelocity'];
}

function DatePillTracker(props: DatePillTrackerProps) {
  if (!(props.enabled && props.visible && props.labels.length > 0)) {
    return null;
  }
  return <DatePillTrackerInner {...props} />;
}

function DatePillTrackerInner({
  labels,
  currentIndex,
  xWithMargin,
  discreteInteraction,
  springConfig,
  visible,
  point,
  animation,
  className,
  style,
  render,
  variant,
  velocity,
}: DatePillTrackerProps) {
  const { tooltipSpring } = useChartConfig();
  const reduceMotion = useReducedMotion() === true;
  const effectiveSpring = springConfig ?? tooltipSpring;
  const animatedX = useSpring(xWithMargin, effectiveSpring);
  const swell = useVelocityStretch(
    animatedX,
    reduceMotion || discreteInteraction ? null : resolveDatePillVelocity(velocity)
  );

  if (!discreteInteraction) {
    animatedX.set(xWithMargin);
  }

  useEffect(() => {
    animatedX.set(xWithMargin);
  }, [animatedX, visible]);

  return (
    <m.div
      className="pointer-events-none absolute z-50 w-max"
      style={{
        left: discreteInteraction ? xWithMargin : animatedX,
        transform: 'translateX(-50%)',
        bottom: 4,
      }}
    >
      <m.div style={{ scaleX: swell.scaleX, scaleY: swell.scaleY }}>
        {render && point ? (
          render({
            label: labels[currentIndex] ?? '',
            index: currentIndex,
            point,
          })
        ) : (
          <DateTicker
            animation={animation}
            className={className}
            currentIndex={currentIndex}
            labels={labels}
            style={style}
            variant={variant}
            visible={visible}
          />
        )}
      </m.div>
    </m.div>
  );
}
