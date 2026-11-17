'use client';

import type { Feature, FeatureCollection, GeoJSON, Geometry } from 'geojson';
import type { Transition } from 'motion/react';
import {
  createContext,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ZoomInstance } from './use-choropleth-zoom-state';

export type { ZoomInstance } from './use-choropleth-zoom-state';

interface ChoroplethZoomContextValue {
  zoom: ZoomInstance<SVGSVGElement> | null;
}

export const ChoroplethZoomContext = createContext<ChoroplethZoomContextValue>({
  zoom: null,
});

export function useChoroplethZoom() {
  return useContext(ChoroplethZoomContext);
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChoroplethFeatureProperties {
  name?: string;
  id?: string | number;
  [key: string]: unknown;
}

export type ChoroplethFeature = Feature<Geometry, ChoroplethFeatureProperties>;

interface ChoroplethTooltipData {
  featureIndex: number;
  x: number;
  y: number;
  feature: ChoroplethFeature;
}

interface ChoroplethMarkerTooltipData {
  label: string;
  coordinates: [number, number];
}

interface ChoroplethInteractionContextValue {
  hoveredFeatureIndex: number | null;
  setHoveredFeatureIndex: (index: number | null) => void;
  tooltipData: ChoroplethTooltipData | null;
  setTooltipData: Dispatch<SetStateAction<ChoroplethTooltipData | null>>;
  markerTooltip?: ChoroplethMarkerTooltipData | null;
  setMarkerTooltip?: (marker: ChoroplethMarkerTooltipData | null) => void;
}

interface ChoroplethStableContextValue {
  features: ChoroplethFeature[];
  featureCollection: FeatureCollection<Geometry, ChoroplethFeatureProperties>;

  featurePaths: readonly (string | null)[];

  pathGenerator: (feature: ChoroplethFeature) => string | undefined;

  rawPathGenerator: (geo: GeoJSON) => string | null;

  projectPoint: (coords: [number, number]) => [number, number] | null;

  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;

  containerRef: RefObject<HTMLDivElement | null>;

  isLoaded: boolean;
  animationDuration: number;
  enterTransition?: Transition;
  revealEpoch: number;
}

const ChoroplethStableContext = createContext<ChoroplethStableContextValue | null>(null);
const ChoroplethInteractionContext = createContext<ChoroplethInteractionContextValue | null>(null);

export function ChoroplethStableProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ChoroplethStableContextValue;
}) {
  return <ChoroplethStableContext.Provider value={value}>{children}</ChoroplethStableContext.Provider>;
}

export function ChoroplethInteractionShell({ children }: { children: React.ReactNode }) {
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<ChoroplethTooltipData | null>(null);
  const [markerTooltip, setMarkerTooltip] = useState<ChoroplethMarkerTooltipData | null>(null);

  const interaction = useMemo<ChoroplethInteractionContextValue>(
    () => ({
      hoveredFeatureIndex,
      setHoveredFeatureIndex,
      tooltipData,
      setTooltipData,
      markerTooltip,
      setMarkerTooltip,
    }),
    [hoveredFeatureIndex, tooltipData, markerTooltip]
  );

  return <ChoroplethInteractionContext.Provider value={interaction}>{children}</ChoroplethInteractionContext.Provider>;
}

export function useChoroplethStable(): ChoroplethStableContextValue {
  const context = useContext(ChoroplethStableContext);
  if (!context) {
    throw new Error('useChoroplethStable must be used within a ChoroplethProvider');
  }
  return context;
}

export function useChoroplethInteraction(): ChoroplethInteractionContextValue {
  const context = useContext(ChoroplethInteractionContext);
  if (!context) {
    throw new Error('useChoroplethInteraction must be used within a ChoroplethProvider');
  }
  return context;
}

import { CHART_SCALE_VARS } from '../chart-scale';

export const defaultChoroplethColors = [...CHART_SCALE_VARS];
