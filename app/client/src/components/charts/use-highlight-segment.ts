'use client';

import { useSpring } from 'motion/react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useChartConfig } from './chart-config-context';
import {
  type ChartHoverContextValue,
  DISCRETE_INTERACTION_LABEL_THRESHOLD,
  useChartHoverSelector,
  useChartHoverStore,
  useChartStable,
} from './chart-context';
import { computeSegmentBounds, INACTIVE_SEGMENT, type SegmentBounds } from './highlight-segment-bounds';

interface HighlightSegmentResult {
  xSpring: ReturnType<typeof useSpring>;
  widthSpring: ReturnType<typeof useSpring>;
  isActive: boolean;
}

export function useHighlightSegment({
  enabled = true,
  span = 1,
}: {
  enabled?: boolean;
  span?: number;
} = {}): HighlightSegmentResult {
  const { data, xScale, xAccessor, dateLabels } = useChartStable();
  const snap = dateLabels.length > DISCRETE_INTERACTION_LABEL_THRESHOLD;
  const store = useChartHoverStore();
  const { highlightSpring } = useChartConfig();

  const resolveBounds = useCallback(
    (hover: ChartHoverContextValue): SegmentBounds =>
      enabled
        ? computeSegmentBounds(data, xScale, xAccessor, hover.tooltipData, hover.selection, span)
        : INACTIVE_SEGMENT,
    [enabled, data, xScale, xAccessor, span]
  );

  const isActive = useChartHoverSelector((hover) => resolveBounds(hover).isActive);

  const xSpring = useSpring(0, highlightSpring);
  const widthSpring = useSpring(0, highlightSpring);

  const wasActive = useRef(false);

  useLayoutEffect(() => {
    if (!store) {
      return;
    }
    const drive = () => {
      const bounds = resolveBounds(store.getSnapshot());
      if (!bounds.isActive) {
        wasActive.current = false;
        return;
      }
      if (!wasActive.current || snap) {
        xSpring.jump(bounds.x);
        widthSpring.jump(bounds.width);
      }
      xSpring.set(bounds.x);
      widthSpring.set(bounds.width);
      wasActive.current = true;
    };
    drive();
    return store.subscribe(drive);
  }, [resolveBounds, snap, store, xSpring, widthSpring]);

  return { xSpring, widthSpring, isActive };
}
