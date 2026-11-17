export type FadeEdges = boolean | 'left' | 'right' | { left?: number; right?: number };

interface FadeSides {
  left: boolean;

  right: boolean;

  any: boolean;

  leftLength: number;

  rightLength: number;
}

const DEFAULT_FADE_EDGES_LENGTH = 15;

function clampFadeEdgesLength(length: number): number {
  return Math.min(50, Math.max(0, length));
}

function fadeSides(leftLength: number, rightLength: number): FadeSides {
  const l = clampFadeEdgesLength(leftLength);
  const r = clampFadeEdgesLength(rightLength);
  return {
    left: l > 0,
    right: r > 0,
    any: l > 0 || r > 0,
    leftLength: l,
    rightLength: r,
  };
}

export function resolveFadeSides(fade: FadeEdges): FadeSides {
  const d = DEFAULT_FADE_EDGES_LENGTH;
  if (fade === false) {
    return fadeSides(0, 0);
  }
  if (fade === 'left') {
    return fadeSides(d, 0);
  }
  if (fade === 'right') {
    return fadeSides(0, d);
  }
  if (typeof fade === 'object' && fade !== null) {
    return fadeSides(fade.left ?? 0, fade.right ?? 0);
  }
  return fadeSides(d, d);
}

interface FadeGradientStop {
  offset: string;
  opacity: number;
}

export function fadeGradientStops(sides: FadeSides): FadeGradientStop[] {
  return dedupeStops([
    { offset: '0%', opacity: sides.left ? 0 : 1 },
    { offset: `${sides.left ? sides.leftLength : 0}%`, opacity: 1 },
    { offset: `${100 - (sides.right ? sides.rightLength : 0)}%`, opacity: 1 },
    { offset: '100%', opacity: sides.right ? 0 : 1 },
  ]);
}

function dedupeStops<T extends { offset: string | number; opacity: number }>(stops: T[]): T[] {
  return stops.filter(
    (stop, i) => i === 0 || stop.offset !== stops[i - 1]?.offset || stop.opacity !== stops[i - 1]?.opacity
  );
}

export function areaVerticalFadeStops({
  topOpacity,
  fadeBottom,
  gradientToOpacity,
  gradientSpan = 1,
}: {
  topOpacity: number;
  fadeBottom?: number;
  gradientToOpacity: number;
  gradientSpan?: number;
}): { offset: number; opacity: number }[] {
  if (fadeBottom !== undefined) {
    const zone = Math.min(100, Math.max(0, fadeBottom)) / 100;
    if (zone <= 0) {
      return [
        { offset: 0, opacity: topOpacity },
        { offset: 1, opacity: topOpacity },
      ];
    }
    return dedupeStops([
      { offset: 0, opacity: topOpacity },
      { offset: 1 - zone, opacity: topOpacity },
      { offset: 1, opacity: 0 },
    ]);
  }
  const span = Math.min(1, Math.max(0.01, gradientSpan));
  const stops = [
    { offset: 0, opacity: topOpacity },
    { offset: span, opacity: gradientToOpacity },
  ];
  if (span < 1) {
    stops.push({ offset: 1, opacity: gradientToOpacity });
  }
  return stops;
}

export function viewportFadeGradientAttrs(innerWidth: number) {
  return {
    gradientUnits: 'userSpaceOnUse' as const,
    x1: 0,
    x2: innerWidth,
    y1: 0,
    y2: 0,
  };
}
