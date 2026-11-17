'use client';

import {
  domAnimation,
  frameData,
  JSAnimation,
  LazyMotion,
  type MotionValue,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { type CSSProperties, memo, type ReactNode, type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DATE_TICKER_GLASS_CLASS, LiquidGlassFilter, useLiquidGlass } from './liquid-glass';

const TICKER_ITEM_HEIGHT = 24;
const TICKER_SPRING = { stiffness: 400, damping: 35 };

const COMPACT_TICKER_THRESHOLD = 60;

function driveSpring(value: MotionValue<number>, target: number, instant: boolean) {
  if (instant) {
    value.jump(target);
  } else {
    value.set(target);
  }
}

interface TickerSegment {
  value: string;
  key: string;
  startIndex: number;
}

function toSegments(values: readonly string[]): TickerSegment[] {
  const segments: TickerSegment[] = [];
  values.forEach((value, index) => {
    if (segments.at(-1)?.value !== value) {
      segments.push({ value, key: `${value}-${index}`, startIndex: index });
    }
  });
  return segments;
}

function segmentIndexAt(segments: readonly TickerSegment[], index: number, total: number) {
  if (index < 0 || index >= total) {
    return 0;
  }
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (segment && segment.startIndex <= index) {
      return i;
    }
  }
  return 0;
}

function useActiveItemWidth(
  stackRef: RefObject<HTMLElement | null>,
  items: readonly unknown[],
  activeIndex: number,
  width: MotionValue<number>,
  reduceMotion: boolean
) {
  const widthsRef = useRef<number[]>([]);
  const activeIndexRef = useRef(activeIndex);
  const fontsPendingRef = useRef(false);
  const mountedRef = useRef(true);

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  });

  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    const measure = (snap: boolean) => {
      const stack = stackRef.current;
      if (!(mountedRef.current && stack)) {
        return;
      }
      widthsRef.current = Array.from(
        stack.querySelectorAll<HTMLElement>('[data-ticker-item]'),
        (node) => node.getBoundingClientRect().width
      );
      const next = widthsRef.current[activeIndexRef.current];
      if (next === undefined) {
        return;
      }

      driveSpring(width, next, snap || reduceMotion);
    };

    measure(widthsRef.current.length === 0);

    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (fonts && fonts.status === 'loading' && !fontsPendingRef.current) {
      fontsPendingRef.current = true;
      fonts.ready.then(() => {
        fontsPendingRef.current = false;
        measure(false);
      });
    }
  }, [stackRef, items, width, reduceMotion]);

  useLayoutEffect(() => {
    const target = widthsRef.current[activeIndex];
    if (target !== undefined) {
      driveSpring(width, target, reduceMotion);
    }
  }, [activeIndex, width, reduceMotion]);
}

export type DateTickerAnimation = 'roll' | 'static';

const DATE_TICKER_PILL_CLASS =
  'overflow-hidden rounded-full bg-chart-tooltip-background px-4 py-1 text-chart-tooltip-foreground shadow-lg';

export type DateTickerVariant = 'solid' | 'glass';

interface DateTickerProps {
  currentIndex: number;
  labels: string[];
  visible: boolean;

  animation?: DateTickerAnimation;

  variant?: DateTickerVariant;

  className?: string;

  style?: CSSProperties;
}

type DateTickerVariantProps = Pick<DateTickerProps, 'currentIndex' | 'labels' | 'className' | 'style' | 'variant'>;

function SolidSurface({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={cn(DATE_TICKER_PILL_CLASS, className)} data-slot="date-pill" style={style}>
      {children}
    </div>
  );
}

