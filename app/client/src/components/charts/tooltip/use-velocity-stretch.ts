'use client';

import { type MotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { useLayoutEffect, useRef } from 'react';

export interface DatePillVelocityConfig {
  scale?: number;

  stretch?: number;

  maxVelocity?: number;
}

const DEFAULTS: Required<DatePillVelocityConfig> = {
  scale: 0.06,
  stretch: 0.08,
  maxVelocity: 1600,
};

const SWELL_SPRING = { stiffness: 420, damping: 32, mass: 0.6 };

export function resolveDatePillVelocity(
  value: boolean | DatePillVelocityConfig | undefined
): Required<DatePillVelocityConfig> | null {
  if (!value) {
    return null;
  }
  return value === true ? DEFAULTS : { ...DEFAULTS, ...value };
}

function velocitySwell(velocity: number, maxVelocity: number): number {
  if (maxVelocity <= 0) {
    return 0;
  }
  const t = Math.min(Math.abs(velocity) / maxVelocity, 1);
  return t * (2 - t);
}

export function useVelocityStretch(
  x: MotionValue<number>,
  config: Required<DatePillVelocityConfig> | null
): { scaleX: MotionValue<number>; scaleY: MotionValue<number> } {
  const configRef = useRef(config);
  useLayoutEffect(() => {
    configRef.current = config;
  });
  const velocity = useVelocity(x);
  const swell = useTransform(velocity, (v) => {
    const c = configRef.current;
    return c ? velocitySwell(v, c.maxVelocity) : 0;
  });
  const smooth = useSpring(swell, SWELL_SPRING);
  const scaleX = useTransform(smooth, (a) => {
    const c = configRef.current;
    return c ? 1 + a * (c.scale + c.stretch) : 1;
  });
  const scaleY = useTransform(smooth, (a) => {
    const c = configRef.current;
    return c ? 1 + a * c.scale : 1;
  });
  return { scaleX, scaleY };
}
