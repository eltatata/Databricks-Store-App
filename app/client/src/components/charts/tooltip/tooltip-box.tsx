'use client';

import {
  AnimatePresence,
  type AnimationPlaybackControls,
  animate,
  cancelFrame,
  domAnimation,
  frame,
  frameData,
  LazyMotion,
  type MotionValue,
  m,
  type Process,
  useReducedMotion,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import type { RefObject } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { cn } from '@/lib/utils';
import { type SpringConfig, useChartConfig } from '../chart-config-context';
import { chartCssVars, useChartPortalContainer } from '../chart-context';

export interface TooltipBoxProps {
  x: number;

  y: number;

  visible: boolean;

  containerRef: RefObject<HTMLDivElement | null>;

  containerWidth: number;

  containerHeight: number;

  offset?: number;

  className?: string;

  children: React.ReactNode;

  left?: number | ReturnType<typeof useSpring>;

  top?: number | ReturnType<typeof useSpring>;

  flipped?: boolean;

  flipX?: number;

  springConfig?: SpringConfig;

  animate?: boolean;

  entrance?: boolean;

  exit?: boolean;

  replayOnFlip?: boolean;

  animateSize?: boolean;

  panelStyle?: React.CSSProperties;

  backgroundColor?: string;
}

export const TOOLTIP_PANEL_CLASS_NAME =
  'relative min-w-[160px] rounded-xl border not-dark:bg-clip-padding text-chart-tooltip-foreground shadow-lg/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] before:shadow-[0_1px_rgb(0_0_0/0.04)] dark:before:shadow-[0_-1px_rgb(255_255_255/0.06)]';

const TOOLTIP_PANEL_INNER_CLASS_NAME = 'overflow-hidden rounded-[calc(var(--radius-xl)-1px)]';

const PANEL_ENTRANCE_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
} as const;

const PANEL_SIZE_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 45,
} as const;

interface PanelSizes {
  panelWidth: number;
  panelHeight: number;
  clipWidth: number;
  clipHeight: number;
}

const mixNumber = (from: number, to: number, progress: number) => from + (to - from) * progress;

function mixPanelSizes(from: PanelSizes, to: PanelSizes, progress: number): PanelSizes {
  return {
    panelWidth: mixNumber(from.panelWidth, to.panelWidth, progress),
    panelHeight: mixNumber(from.panelHeight, to.panelHeight, progress),
    clipWidth: mixNumber(from.clipWidth, to.clipWidth, progress),
    clipHeight: mixNumber(from.clipHeight, to.clipHeight, progress),
  };
}

const FRAME_MS = 1000 / 60;

const BORDER_BOX: ResizeObserverOptions = { box: 'border-box' };

const samePanelSizes = (a: PanelSizes, b: PanelSizes) =>
  a.panelWidth === b.panelWidth &&
  a.panelHeight === b.panelHeight &&
  a.clipWidth === b.clipWidth &&
  a.clipHeight === b.clipHeight;

function readPxRadius(element: HTMLElement): number | null {
  const value = getComputedStyle(element).borderTopLeftRadius;
  return value.endsWith('px') ? Number.parseFloat(value) : null;
}

function correctedRadius(r: number, width: number, height: number): string {
  const x = width === 0 ? 0 : (r / width) * 100;
  const y = height === 0 ? 0 : (r / height) * 100;
  return `${x}% / ${y}%`;
}

const ratio = (drawn: number, layout: number) => (layout === 0 ? 1 : drawn / layout);

interface PanelRadii {
  panel: number | null;
  clip: number | null;
  panelInline: string;
  clipInline: string;
}

function readBorderBox(element: HTMLElement): [number, number] {
  const style = getComputedStyle(element);
  let width = Number.parseFloat(style.width);
  let height = Number.parseFloat(style.height);
  if (!(Number.isFinite(width) && Number.isFinite(height))) {
    return [element.offsetWidth, element.offsetHeight];
  }
  if (style.boxSizing !== 'border-box') {
    width +=
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight) +
      Number.parseFloat(style.borderLeftWidth) +
      Number.parseFloat(style.borderRightWidth);
    height +=
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom) +
      Number.parseFloat(style.borderTopWidth) +
      Number.parseFloat(style.borderBottomWidth);
  }
  return [width, height];
}

