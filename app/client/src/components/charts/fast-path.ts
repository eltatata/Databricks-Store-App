import type { Area, Line } from 'd3-shape';

function formatCoordinate(value: number): string {
  const scaled = Math.round(value * 1000);
  if (!(scaled > -1e12 && scaled < 1e12)) {
    return String(scaled / 1000);
  }
  if (scaled === 0) {
    return '0';
  }
  const negative = scaled < 0;
  const abs = negative ? -scaled : scaled;
  const whole = Math.floor(abs / 1000);
  const fraction = abs - whole * 1000;
  const head = negative ? `-${whole}` : `${whole}`;
  if (fraction === 0) {
    return head;
  }
  if (fraction % 100 === 0) {
    return `${head}.${fraction / 100}`;
  }
  if (fraction % 10 === 0) {
    return `${head}.${fraction < 100 ? '0' : ''}${fraction / 10}`;
  }
  let pad = '';
  if (fraction < 10) {
    pad = '00';
  } else if (fraction < 100) {
    pad = '0';
  }
  return `${head}.${pad}${fraction}`;
}

class FastPath {
  d = '';
  unsupported = false;
  private open = false;

  moveTo(x: number, y: number) {
    this.d += `M${formatCoordinate(+x)},${formatCoordinate(+y)}`;
    this.open = true;
  }

  lineTo(x: number, y: number) {
    this.d += `L${formatCoordinate(+x)},${formatCoordinate(+y)}`;
    this.open = true;
  }

  closePath() {
    if (this.open) {
      this.d += 'Z';
    }
  }

  quadraticCurveTo(x1: number, y1: number, x: number, y: number) {
    this.d += `Q${formatCoordinate(+x1)},${formatCoordinate(+y1)},${formatCoordinate(+x)},${formatCoordinate(+y)}`;
    this.open = true;
  }

  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.d += `C${formatCoordinate(+x1)},${formatCoordinate(+y1)},${formatCoordinate(+x2)},${formatCoordinate(+y2)},${formatCoordinate(+x)},${formatCoordinate(+y)}`;
    this.open = true;
  }

  arcTo() {
    this.unsupported = true;
  }

  arc() {
    this.unsupported = true;
  }

  rect() {
    this.unsupported = true;
  }
}

type Generator<Datum> = Line<Datum> | Area<Datum>;

const asShapeContext = (recorder: object): CanvasRenderingContext2D => recorder as CanvasRenderingContext2D;

export function fastShapePath<Datum>(generator: Generator<Datum>, data: Datum[]): string {
  const context = new FastPath();
  generator.context(asShapeContext(context));
  (generator as (data: Datum[]) => unknown)(data);
  generator.context(null);
  if (context.unsupported) {
    return ((generator as (data: Datum[]) => string | null)(data) ?? '') || '';
  }
  return context.d;
}
