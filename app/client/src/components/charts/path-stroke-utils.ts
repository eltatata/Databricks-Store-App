import { type RefObject, useEffect, useState } from 'react';

interface PathStrokeMetrics {
  pathD: string | null;
  pathLength: number;
}

const EMPTY_METRICS: PathStrokeMetrics = { pathD: null, pathLength: 0 };

export function usePathStrokeMetrics(
  pathRef: RefObject<SVGPathElement | null>,
  deps: readonly unknown[],

  enabled = true
): PathStrokeMetrics {
  const [metrics, setMetrics] = useState<PathStrokeMetrics>(EMPTY_METRICS);

  useEffect(() => {
    const path = pathRef.current;
    if (!(enabled && path)) {
      return;
    }
    const d = path.getAttribute('d');
    const len = d ? path.getTotalLength() : 0;
    setMetrics((prev) => (prev.pathD === d && prev.pathLength === len ? prev : { pathD: d, pathLength: len }));
  }, [enabled, ...deps]);

  return metrics;
}

export function resolveDashTailBounds(dashFromIndex: number | undefined, dataLength: number): boolean {
  return dashFromIndex != null && dashFromIndex >= 0 && dashFromIndex < dataLength - 1;
}

export function resolveDashStartX(
  data: Record<string, unknown>[],
  dashFromIndex: number,
  xScale: (value: Date | number) => number | undefined,
  xAccessor: (datum: Record<string, unknown>) => Date | number
): number {
  const dashFromPoint = data[dashFromIndex];
  if (!dashFromPoint) {
    return 0;
  }
  return xScale(xAccessor(dashFromPoint)) ?? 0;
}
