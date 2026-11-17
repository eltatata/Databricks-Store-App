'use client';

import { type MotionValue, m } from 'motion/react';
import { type RefObject, useId, useLayoutEffect, useRef } from 'react';

export interface HighlightSegmentGlow {
  filter: string;
  opacity: number;
  strokeWidth: number;
}

interface HighlightSegmentProps {
  pathRef: RefObject<SVGPathElement | null>;

  visible: boolean;
  stroke: string;
  strokeWidth: number;

  height: number;

  x: MotionValue<number>;

  width: MotionValue<number>;

  fadeLength?: number;

  glow?: HighlightSegmentGlow;
}

export function HighlightSegment({
  pathRef,
  visible,
  stroke,
  strokeWidth,
  height,
  x,
  width,
  fadeLength = 0,
  glow,
}: HighlightSegmentProps) {
  const bandId = useId();
  const fadeId = `${bandId}-fade`;
  const highlightRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);

  const appliedRef = useRef<{
    d: string;
    highlight: SVGPathElement | null;
    glow: SVGPathElement | null;
  } | null>(null);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }
    const d = pathRef.current?.getAttribute('d') || '';
    const highlight = highlightRef.current;
    const glowPath = glowRef.current;
    const applied = appliedRef.current;
    if (applied && applied.d === d && applied.highlight === highlight && applied.glow === glowPath) {
      return;
    }
    highlight?.setAttribute('d', d);
    glowPath?.setAttribute('d', d);
    appliedRef.current = { d, highlight, glow: glowPath };
  });

  if (!visible) {
    return null;
  }

  const fade = Math.min(50, Math.max(0, fadeLength));
  const soft = fade > 0;

  const bleed = Math.max(strokeWidth, glow ? glow.strokeWidth * 2 : 0);
  const band = (
    <m.rect fill={soft ? `url(#${fadeId})` : undefined} height={height + bleed * 2} width={width} x={x} y={-bleed} />
  );

  return (
    <>
      <defs>
        {soft ? (
          <>
            <linearGradient id={fadeId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="white" stopOpacity={0} />
              <stop offset={fade / 100} stopColor="white" stopOpacity={1} />
              <stop offset={1 - fade / 100} stopColor="white" stopOpacity={1} />
              <stop offset="1" stopColor="white" stopOpacity={0} />
            </linearGradient>
            <mask height="300%" id={bandId} maskUnits="userSpaceOnUse" width="300%" x="-100%" y="-100%">
              {band}
            </mask>
          </>
        ) : (
          <clipPath id={bandId}>{band}</clipPath>
        )}
      </defs>
      <m.g
        animate={{ opacity: 1 }}
        clipPath={soft ? undefined : `url(#${bandId})`}
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        mask={soft ? `url(#${bandId})` : undefined}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {glow ? (
          <path
            fill="none"
            filter={glow.filter}
            ref={glowRef}
            stroke={stroke}
            strokeLinecap="round"
            strokeOpacity={glow.opacity}
            strokeWidth={glow.strokeWidth}
          />
        ) : null}
        <path fill="none" ref={highlightRef} stroke={stroke} strokeLinecap="round" strokeWidth={strokeWidth} />
      </m.g>
    </>
  );
}

HighlightSegment.displayName = 'HighlightSegment';
