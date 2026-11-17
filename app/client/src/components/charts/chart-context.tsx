'use client';

import {
  type ScaleBand as D3ScaleBand,
  type ScaleLinear as D3ScaleLinear,
  type ScaleTime as D3ScaleTime,
  scaleLinear,
} from 'd3-scale';

type ScaleLinear<Output, _Input = number> = D3ScaleLinear<Output, Output>;
type ScaleTime<Output, _Input = Date | number> = D3ScaleTime<Output, Output>;
type ScaleBand<Domain extends { toString(): string }> = D3ScaleBand<Domain>;

import type { Transition } from 'motion/react';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ChartPhase, ChartStatus } from './chart-phase';
import type { ReferenceAreaConfig } from './reference-area-config';
import type { ChartSelection } from './use-chart-interaction';
import { DEFAULT_Y_AXIS_ID } from './y-axis-scales';
import type { YDomain } from './y-domain-utils';

export const chartCssVars = {
  background: 'var(--chart-background)',
  foreground: 'var(--chart-foreground)',
  foregroundMuted: 'var(--chart-foreground-muted)',
  label: 'var(--chart-label)',
  linePrimary: 'var(--chart-line-primary)',
  lineSecondary: 'var(--chart-line-secondary)',
  crosshair: 'var(--chart-crosshair)',
  grid: 'var(--chart-grid)',
  indicatorColor: 'var(--chart-indicator-color)',
  indicatorSecondaryColor: 'var(--chart-indicator-secondary-color)',
  markerBackground: 'var(--chart-marker-background)',
  markerBorder: 'var(--chart-marker-border)',
  markerForeground: 'var(--chart-marker-foreground)',
  badgeBackground: 'var(--chart-marker-badge-background)',
  badgeForeground: 'var(--chart-marker-badge-foreground)',
  segmentBackground: 'var(--chart-segment-background)',
  segmentLine: 'var(--chart-segment-line)',
  brushBorder: 'var(--chart-brush-border)',
  tooltipBackground: 'var(--chart-tooltip-background)',
};

export const defaultScatterColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export const DISCRETE_INTERACTION_LABEL_THRESHOLD = 60;

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TooltipData {
  point: Record<string, unknown>;

  index: number;

  x: number;

  yPositions: Record<string, number>;

  xPositions?: Record<string, number>;

  activeDataKey?: string;
}

export interface LineConfig {
  dataKey: string;
  stroke: string;
  strokeWidth: number;

  yAxisId?: string | number;
}

export interface BandConfig {
  yAxisId: string;
  upperKey: string;
  lowerKey: string;

  color: string;

  label: string;

  showInTooltip: boolean;
}

export interface ChartHoverContextValue {
  tooltipData: TooltipData | null;
  setTooltipData: Dispatch<SetStateAction<TooltipData | null>>;

  selection?: ChartSelection | null;

  clearSelection?: () => void;

  hoveredBarIndex?: number | null;

  setHoveredBarIndex?: (index: number | null) => void;

  hoveredCandleIndex?: number | null;

  setHoveredCandleIndex?: (index: number | null) => void;
}

export interface ChartContextValue extends ChartHoverContextValue {
  data: Record<string, unknown>[];

  renderData: Record<string, unknown>[];

  xScale: ScaleTime<number, number>;

  yScale: ScaleLinear<number, number>;

  yScales: Record<string, ScaleLinear<number, number>>;

  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;

  columnWidth: number;

  containerRef: RefObject<HTMLDivElement | null>;

  lines: LineConfig[];

  bands?: BandConfig[];

  referenceAreas: ReferenceAreaConfig[];

  chartPhase: ChartPhase;
  chartStatus: ChartStatus;

  loadingLabel?: string;

  yDomainTweenDuration: number;

  yDomainSkeletonByAxis: Record<string, YDomain>;

  yDomainTargetByAxis: Record<string, YDomain>;

  isLoaded: boolean;
  animationDuration: number;

  animationEasing?: string;

  enterTransition?: Transition;

  revealEpoch?: number;

  notifyLoadingPulseComplete?: () => void;

  xAccessor: (d: Record<string, unknown>) => Date;

  dateLabels: string[];

  xDomain?: [Date, Date];

  xDomainSlotCount?: number;

  barScale?: ScaleBand<string>;

  bandWidth?: number;

  barXAccessor?: (d: Record<string, unknown>) => string;

  orientation?: 'vertical' | 'horizontal';

  stacked?: boolean;

  stackOffsets?: Map<number, Map<string, number>>;

  squareSnap?: { squareGap: number; groupGap?: number; fit?: boolean };

  composedBarDataKeys?: string[];

  composedBarSize?: number;

  composedMaxBarSize?: number;

  composedBarGap?: number;

  composedStacked?: boolean;

  composedStackOffsets?: Map<number, Map<string, number>>;

  composedStackGap?: number;

  nearestPointHover?: boolean;
}

