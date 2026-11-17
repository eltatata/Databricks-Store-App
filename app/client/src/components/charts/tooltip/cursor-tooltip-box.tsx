'use client';

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  type MotionValue,
  m,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { type SpringConfig, useChartConfig } from '../chart-config-context';
import { chartCssVars, useChartPortalContainer } from '../chart-context';
import { TOOLTIP_PANEL_CLASS_NAME, TooltipPanel } from './tooltip-box';

interface CursorTooltipBoxProps {
  visible: boolean;

  containerRef: RefObject<HTMLDivElement | null>;

  offset?: number;

  className?: string;

  children: ReactNode;

  exit?: boolean;

  springConfig?: SpringConfig;

  animateSize?: boolean;

  panelStyle?: CSSProperties;

  backgroundColor?: string;
}

const DEFAULT_TOOLTIP_WIDTH = 180;
const DEFAULT_TOOLTIP_HEIGHT = 80;

export function CursorTooltipBox({
  visible,
  containerRef,
  offset = 16,
  exit = true,
  springConfig,
  ...panelProps
}: CursorTooltipBoxProps) {
  const container = useChartPortalContainer(containerRef);
  const { tooltipBoxSpring } = useChartConfig();

  const reducedMotion = useReducedMotion() === true;
  const x = useSpring(0, springConfig ?? tooltipBoxSpring);
  const y = useSpring(0, springConfig ?? tooltipBoxSpring);

  const visibleRef = useRef(visible);
  useLayoutEffect(() => {
    visibleRef.current = visible;
  }, [visible]);
  const pointerRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({
    width: DEFAULT_TOOLTIP_WIDTH,
    height: DEFAULT_TOOLTIP_HEIGHT,
  });
  const [flipped, setFlipped] = useState(false);
  const flippedRef = useRef(false);

  const place = useCallback(() => {
    if (!container) {
      return;
    }
    const { width, height } = sizeRef.current;
    const pointer = pointerRef.current;
    const flip = pointer.x + offset + width > container.clientWidth;
    const left = flip ? pointer.x - offset - width : pointer.x + offset;
    const top = Math.max(offset, Math.min(pointer.y - height / 2, container.clientHeight - height - offset));
    if (reducedMotion || !visibleRef.current) {
      x.jump(left);
      y.jump(top);
    } else {
      x.set(left);
      y.set(top);
    }
    if (flip !== flippedRef.current) {
      flippedRef.current = flip;
      setFlipped(flip);
    }
  }, [container, offset, reducedMotion, x, y]);

  useEffect(() => {
    if (!container) {
      return;
    }
    const track = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      place();
    };

    container.addEventListener('pointerover', track, { passive: true });
    container.addEventListener('pointermove', track, { passive: true });
    return () => {
      container.removeEventListener('pointerover', track);
      container.removeEventListener('pointermove', track);
    };
  }, [container, place]);

  const onMeasure = useCallback(
    (width: number, height: number) => {
      if (width > 0 && height > 0) {
        sizeRef.current = { width, height };
        place();
      }
    },
    [place]
  );

  if (!container) {
    return null;
  }
  const inner = visible ? (
    <CursorTooltipPanel
      {...panelProps}
      container={container}
      flipped={flipped}
      key="cursor-tooltip"
      onMeasure={onMeasure}
      x={x}
      y={y}
    />
  ) : null;

  return <LazyMotion features={domAnimation}>{exit ? <AnimatePresence>{inner}</AnimatePresence> : inner}</LazyMotion>;
}

function CursorTooltipPanel({
  container,
  x,
  y,
  flipped,
  onMeasure,
  className,
  children,
  animateSize = true,
  panelStyle,
  backgroundColor = chartCssVars.tooltipBackground,
}: Pick<CursorTooltipBoxProps, 'className' | 'children' | 'animateSize' | 'panelStyle' | 'backgroundColor'> & {
  container: HTMLElement;
  x: MotionValue<number>;
  y: MotionValue<number>;
  flipped: boolean;
  onMeasure: (width: number, height: number) => void;
}) {
  const reducedMotion = useReducedMotion() === true;
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = panelRef.current;
    if (element) {
      onMeasure(element.offsetWidth, element.offsetHeight);
    }
  }, [children, onMeasure]);

  return createPortal(
    <m.div
      animate={{ opacity: 1 }}
      className={cn('pointer-events-none absolute top-0 left-0 z-50', className)}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      ref={panelRef}
      style={{ x, y }}
      transition={{ duration: 0.1 }}
    >
      <TooltipPanel
        animateSize={animateSize && !reducedMotion}
        className={cn(
          TOOLTIP_PANEL_CLASS_NAME,
          panelStyle?.backgroundColor === undefined &&
            backgroundColor === chartCssVars.tooltipBackground &&
            'bg-chart-tooltip-background',
          panelStyle?.backdropFilter === undefined && 'backdrop-blur-md'
        )}
        entrance={reducedMotion ? false : { scale: 0.85 }}
        style={{
          ...(panelStyle?.backgroundColor === undefined && {
            backgroundColor,
          }),
          ...panelStyle,
        }}
        transformOrigin={flipped ? 'right center' : 'left center'}
      >
        {children}
      </TooltipPanel>
    </m.div>,
    container
  );
}

CursorTooltipBox.displayName = 'CursorTooltipBox';
