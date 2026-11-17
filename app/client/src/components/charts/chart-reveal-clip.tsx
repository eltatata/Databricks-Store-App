'use client';

import type { Transition } from 'motion/react';
import { m } from 'motion/react';
import { clipRevealTransition } from './animation';

type ChartRevealClipMode = 'reveal' | 'conceal';

interface ChartRevealClipProps {
  clipPathId: string;
  height: number;
  targetWidth: number;
  enterTransition?: Transition;

  revealEpoch: number;

  padding?: number;

  paddingY?: number;

  animating?: boolean;

  mode?: ChartRevealClipMode;

  onComplete?: () => void;
}

export function ChartRevealClip({
  clipPathId,
  height,
  targetWidth,
  enterTransition,
  revealEpoch,
  padding = 0,
  paddingY = padding,
  animating = true,
  mode = 'reveal',
  onComplete,
}: ChartRevealClipProps) {
  const transition = clipRevealTransition(enterTransition);
  const paddedWidth = Math.max(0, targetWidth + padding * 2);
  const paddedHeight = height + paddingY * 2;

  if (!animating) {
    return (
      <clipPath id={clipPathId}>
        <rect height={paddedHeight} width={paddedWidth} x={-padding} y={-paddingY} />
      </clipPath>
    );
  }

  if (mode === 'conceal') {
    const rightEdge = -padding + paddedWidth;

    return (
      <clipPath id={clipPathId}>
        <m.rect
          animate={{ width: 0, x: rightEdge }}
          height={paddedHeight}
          initial={{ width: paddedWidth, x: -padding }}
          key={`conceal-${revealEpoch}`}
          onAnimationComplete={() => onComplete?.()}
          transition={transition}
          y={-paddingY}
        />
      </clipPath>
    );
  }

  return (
    <clipPath id={clipPathId}>
      <m.rect
        animate={{ width: paddedWidth }}
        height={paddedHeight}
        initial={{ width: 0 }}
        key={`reveal-${revealEpoch}`}
        transition={transition}
        width={paddedWidth}
        x={-padding}
        y={-paddingY}
      />
    </clipPath>
  );
}
