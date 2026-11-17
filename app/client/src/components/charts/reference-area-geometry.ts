export function resolveReferenceDataRange(
  y1: number | undefined,
  y2: number | undefined,
  domain: [number, number]
): [number, number] {
  const dMin = Math.min(domain[0], domain[1]);
  const dMax = Math.max(domain[0], domain[1]);
  const low = y1 ?? dMin;
  const high = y2 ?? dMax;
  return [Math.min(low, high), Math.max(low, high)];
}
