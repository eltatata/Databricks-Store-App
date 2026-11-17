interface AreaLabelBox {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function layoutAreaValueLabels(boxes: AreaLabelBox[], width: number, height: number) {
  const placed: (AreaLabelBox & { source: number })[] = [];
  const padding = 4;
  const gap = 6;
  const visible = boxes
    .map((box, source) => ({ ...box, source }))
    .filter(
      (box) =>
        [box.index, box.x, box.y, box.width, box.height].every(Number.isFinite) &&
        box.x >= 0 &&
        box.x <= width &&
        box.y >= 0 &&
        box.y <= height &&
        box.width > 0 &&
        box.height > 0 &&
        box.width + padding * 2 <= width &&
        box.height + padding * 2 <= height
    );
  const first = Math.min(...visible.map((box) => box.index));
  const last = Math.max(...visible.map((box) => box.index));
  const edge = (index: number) => (index === first || index === last ? 0 : 1);

  visible.sort((a, b) => edge(a.index) - edge(b.index) || a.x - b.x || a.y - b.y);
  for (const box of visible) {
    const x = Math.max(padding + box.width / 2, Math.min(width - padding - box.width / 2, box.x));
    const offset = box.height / 2 + gap;
    for (const y of [box.y - offset, box.y + offset]) {
      if (y - box.height / 2 < padding || y + box.height / 2 > height - padding) {
        continue;
      }
      const collision = placed.some(
        (other) =>
          Math.abs(x - other.x) < (box.width + other.width) / 2 + gap &&
          Math.abs(y - other.y) < (box.height + other.height) / 2 + gap
      );
      if (collision) {
        continue;
      }
      placed.push({ ...box, x, y });
      break;
    }
  }
  return placed;
}

export function resolveAreaValueLabelCount(length: number, width: number, min = 2, max?: number) {
  const minimum = Number.isFinite(min) ? Math.max(0, Math.floor(min)) : 2;
  const maximum = max != null && Number.isFinite(max) ? Math.max(0, Math.floor(max)) : length;
  return Math.min(length, maximum, Math.max(minimum, Math.floor(Math.max(0, width) / 48)));
}

export function resolveSharedAreaValueLabelCount(counts: number[]) {
  const enabledCounts = counts.filter((count) => count > 0);
  return enabledCounts.length ? Math.min(...enabledCounts) : 0;
}

export function evenlySpacedLabelIndices(length: number, count: number) {
  const visibleCount = Math.min(Math.max(0, Math.floor(count)), length);
  if (visibleCount === 0) {
    return [];
  }
  if (visibleCount === 1) {
    return [0];
  }
  const lastIndex = length - 1;
  return Array.from({ length: visibleCount }, (_, index) => Math.round((index * lastIndex) / (visibleCount - 1)));
}
