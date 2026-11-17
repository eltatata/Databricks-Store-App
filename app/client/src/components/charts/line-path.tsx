import { area, type CurveFactory, line } from 'd3-shape';
import type { Ref, SVGProps } from 'react';
import { fastShapePath } from './fast-path';

type PathAccessor<Datum> = (datum: Datum, index: number, data: Datum[]) => number;

interface LinePathConfig<Datum> {
  x?: PathAccessor<Datum>;
  y?: PathAccessor<Datum>;
  defined?: (datum: Datum, index: number, data: Datum[]) => boolean;
  curve?: CurveFactory;
}

interface AreaClosedConfig<Datum> extends LinePathConfig<Datum> {
  y0?: number | PathAccessor<Datum>;

  yScale?: { range(): number[] };
}

export function linePathD<Datum>(data: Datum[], { x, y, defined, curve }: LinePathConfig<Datum>): string {
  const path = line<Datum>();
  if (x) {
    path.x(x);
  }
  if (y) {
    path.y(y);
  }
  if (defined) {
    path.defined(defined);
  }
  if (curve) {
    path.curve(curve);
  }
  return fastShapePath(path, data);
}

export function areaClosedD<Datum>(
  data: Datum[],
  { x, y, y0, yScale, defined, curve }: AreaClosedConfig<Datum>
): string {
  const path = area<Datum>();
  if (x) {
    path.x(x);
  }
  if (defined) {
    path.defined(defined);
  }
  if (curve) {
    path.curve(curve);
  }
  if (y0 == null) {
    const baseline = yScale?.range()[0];
    if (baseline !== undefined) {
      path.y0(baseline);
    }
  } else if (typeof y0 === 'number') {
    path.y0(y0);
  } else {
    path.y0(y0);
  }
  if (y) {
    path.y1(y);
  }
  return fastShapePath(path, data);
}

type LinePathProps = Omit<SVGProps<SVGPathElement>, 'd' | 'ref'> & {
  d: string;

  innerRef?: Ref<SVGPathElement>;
};

export function LinePath({ d, fill = 'transparent', innerRef, ...rest }: LinePathProps) {
  return <path d={d} fill={fill} ref={innerRef} strokeLinecap="round" {...rest} />;
}