function GlassSurface({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const glass = useLiquidGlass();
  return (
    <div
      className={cn(DATE_TICKER_GLASS_CLASS, className)}
      data-slot="date-pill"
      data-variant="glass"
      ref={surfaceRef}
      style={{ ...glass.style, ...style }}
    >
      {glass.svgFilter && <LiquidGlassFilter id={glass.filterId} surfaceRef={surfaceRef} />}
      {children}
    </div>
  );
}

function DateTickerSurface({
  variant = 'solid',
  ...props
}: {
  variant?: DateTickerVariant;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return variant === 'glass' ? <GlassSurface {...props} /> : <SolidSurface {...props} />;
}

const FRAME_MS = 1000 / 60;

function useLabelWidth(
  labelRef: RefObject<HTMLElement | null>,
  boxRef: RefObject<HTMLElement | null>,
  width: MotionValue<number>,
  reduceMotion: boolean
) {
  useLayoutEffect(() => {
    const labelEl = labelRef.current;
    if (!labelEl) {
      return;
    }
    let animation: JSAnimation<number> | null = null;
    const stop = () => {
      animation?.stop();
      animation = null;
    };
    const start = (target: number, startTime?: number) => {
      stop();
      animation = new JSAnimation({
        keyframes: [width.get(), target],
        velocity: width.getVelocity(),
        type: 'spring',
        restDelta: 0.001,
        restSpeed: 0.01,
        ...TICKER_SPRING,
        startTime,
        onUpdate: (latest) => width.set(latest),
      });
    };

    let measured = labelEl.getBoundingClientRect().width;
    stop();
    width.jump(measured);

    const follow = (next: number) => {
      if (reduceMotion) {
        stop();
        width.jump(next);
        if (boxRef.current) {
          boxRef.current.style.width = `${next}px`;
        }
        return;
      }

      const sinceFrame = performance.now() - frameData.timestamp;
      start(next, sinceFrame >= 0 && sinceFrame < FRAME_MS ? frameData.timestamp : undefined);
    };

    if (typeof ResizeObserver === 'undefined') {
      return stop;
    }
    const observer = new ResizeObserver(() => {
      const next = labelEl.getBoundingClientRect().width;
      if (next !== measured) {
        measured = next;
        follow(next);
      }
    });
    observer.observe(labelEl, { box: 'border-box' });
    return () => {
      observer.disconnect();
      stop();
    };
  }, [labelRef, boxRef, width, reduceMotion]);
}

const DateTickerCompact = memo(function DateTickerCompact({
  currentIndex,
  labels,
  className,
  style,
  variant,
}: DateTickerVariantProps) {
  const reduceMotion = useReducedMotion() === true;
  const label = labels[currentIndex] ?? labels[0] ?? '';
  const labelRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useMotionValue(0);
  useLabelWidth(labelRef, boxRef, width, reduceMotion);

  return (
    <DateTickerSurface className={className} style={style} variant={variant}>
      <m.div className="relative h-6" ref={boxRef} style={{ width }}>
        <m.div className="absolute top-0 left-1/2 flex h-6 items-center" style={{ x: '-50%' }}>
          <span className="whitespace-nowrap font-medium text-sm" data-ticker-item ref={labelRef}>
            {label}
          </span>
        </m.div>
      </m.div>
    </DateTickerSurface>
  );
});

const DateTickerInner = memo(function DateTickerInner({
  currentIndex,
  labels,
  className,
  style,
  variant,
}: DateTickerVariantProps) {
  const reduceMotion = useReducedMotion() === true;

  const parsedLabels = useMemo(() => {
    return labels.map((label) => {
      const parts = label.split(' ');
      return { month: parts[0] || '', day: parts[1] || '' };
    });
  }, [labels]);

  const monthSegments = useMemo(() => toSegments(parsedLabels.map((label) => label.month)), [parsedLabels]);
  const daySegments = useMemo(() => toSegments(parsedLabels.map((label) => label.day)), [parsedLabels]);

  const currentMonthIndex = segmentIndexAt(monthSegments, currentIndex, parsedLabels.length);
  const currentDayIndex = segmentIndexAt(daySegments, currentIndex, parsedLabels.length);

  const dayY = useSpring(0, TICKER_SPRING);
  const monthY = useSpring(0, TICKER_SPRING);

  const monthStackRef = useRef<HTMLDivElement>(null);
  const dayStackRef = useRef<HTMLDivElement>(null);
  const monthWidth = useSpring(0, TICKER_SPRING);
  const dayWidth = useSpring(0, TICKER_SPRING);
  useActiveItemWidth(monthStackRef, monthSegments, currentMonthIndex, monthWidth, reduceMotion);
  useActiveItemWidth(dayStackRef, daySegments, currentDayIndex, dayWidth, reduceMotion);

  useLayoutEffect(() => {
    driveSpring(dayY, -currentDayIndex * TICKER_ITEM_HEIGHT, reduceMotion);
  }, [currentDayIndex, dayY, reduceMotion]);

  useLayoutEffect(() => {
    driveSpring(monthY, -currentMonthIndex * TICKER_ITEM_HEIGHT, reduceMotion);
  }, [currentMonthIndex, monthY, reduceMotion]);

  return (
    <DateTickerSurface className={className} style={style} variant={variant}>
      <div className="relative h-6 overflow-hidden">
        <div className="flex items-center justify-center gap-1">
          <m.div className="relative h-6 overflow-hidden" style={{ width: monthWidth }}>
            <m.div
              className="absolute top-0 left-1/2 flex flex-col items-center"
              ref={monthStackRef}
              style={{ x: '-50%', y: monthY }}
            >
              {monthSegments.map((segment) => (
                <div className="flex h-6 shrink-0 items-center justify-center" data-ticker-item key={segment.key}>
                  <span className="whitespace-nowrap font-medium text-sm">{segment.value}</span>
                </div>
              ))}
            </m.div>
          </m.div>

          <m.div className="relative h-6 overflow-hidden" style={{ width: dayWidth }}>
            <m.div
              className="absolute top-0 left-1/2 flex flex-col items-center"
              ref={dayStackRef}
              style={{ x: '-50%', y: dayY }}
            >
              {daySegments.map((segment) => (
                <div className="flex h-6 shrink-0 items-center justify-center" data-ticker-item key={segment.key}>
                  <span className="whitespace-nowrap font-medium text-sm">{segment.value}</span>
                </div>
              ))}
            </m.div>
          </m.div>
        </div>
      </div>
    </DateTickerSurface>
  );
});

export function DateTicker({
  currentIndex,
  labels,
  visible,
  animation = 'roll',
  variant,
  className,
  style,
}: DateTickerProps) {
  if (!visible || labels.length === 0) {
    return null;
  }

  const Variant =
    animation === 'static' || labels.length > COMPACT_TICKER_THRESHOLD ? DateTickerCompact : DateTickerInner;

  return (
    <LazyMotion features={domAnimation}>
      <Variant className={className} currentIndex={currentIndex} labels={labels} style={style} variant={variant} />
    </LazyMotion>
  );
}

DateTicker.displayName = 'DateTicker';