export type ChartStableContextValue = Omit<ChartContextValue, keyof ChartHoverContextValue>;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const ChartStableContext = createContext<ChartStableContextValue | null>(null);
const ChartHoverContext = createContext<ChartHoverContextValue | null>(null);

export interface ChartHoverStore {
  getSnapshot: () => ChartHoverContextValue;
  subscribe: (listener: () => void) => () => void;
}

interface WritableChartHoverStore extends ChartHoverStore {
  setTooltipData: Dispatch<SetStateAction<TooltipData | null>>;
  setSelection: (selection: ChartSelection | null) => void;
}

const ChartHoverStoreContext = createContext<ChartHoverStore | null>(null);

export function createChartHoverStore(): WritableChartHoverStore {
  const listeners = new Set<() => void>();
  let tooltipData: TooltipData | null = null;
  let selection: ChartSelection | null = null;
  const emit = () => {
    snapshot = { ...snapshot, tooltipData, selection };
    for (const listener of listeners) {
      listener();
    }
  };
  const setTooltipData: Dispatch<SetStateAction<TooltipData | null>> = (action) => {
    const next = typeof action === 'function' ? action(tooltipData) : action;
    if (next === tooltipData) {
      return;
    }
    tooltipData = next;
    emit();
  };
  const setSelection = (next: ChartSelection | null) => {
    if (next === selection) {
      return;
    }
    selection = next;
    emit();
  };
  let snapshot: ChartHoverContextValue = {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection: () => setSelection(null),
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setTooltipData,
    setSelection,
  };
}

const noop = () => undefined;

function staticChartHoverStore(value: ChartHoverContextValue): ChartHoverStore {
  return {
    getSnapshot: () => value,
    subscribe: () => noop,
  };
}

export function ChartHoverStoreProvider({ children, store }: { children: ReactNode; store: ChartHoverStore }) {
  const hover = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return (
    <ChartHoverStoreContext.Provider value={store}>
      <ChartHoverContext.Provider value={hover}>{children}</ChartHoverContext.Provider>
    </ChartHoverStoreContext.Provider>
  );
}

export function ChartProvider({ children, value }: { children: ReactNode; value: ChartContextValue }) {
  const stable = useMemo<ChartStableContextValue>(
    () => ({
      data: value.data,
      renderData: value.renderData,
      xScale: value.xScale,
      yScale: value.yScale,
      yScales: value.yScales,
      width: value.width,
      height: value.height,
      innerWidth: value.innerWidth,
      innerHeight: value.innerHeight,
      margin: value.margin,
      columnWidth: value.columnWidth,
      containerRef: value.containerRef,
      lines: value.lines,
      bands: value.bands,
      referenceAreas: value.referenceAreas,
      chartPhase: value.chartPhase,
      chartStatus: value.chartStatus,
      loadingLabel: value.loadingLabel,
      yDomainTweenDuration: value.yDomainTweenDuration,
      yDomainSkeletonByAxis: value.yDomainSkeletonByAxis,
      yDomainTargetByAxis: value.yDomainTargetByAxis,
      isLoaded: value.isLoaded,
      animationDuration: value.animationDuration,
      animationEasing: value.animationEasing,
      enterTransition: value.enterTransition,
      revealEpoch: value.revealEpoch,
      notifyLoadingPulseComplete: value.notifyLoadingPulseComplete,
      xAccessor: value.xAccessor,
      dateLabels: value.dateLabels,
      xDomain: value.xDomain,
      xDomainSlotCount: value.xDomainSlotCount,
      barScale: value.barScale,
      bandWidth: value.bandWidth,
      barXAccessor: value.barXAccessor,
      orientation: value.orientation,
      stacked: value.stacked,
      stackOffsets: value.stackOffsets,
      composedBarDataKeys: value.composedBarDataKeys,
      composedBarSize: value.composedBarSize,
      composedMaxBarSize: value.composedMaxBarSize,
      composedBarGap: value.composedBarGap,
      composedStacked: value.composedStacked,
      composedStackOffsets: value.composedStackOffsets,
      composedStackGap: value.composedStackGap,
      nearestPointHover: value.nearestPointHover,
    }),
    [
      value.data,
      value.renderData,
      value.xScale,
      value.yScale,
      value.yScales,
      value.width,
      value.height,
      value.innerWidth,
      value.innerHeight,
      value.margin,
      value.columnWidth,
      value.containerRef,
      value.lines,
      value.bands,
      value.referenceAreas,
      value.chartPhase,
      value.chartStatus,
      value.loadingLabel,
      value.yDomainTweenDuration,
      value.yDomainSkeletonByAxis,
      value.yDomainTargetByAxis,
      value.isLoaded,
      value.animationDuration,
      value.animationEasing,
      value.enterTransition,
      value.revealEpoch,
      value.notifyLoadingPulseComplete,
      value.xAccessor,
      value.dateLabels,
      value.xDomain,
      value.xDomainSlotCount,
      value.barScale,
      value.bandWidth,
      value.barXAccessor,
      value.orientation,
      value.stacked,
      value.stackOffsets,
      value.composedBarDataKeys,
      value.composedBarSize,
      value.composedMaxBarSize,
      value.composedBarGap,
      value.composedStacked,
      value.composedStackOffsets,
      value.composedStackGap,
      value.nearestPointHover,
    ]
  );

  const hover = useMemo<ChartHoverContextValue>(
    () => ({
      tooltipData: value.tooltipData,
      setTooltipData: value.setTooltipData,
      selection: value.selection,
      clearSelection: value.clearSelection,
      hoveredBarIndex: value.hoveredBarIndex,
      setHoveredBarIndex: value.setHoveredBarIndex,
      hoveredCandleIndex: value.hoveredCandleIndex,
      setHoveredCandleIndex: value.setHoveredCandleIndex,
    }),
    [
      value.tooltipData,
      value.setTooltipData,
      value.selection,
      value.clearSelection,
      value.hoveredBarIndex,
      value.setHoveredBarIndex,
      value.hoveredCandleIndex,
      value.setHoveredCandleIndex,
    ]
  );

  const hoverStore = useMemo(() => staticChartHoverStore(hover), [hover]);

  return (
    <ChartStableContext.Provider value={stable}>
      <ChartHoverStoreContext.Provider value={hoverStore}>
        <ChartHoverContext.Provider value={hover}>{children}</ChartHoverContext.Provider>
      </ChartHoverStoreContext.Provider>
    </ChartStableContext.Provider>
  );
}

