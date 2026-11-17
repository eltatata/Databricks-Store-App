export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function safeRatio(numerator: number, denominator: number, decimals: number): number | null {
  return denominator > 0 ? roundTo(numerator / denominator, decimals) : null;
}
