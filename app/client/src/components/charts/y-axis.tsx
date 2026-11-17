'use client';

import { AnimatePresence, m, useReducedMotion, type Variants } from 'motion/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChartPortalContainer, useChartStable, useSettledYScale, useYScale } from './chart-context';
import { crosshairTickOpacity, subscribeCrosshair } from './crosshair-store';
import { resolveReferenceDataRange } from './reference-area-geometry';
import type { YAxisOrientation } from './y-axis-scales';
import { normalizeYAxisId } from './y-axis-scales';
import { resolveYAxisTickCount, Y_AXIS_DEFAULT_TICK_COUNT } from './y-axis-ticks';

const CROSSHAIR_PILL_HALF_HEIGHT = 16;

const Y_AXIS_LABEL_SHIFT_PX = 8;
const Y_AXIS_LABEL_EASE_OUT = [0.23, 1, 0.32, 1] as const;
const Y_AXIS_LABEL_ENTER_S = 0.4;
const Y_AXIS_LABEL_EXIT_S = 0.25;
const Y_AXIS_LABEL_CLIP_BLEED_PX = 12;

const Y_AXIS_LABEL_STAGGER_S = 0.05;

type LabelDrift = -1 | 1;

interface LabelMotion {
  drift: LabelDrift;
  reducedMotion: boolean;
}

const labelVariants: Variants = {
  hidden: ({ drift }: LabelMotion) => ({
    opacity: 0,
    y: -drift * Y_AXIS_LABEL_SHIFT_PX,
  }),
  visible: { opacity: 1, y: 0 },
  exit: ({ drift, reducedMotion }: LabelMotion) => ({
    opacity: 0,
    y: drift * Y_AXIS_LABEL_SHIFT_PX,
    transition: {
      duration: reducedMotion ? 0 : Y_AXIS_LABEL_EXIT_S,
      ease: Y_AXIS_LABEL_EASE_OUT,
    },
  }),
};

interface YAxisProps {
  yAxisId?: string | number;

  orientation?: YAxisOrientation;

  numTicks?: number;

  formatLargeNumbers?: boolean;

  formatValue?: (value: number) => string;
}

function formatLabel(value: number, formatLargeNumbers: boolean, formatValue?: (value: number) => string): string {
  if (formatValue) {
    return formatValue(value);
  }
  if (formatLargeNumbers && value >= 1000) {
    return `${Number((value / 1000).toFixed(1))}k`;
  }
  return String(value);
}

function resolveTickLabelColor(
  tickY: number,
  axisId: string,
  yScale: ReturnType<typeof useYScale>,
  referenceAreas: ReturnType<typeof useChartStable>['referenceAreas']
): string | undefined {
  for (const area of referenceAreas) {
    if (!area.axisLabelColor) {
      continue;
    }
    if (normalizeYAxisId(area.yAxisId) !== axisId) {
      continue;
    }
    const [low, high] = resolveReferenceDataRange(area.y1, area.y2, yScale.domain() as [number, number]);
    const topPixel = yScale(high) ?? 0;
    const bottomPixel = yScale(low) ?? 0;
    const bandTop = Math.min(topPixel, bottomPixel);
    const bandBottom = Math.max(topPixel, bottomPixel);
    if (tickY >= bandTop && tickY <= bandBottom) {
      return area.axisLabelColor;
    }
  }
  return undefined;
}

export function YAxis(props: YAxisProps) {
  const { containerRef } = useChartStable();

  const container = useChartPortalContainer(containerRef);
  if (!container) {
    return null;
  }

  return <YAxisInner {...props} container={container} />;
}

const YAxisInner = memo(function YAxisInner({
  yAxisId,
  orientation = 'left',
  numTicks = Y_AXIS_DEFAULT_TICK_COUNT,
  formatLargeNumbers = true,
  formatValue,
  container,
}: YAxisProps & { container: HTMLDivElement }) {
  const { margin, referenceAreas } = useChartStable();
  const yScale = useYScale(yAxisId);

  const settledYScale = useSettledYScale(yAxisId);
  const reducedMotion = useReducedMotion() ?? false;
  const isLeft = orientation === 'left';
  const axisId = normalizeYAxisId(yAxisId);

  const [settledMin, settledMax] = settledYScale.domain() as [number, number];
  const settledSpan = settledMax - settledMin;
  const [prevSettledSpan, setPrevSettledSpan] = useState(settledSpan);
  const [drift, setDrift] = useState<LabelDrift>(-1);
  if (settledSpan !== prevSettledSpan) {
    setPrevSettledSpan(settledSpan);
    setDrift(settledSpan < prevSettledSpan ? -1 : 1);
  }

  const tickValues = useMemo(() => settledYScale.ticks(resolveYAxisTickCount(numTicks)), [settledYScale, numTicks]);

  const ticks = useMemo(() => {
    return tickValues.map((value) => {
      const y = (yScale(value) ?? 0) + margin.top;
      return {
        value,
        y,
        label: formatLabel(value, formatLargeNumbers, formatValue),
        labelColor: resolveTickLabelColor(y - margin.top, axisId, yScale, referenceAreas),
      };
    });
  }, [tickValues, yScale, margin.top, formatLargeNumbers, formatValue, axisId, referenceAreas]);

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute overflow-hidden"
        style={{
          top: -Y_AXIS_LABEL_CLIP_BLEED_PX,
          bottom: -Y_AXIS_LABEL_CLIP_BLEED_PX,
          ...(isLeft ? { left: 0, width: margin.left } : { right: 0, width: margin.right }),
        }}
      >
        <AnimatePresence custom={{ drift, reducedMotion } satisfies LabelMotion} initial={false}>
          {ticks.map((tick, index) => {
            const cascadeIndex = drift < 0 ? index : ticks.length - 1 - index;
            return (
              <m.div
                animate="visible"
                className="absolute flex h-0 items-center"
                custom={{ drift, reducedMotion } satisfies LabelMotion}
                exit="exit"
                initial="hidden"
                key={tick.value}
                style={{
                  top: tick.y + Y_AXIS_LABEL_CLIP_BLEED_PX,
                  ...(isLeft
                    ? { right: 0, justifyContent: 'flex-end', paddingRight: 8 }
                    : {
                        left: 0,
                        justifyContent: 'flex-start',
                        paddingLeft: 8,
                      }),
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        delay: cascadeIndex * Y_AXIS_LABEL_STAGGER_S,
                        duration: Y_AXIS_LABEL_ENTER_S,
                        ease: Y_AXIS_LABEL_EASE_OUT,
                      }
                }
                variants={labelVariants}
              >
                <YAxisTickLabel
                  axisId={axisId}
                  color={tick.labelColor}
                  container={container}
                  label={tick.label}
                  plotY={tick.y - margin.top}
                />
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>,
    container
  );
});

YAxis.displayName = 'YAxis';

function YAxisTickLabel({
  label,
  color,
  container,
  axisId,
  plotY,
}: {
  label: string;
  color?: string;
  container: HTMLDivElement;
  axisId: string;
  plotY: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let current = 1;
    return subscribeCrosshair(container, (state) => {
      const next = crosshairTickOpacity(state, axisId, plotY, CROSSHAIR_PILL_HALF_HEIGHT);
      if (next !== current && ref.current) {
        current = next;
        ref.current.style.opacity = String(next);
      }
    });
  }, [container, axisId, plotY]);
  return (
    <span
      className="whitespace-nowrap text-chart-label text-xs"
      ref={ref}
      style={{ color, transition: 'opacity 0.4s ease-in-out' }}
    >
      {label}
    </span>
  );
}