export const ChartStableContextProvider = ChartStableContext.Provider;

export function useChartStable(): ChartStableContextValue {
  const context = useContext(ChartStableContext);
  if (!context) {
    throw new Error(
      'useChartStable must be used within a ChartProvider. ' +
        'Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.'
    );
  }
  return context;
}

export function useChartPortalContainer<T extends HTMLElement>(
  containerRef: RefObject<T | null> | undefined
): T | null {
  const [container, setContainer] = useState<T | null>(() => containerRef?.current ?? null);
  useIsomorphicLayoutEffect(() => {
    setContainer(containerRef?.current ?? null);
  }, [containerRef]);
  useEffect(() => {
    const element = containerRef?.current ?? null;
    setContainer((previous) => (previous === element ? previous : element));
  }, [containerRef]);
  return container;
}

export function useStableMargin(margin: Margin): Margin {
  const { top, right, bottom, left } = margin;
  return useMemo(() => ({ top, right, bottom, left }), [top, right, bottom, left]);
}

export function useYScale(yAxisId?: string | number): ScaleLinear<number, number> {
  const { yScales, yScale } = useChartStable();
  const id = yAxisId == null || yAxisId === '' ? DEFAULT_Y_AXIS_ID : String(yAxisId);
  return yScales[id] ?? yScale;
}

export function useSettledYScale(yAxisId?: string | number): ScaleLinear<number, number> {
  const { yDomainTargetByAxis, innerHeight } = useChartStable();
  const liveScale = useYScale(yAxisId);
  const id = yAxisId == null || yAxisId === '' ? DEFAULT_Y_AXIS_ID : String(yAxisId);
  const domain = yDomainTargetByAxis?.[id] ?? yDomainTargetByAxis?.[DEFAULT_Y_AXIS_ID];
  const min = domain?.[0];
  const max = domain?.[1];
  const settled = useMemo(
    () => (min == null || max == null ? null : scaleLinear().domain([min, max]).range([innerHeight, 0])),
    [min, max, innerHeight]
  );
  return settled ?? liveScale;
}

export function useChartHover(): ChartHoverContextValue {
  const context = useContext(ChartHoverContext);
  if (!context) {
    throw new Error(
      'useChartHover must be used within a ChartProvider. ' +
        'Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.'
    );
  }
  return context;
}

export function useChartHoverSelector<T>(selector: (hover: ChartHoverContextValue) => T): T {
  const store = useContext(ChartHoverStoreContext);
  if (!store) {
    throw new Error(
      'useChartHoverSelector must be used within a ChartProvider. ' +
        'Make sure your component is wrapped in <LineChart>, <AreaChart>, <BarChart>, or <ComposedChart>.'
    );
  }
  const getSelected = () => selector(store.getSnapshot());
  return useSyncExternalStore(store.subscribe, getSelected, getSelected);
}

export function useChartHoverStore(): ChartHoverStore | null {
  return useContext(ChartHoverStoreContext);
}

export function selectTooltipData(hover: ChartHoverContextValue): TooltipData | null {
  return hover.tooltipData;
}

export function selectIsChartHovering(hover: ChartHoverContextValue): boolean {
  return hover.tooltipData !== null || hover.selection?.active === true;
}

export function useChart(): ChartContextValue {
  const stable = useChartStable();
  const hover = useChartHover();

  return { ...stable, ...hover };
}
