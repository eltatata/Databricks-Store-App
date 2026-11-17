'use client';

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface ElementSize {
  width: number;
  height: number;
}

const ZERO_SIZE: ElementSize = { width: 0, height: 0 };

function readElementSize(element: HTMLElement): ElementSize {
  const style = getComputedStyle(element);
  const width = Number.parseFloat(style.width);
  const height = Number.parseFloat(style.height);
  return {
    width: Number.isFinite(width) ? width : element.clientWidth,
    height: Number.isFinite(height) ? height : element.clientHeight,
  };
}

interface ElementSizeOptions {
  timing?: 'layout' | 'observer';
}

const sameSize = (a: ElementSize, b: ElementSize) => a.width === b.width && a.height === b.height;

function leadingDebounce<A>(fn: (arg: A) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let pending: { arg: A } | null = null;
  const debounced = (arg: A) => {
    if (timeout === undefined) {
      fn(arg);
      pending = null;
    } else {
      pending = { arg };
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
      if (pending !== null) {
        fn(pending.arg);
        pending = null;
      }
    }, wait);
  };
  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = undefined;
    pending = null;
  };
  return debounced;
}

export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
  debounceTime = 0,
  { timing = 'layout' }: ElementSizeOptions = {}
): ElementSize {
  const [size, setSize] = useState<ElementSize>(ZERO_SIZE);

  useEffect(() => {
    const element = ref.current;
    if (timing !== 'observer' || !element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const resize = leadingDebounce<ElementSize>((next) => {
      setSize((prev) => (sameSize(prev, next) ? prev : next));
    }, debounceTime);
    let frame = 0;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        frame = requestAnimationFrame(() => resize({ width, height }));
      }
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.cancel();
    };
  }, [ref, debounceTime, timing]);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (timing !== 'layout' || !element) {
      return;
    }
    const apply = () => {
      const next = readElementSize(element);
      setSize((prev) => (sameSize(prev, next) ? prev : next));
    };
    apply();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let trailing = false;
    const observer = new ResizeObserver(() => {
      if (debounceTime <= 0) {
        apply();
        return;
      }
      if (timeout !== null) {
        trailing = true;
        return;
      }
      apply();
      const flush = () => {
        if (trailing) {
          trailing = false;
          apply();
          timeout = setTimeout(flush, debounceTime);
          return;
        }
        timeout = null;
      };
      timeout = setTimeout(flush, debounceTime);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timeout !== null) {
        clearTimeout(timeout);
      }
    };
  }, [ref, debounceTime, timing]);

  return size;
}

interface ChartParentSizeProps {
  children: (size: { width: number; height: number }) => ReactNode;
  className?: string;
  debounceTime?: number;
  style?: CSSProperties;
}

export function ParentSize({ children, className, debounceTime, style }: ChartParentSizeProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(parentRef, debounceTime ?? 300);
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div ref={parentRef} style={{ position: 'absolute', inset: 0 }}>
        {children({ width, height })}
      </div>
    </div>
  );
}
