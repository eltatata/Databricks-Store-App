export function xAxisLabelOpacity(
  label: string,
  x: number,
  crosshairX: number | null,
  hoveredLabel: string | null,
  tickerHalfWidth: number
): number {
  if (crosshairX === null) {
    return 1;
  }
  const fadeBuffer = 20;
  const fadeRadius = tickerHalfWidth + fadeBuffer;
  const distance = Math.abs(x - crosshairX);
  if (distance < tickerHalfWidth) {
    return 0;
  }
  if (hoveredLabel && label === hoveredLabel) {
    return 0;
  }
  if (distance < fadeRadius) {
    return (distance - tickerHalfWidth) / fadeBuffer;
  }
  return 1;
}

export function xAxisLabelHighlight(
  label: string,
  x: number,
  crosshairX: number | null,
  hoveredLabel: string | null,
  radius: number
): { active: boolean; strength: number } {
  if (crosshairX === null) {
    return { active: false, strength: 0 };
  }
  if (hoveredLabel && label === hoveredLabel) {
    return { active: true, strength: 1 };
  }
  if (radius <= 0) {
    return { active: false, strength: 0 };
  }
  const distance = Math.abs(x - crosshairX);
  const strength = Math.max(0, 1 - distance / radius);
  return { active: false, strength: Math.round(strength * 100) / 100 };
}

export function xAxisLabelColor(
  { active, strength }: ReturnType<typeof xAxisLabelHighlight>,
  activeColor: string,
  nearbyColor: string
): string | undefined {
  if (active) {
    return activeColor;
  }
  if (strength <= 0) {
    return undefined;
  }
  return `color-mix(in oklab, ${nearbyColor} ${Math.round(strength * 100)}%, var(--chart-label))`;
}