function readPanelSizes(panel: HTMLElement, clip: HTMLElement): PanelSizes {
  const [panelWidth, panelHeight] = readBorderBox(panel);
  const [clipWidth, clipHeight] = readBorderBox(clip);
  return { panelWidth, panelHeight, clipWidth, clipHeight };
}

function drawPanelTween(
  { panel, clip, content }: { panel: HTMLElement; clip: HTMLElement; content: HTMLElement },
  radii: PanelRadii,
  from: PanelSizes,
  target: PanelSizes,
  progress: number
) {
  const drawn = mixPanelSizes(from, target, progress);
  const scaleX = ratio(drawn.panelWidth, target.panelWidth);
  const scaleY = ratio(drawn.panelHeight, target.panelHeight);
  const clipScaleX = ratio(drawn.clipWidth, target.clipWidth);
  const clipScaleY = ratio(drawn.clipHeight, target.clipHeight);
  panel.style.transform = `scale(${scaleX}, ${scaleY})`;
  const offsetX = clip.offsetLeft / scaleX - clip.offsetLeft;
  const offsetY = clip.offsetTop / scaleY - clip.offsetTop;
  const translate = offsetX || offsetY ? `translate3d(${offsetX}px, ${offsetY}px, 0px) ` : '';
  clip.style.transform = `${translate}scale(${clipScaleX / scaleX}, ${clipScaleY / scaleY})`;
  content.style.transform = `scale(${1 / clipScaleX}, ${1 / clipScaleY})`;
  if (radii.panel !== null) {
    panel.style.borderRadius = correctedRadius(radii.panel, drawn.panelWidth, drawn.panelHeight);
  }
  if (radii.clip !== null) {
    clip.style.borderRadius = correctedRadius(radii.clip, drawn.clipWidth, drawn.clipHeight);
  }
}

function usePanelSizeTween(
  panelRef: RefObject<HTMLDivElement | null>,
  clipRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  const checkRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const clip = clipRef.current;
    const content = contentRef.current;
    if (!(enabled && panel && clip && content)) {
      return;
    }

    const observing = typeof ResizeObserver !== 'undefined';
    let target = readPanelSizes(panel, clip);
    let from: PanelSizes | null = null;
    let progress = 1;
    let controls: AnimationPlaybackControls | undefined;
    let pendingStart: Process | undefined;

    let radii: PanelRadii | null = null;

    const stop = () => {
      if (pendingStart) {
        cancelFrame(pendingStart);
        pendingStart = undefined;
      }
      controls?.stop();
      controls = undefined;
    };

    const reset = () => {
      panel.style.transform = '';
      clip.style.transform = '';
      content.style.transform = '';
      if (radii) {
        panel.style.borderRadius = radii.panelInline;
        clip.style.borderRadius = radii.clipInline;
        radii = null;
      }
    };

    const draw = (latest: number) => {
      progress = latest;
      if (from && radii) {
        drawPanelTween({ panel, clip, content }, radii, from, target, latest);
      }
    };

    const check = () => {
      const next = readPanelSizes(panel, clip);
      if (samePanelSizes(next, target)) {
        return;
      }
      from = from && progress < 1 ? mixPanelSizes(from, target, progress) : target;
      target = next;
      stop();
      radii ??= {
        panel: readPxRadius(panel),
        clip: readPxRadius(clip),
        panelInline: panel.style.borderRadius,
        clipInline: clip.style.borderRadius,
      };

      draw(0);
      const startTween = (elapsed: number) => {
        controls = animate(0, 1000, {
          ...PANEL_SIZE_SPRING,
          elapsed,
          velocity: 0,
          onUpdate: (latest) => draw(latest / 1000),
          onComplete: () => {
            progress = 1;
            from = null;
            controls = undefined;
            reset();
          },
        });
      };

      if (observing) {
        const sinceFrame = performance.now() - frameData.timestamp;
        startTween(sinceFrame >= 0 && sinceFrame < FRAME_MS ? sinceFrame : 0);
        return;
      }
      pendingStart = frame.update(() => {
        pendingStart = undefined;
        startTween(0);
      });
    };

    if (!observing) {
      checkRef.current = check;
      return () => {
        checkRef.current = null;
        stop();
        reset();
      };
    }

    const observer = new ResizeObserver(check);
    observer.observe(panel, BORDER_BOX);
    observer.observe(clip, BORDER_BOX);
    return () => {
      observer.disconnect();
      stop();
      reset();
    };
  }, [panelRef, clipRef, contentRef, enabled]);

  useLayoutEffect(() => {
    checkRef.current?.();
  });
}

const ORIGIN_TOP_LEFT: React.CSSProperties = { transformOrigin: '0 0' };

export function TooltipPanel({
  animateSize,
  entrance,
  transformOrigin,
  className,
  style,
  children,
}: {
  animateSize: boolean;

  entrance: { scale: number; x?: number } | false;
  transformOrigin: string;
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const reducedMotionConfig = useReducedMotionConfig() === true;
  usePanelSizeTween(panelRef, clipRef, contentRef, animateSize && !reducedMotionConfig);

  return (
    <m.div
      animate={{ scale: 1, x: 0 }}
      initial={entrance === false ? false : { x: 0, ...entrance }}
      style={{ transformOrigin }}
      transition={PANEL_ENTRANCE_SPRING}
    >
      <m.div
        animate={{ opacity: 1 }}
        className={className}
        initial={{ opacity: 0 }}
        ref={panelRef}
        style={{ ...style, ...ORIGIN_TOP_LEFT }}
        transition={PANEL_ENTRANCE_SPRING}
      >
        <div className={TOOLTIP_PANEL_INNER_CLASS_NAME} ref={clipRef} style={ORIGIN_TOP_LEFT}>
          <div ref={contentRef} style={ORIGIN_TOP_LEFT}>
            {children}
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

function moveTo(spring: MotionValue<number>, value: number, snap: boolean): void {
  if (snap) {
    spring.jump(value);
  } else {
    spring.set(value);
  }
}

const DEFAULT_TOOLTIP_WIDTH = 180;
const DEFAULT_TOOLTIP_HEIGHT = 80;

function readPanelBoxSize(el: HTMLElement, widthRef: { current: number }, heightRef: { current: number }): boolean {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const changed = (w > 0 && w !== widthRef.current) || (h > 0 && h !== heightRef.current);
  if (w > 0) {
    widthRef.current = w;
  }
  if (h > 0) {
    heightRef.current = h;
  }
  return changed;
}

function resolveTooltipTarget({
  x,
  flipX = x,
  y,
  width,
  height,
  offset,
  containerWidth,
  containerHeight,
}: {
  x: number;
  flipX?: number;
  y: number;
  width: number;
  height: number;
  offset: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const flipped = flipX + width + offset > containerWidth;
  return {
    flipped,
    left: flipped ? x - offset - width : x + offset,
    top: Math.max(offset, Math.min(y - height / 2, containerHeight - height - offset)),
  };
}

export function TooltipBox(props: TooltipBoxProps) {
  const container = useChartPortalContainer(props.containerRef);
  if (!container) {
    return null;
  }
  const inner = props.visible ? <TooltipBoxInner {...props} container={container} key="tooltip-box" /> : null;

  return (
    <LazyMotion features={domAnimation}>
      {props.exit !== false && props.entrance !== false ? <AnimatePresence>{inner}</AnimatePresence> : inner}
    </LazyMotion>
  );
}

function TooltipBoxInner({
  x,
  y,
  containerWidth,
  containerHeight,
  offset = 16,
  className = '',
  children,
  left: leftOverride,
  top: topOverride,
  flipped: flippedOverride,
  flipX,
  springConfig,
  animate = true,
  entrance = true,
  exit: _exit,
  replayOnFlip = true,
  animateSize = true,
  panelStyle,
  backgroundColor = chartCssVars.tooltipBackground,
  container,
}: Omit<TooltipBoxProps, 'visible' | 'containerRef'> & {
  container: HTMLElement;
}) {
  const { tooltipBoxSpring } = useChartConfig();

  const reducedMotion = useReducedMotion() === true;
  const effectiveSpring = springConfig ?? tooltipBoxSpring;

  const tooltipRef = useRef<HTMLDivElement>(null);

  const tooltipWidthRef = useRef(DEFAULT_TOOLTIP_WIDTH);
  const tooltipHeightRef = useRef(DEFAULT_TOOLTIP_HEIGHT);

  const [staticPosition] = useState(() => ({ left: x, top: y }));

  const hasPositionedRef = useRef(false);

  const [flip, setFlip] = useState(() => ({
    flipped: (flipX ?? x) + DEFAULT_TOOLTIP_WIDTH + offset > containerWidth,
    key: 0,
  }));
  const shouldFlipX = flip.flipped;

  const [initialTarget] = useState(() =>
    resolveTooltipTarget({
      x,
      flipX,
      y,
      width: DEFAULT_TOOLTIP_WIDTH,
      height: DEFAULT_TOOLTIP_HEIGHT,
      offset,
      containerWidth,
      containerHeight,
    })
  );
  const animatedLeft = useSpring(initialTarget.left, effectiveSpring);
  const animatedTop = useSpring(initialTarget.top, effectiveSpring);

  const placeRef = useRef<((fromObserver: boolean) => void) | null>(null);

  const sizeObservedRef = useRef(false);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) {
      return;
    }
    if (!sizeObservedRef.current) {
      readPanelBoxSize(el, tooltipWidthRef, tooltipHeightRef);
      sizeObservedRef.current = typeof ResizeObserver !== 'undefined';
    }
    const place = (fromObserver: boolean) => {
      const target = resolveTooltipTarget({
        x,
        flipX,
        y,
        width: tooltipWidthRef.current,
        height: tooltipHeightRef.current,
        offset,
        containerWidth,
        containerHeight,
      });
      const updateFlip = () =>
        setFlip((prev) => (prev.flipped === target.flipped ? prev : { flipped: target.flipped, key: prev.key + 1 }));

      if (fromObserver) {
        flushSync(updateFlip);
      } else {
        updateFlip();
      }
      const tx = target.left;
      const ty = target.top;
      if (!animate) {
        const left = `${tx}px`;
        const top = `${ty}px`;
        if (el.style.left !== left) {
          el.style.left = left;
        }
        if (el.style.top !== top) {
          el.style.top = top;
        }
        return;
      }
      const snap = reducedMotion || !hasPositionedRef.current;
      hasPositionedRef.current = true;
      if (leftOverride === undefined) {
        moveTo(animatedLeft, tx, snap);
      }
      if (topOverride === undefined) {
        moveTo(animatedTop, ty, snap);
      }
    };
    placeRef.current = place;
    place(false);
  }, [
    x,
    flipX,
    y,
    containerWidth,
    containerHeight,
    offset,
    leftOverride,
    topOverride,
    animate,
    animatedLeft,
    animatedTop,
    reducedMotion,
  ]);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (readPanelBoxSize(el, tooltipWidthRef, tooltipHeightRef)) {
        placeRef.current?.(true);
      }
    });
    observer.observe(el, BORDER_BOX);
    return () => observer.disconnect();
  }, []);

  const flipKey = replayOnFlip ? flip.key : 0;

  const finalLeft = animate ? (leftOverride ?? animatedLeft) : staticPosition.left;
  const finalTop = animate ? (topOverride ?? animatedTop) : staticPosition.top;
  const isFlipped = flippedOverride ?? shouldFlipX;
  const transformOrigin = isFlipped ? 'right top' : 'left top';

  const panelClassName = `${TOOLTIP_PANEL_CLASS_NAME}${
    panelStyle?.backgroundColor === undefined && backgroundColor === chartCssVars.tooltipBackground
      ? ' bg-chart-tooltip-background'
      : ''
  }${panelStyle?.backdropFilter === undefined ? ' backdrop-blur-md' : ''}`;
  const panelStyleResolved = {
    ...(panelStyle?.backgroundColor === undefined && {
      backgroundColor,
    }),
    ...panelStyle,
  };

  if (!entrance) {
    return createPortal(
      <div
        className={cn('pointer-events-none absolute z-50', className)}
        ref={tooltipRef}
        style={{ left: staticPosition.left, top: staticPosition.top }}
      >
        <div className={panelClassName} style={{ transformOrigin, ...panelStyleResolved }}>
          <div className={TOOLTIP_PANEL_INNER_CLASS_NAME}>{children}</div>
        </div>
      </div>,
      container
    );
  }

  return createPortal(
    <m.div
      animate={{ opacity: 1 }}
      className={cn('pointer-events-none absolute z-50', className)}
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      ref={tooltipRef}
      style={{ left: finalLeft, top: finalTop }}
      transition={{ duration: 0.1 }}
    >
      <TooltipPanel
        animateSize={animateSize && animate && !reducedMotion}
        className={panelClassName}
        entrance={reducedMotion ? false : { scale: 0.85, x: isFlipped ? 20 : -20 }}
        key={flipKey}
        style={panelStyleResolved}
        transformOrigin={transformOrigin}
      >
        {children}
      </TooltipPanel>
    </m.div>,
    container
  );
}

TooltipBox.displayName = 'TooltipBox';
