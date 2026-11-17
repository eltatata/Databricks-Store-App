'use client';

import { geoArea } from 'd3-geo';
import type { Feature, Geometry, Polygon } from 'geojson';
import {
  type AnimationPlaybackControls,
  animate,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { createContext, type RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ChoroplethFeature } from './choropleth-context';
import type { ChoroplethMercator } from './choropleth-projection';

type ChoroplethViewSide = 'west' | 'flat' | 'east';

export interface ChoroplethOverviewView {
  view?: ChoroplethViewSide | 'pointer';

  yaw?: number;

  tilt?: number;
}

export interface ChoroplethFocusView {
  view?: ChoroplethViewSide | 'auto';

  yaw?: number;

  tilt?: number;
}

export interface ChoroplethPerspective {
  overview?: ChoroplethOverviewView;
  focus?: ChoroplethFocusView;

  depth?: number;

  edgeFade?: number;
}

export interface ChoroplethZoomTransition {
  duration?: number;

  ease?: readonly [number, number, number, number];
}

const DEFAULT_CHOROPLETH_ZOOM_EASE = [0.83, 0, 0.17, 1] as const;
const DEFAULT_YAW = 18;
const POINTER_SPRING = { type: 'spring', stiffness: 90, damping: 20 } as const;
const DRAG_CLICK_TOLERANCE = 5;

export const CHOROPLETH_CAMERA_SCALE_VAR = '--choropleth-camera-k';

interface View {
  cx: number;
  cy: number;
  k: number;
}

export interface ChoroplethCameraApi {
  enabled: boolean;

  focusedKey: string | null;

  focusedFeatureIndex: number | null;

  maxZoom: number;

  isHoverable: (key: string) => boolean;
  focusFeature: (index: number) => void;
  focusPoint: (coordinates: [number, number], key: string) => void;
  reset: () => void;

  wasDrag: () => boolean;
}

const noop = () => undefined;

export const ChoroplethCameraContext = createContext<ChoroplethCameraApi>({
  enabled: false,
  focusedKey: null,
  focusedFeatureIndex: null,
  maxZoom: 1,
  isHoverable: () => true,
  focusFeature: noop,
  focusPoint: noop,
  reset: noop,
  wasDrag: () => false,
});

export function useChoroplethCamera(): ChoroplethCameraApi {
  return useContext(ChoroplethCameraContext);
}

function mainland(feature: ChoroplethFeature): Feature<Geometry> {
  const geometry = feature.geometry;
  if (geometry?.type !== 'MultiPolygon') {
    return feature;
  }
  let best: Polygon | null = null;
  let bestArea = -1;
  for (const coordinates of geometry.coordinates) {
    const polygon: Polygon = { type: 'Polygon', coordinates };
    const area = geoArea(polygon);
    if (area > bestArea) {
      bestArea = area;
      best = polygon;
    }
  }
  return best ? { ...feature, geometry: best } : feature;
}

function signedYaw(side: ChoroplethViewSide, yaw: number) {
  if (side === 'flat') {
    return 0;
  }

  return side === 'east' ? -yaw : yaw;
}

interface UseCameraOptions {
  width: number;
  height: number;
  mercator: ChoroplethMercator;
  features: readonly ChoroplethFeature[];
  clickToZoom: boolean;
  focusMaxZoom: number;
  perspective?: ChoroplethPerspective;
  zoomTransition?: ChoroplethZoomTransition;

  onBeforeFocus?: () => void;
}

export interface ChoroplethCameraController {
  api: ChoroplethCameraApi;
  cameraRef: RefObject<SVGGElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  planeRef: RefObject<HTMLDivElement | null>;
  yaw: MotionValue<number>;
  tilt: MotionValue<number>;
  depth: number;
  hasPerspective: boolean;

  edgeFade: number;

  edgeFadeActive: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerLeave: () => void;
}

export function useChoroplethCameraController({
  width,
  height,
  mercator,
  features,
  clickToZoom,
  focusMaxZoom,
  perspective,
  zoomTransition,
  onBeforeFocus,
}: UseCameraOptions): ChoroplethCameraController {
  const reduceMotion = useReducedMotion();
  const cameraRef = useRef<SVGGElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<View>({ cx: width / 2, cy: height / 2, k: 1 });
  const flight = useRef<AnimationPlaybackControls | null>(null);
  const yawAnim = useRef<AnimationPlaybackControls | null>(null);
  const tiltAnim = useRef<AnimationPlaybackControls | null>(null);
  const pressRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const overview = perspective?.overview;
  const focus = perspective?.focus;
  const overviewView = overview?.view ?? 'flat';
  const overviewYaw = overview?.yaw ?? DEFAULT_YAW;
  const overviewTilt = overview?.tilt ?? 0;
  const focusView = focus?.view;
  const focusYaw = focus?.yaw ?? overviewYaw;
  const focusTilt = focus?.tilt ?? overviewTilt;
  const depth = perspective?.depth ?? 1600;

  const overviewStaticYaw = overviewView === 'pointer' ? 0 : signedYaw(overviewView, overviewYaw);

  const yaw = useMotionValue(overviewStaticYaw);
  const tilt = useMotionValue(overviewTilt);

  const hasPerspective =
    perspective !== undefined &&
    (overviewView !== 'flat' ||
      overviewTilt !== 0 ||
      (focusView !== undefined && focusView !== 'flat') ||
      focusTilt !== 0);

  const duration = reduceMotion ? 0 : (zoomTransition?.duration ?? 700) / 1000;
  const easeKey = (zoomTransition?.ease ?? DEFAULT_CHOROPLETH_ZOOM_EASE).join(',');
  const ease = useMemo(() => easeKey.split(',').map(Number) as [number, number, number, number], [easeKey]);

  const applyView = useCallback(
    (view: View) => {
      viewRef.current = view;
      const tx = width / 2 - view.k * view.cx;
      const ty = height / 2 - view.k * view.cy;
      cameraRef.current?.setAttribute(
        'transform',
        view.k === 1 && tx === 0 && ty === 0 ? '' : `translate(${tx} ${ty}) scale(${view.k})`
      );
      svgRef.current?.style.setProperty(CHOROPLETH_CAMERA_SCALE_VAR, String(view.k));
    },
    [width, height]
  );

  const moveAngles = useCallback(
    (nextYaw: number, nextTilt: number) => {
      yawAnim.current?.stop();
      tiltAnim.current?.stop();
      if (duration === 0) {
        yaw.set(nextYaw);
        tilt.set(nextTilt);
        return;
      }
      const options = { duration, ease };
      yawAnim.current = animate(yaw, nextYaw, options);
      tiltAnim.current = animate(tilt, nextTilt, options);
    },
    [duration, ease, tilt, yaw]
  );

  const flyTo = useCallback(
    (target: View) => {
      flight.current?.stop();
      if (duration === 0) {
        applyView(target);
        return;
      }
      const from = { ...viewRef.current };
      const logFrom = Math.log(from.k);
      const logTo = Math.log(target.k);

      flight.current = animate(0, 1, {
        duration,
        ease,
        onUpdate: (t) =>
          applyView({
            cx: from.cx + (target.cx - from.cx) * t,
            cy: from.cy + (target.cy - from.cy) * t,
            k: Math.exp(logFrom + (logTo - logFrom) * t),
          }),
      });
    },
    [applyView, duration, ease]
  );

  const focusAngles = useCallback(
    (cx: number) => {
      if (!perspective) {
        return;
      }
      let side: ChoroplethViewSide;
      if (focusView === 'auto') {
        side = cx < width / 2 ? 'west' : 'east';
      } else if (focusView) {
        side = focusView;
      } else {
        side = overviewView === 'pointer' ? 'flat' : overviewView;
      }
      moveAngles(signedYaw(side, focusYaw), focusTilt);
    },
    [focusTilt, focusView, focusYaw, moveAngles, overviewView, perspective, width]
  );

  const reset = useCallback(() => {
    setFocusedKey(null);
    flyTo({ cx: width / 2, cy: height / 2, k: 1 });
    moveAngles(overviewStaticYaw, overviewTilt);
  }, [flyTo, height, moveAngles, overviewStaticYaw, overviewTilt, width]);

  const focusFeature = useCallback(
    (index: number) => {
      const key = `feature:${index}`;
      if (focusedKey === key) {
        reset();
        return;
      }
      const feature = features[index];
      if (!feature) {
        return;
      }
      const [[x0, y0], [x1, y1]] = mercator.path.bounds(mainland(feature));
      if (![x0, y0, x1, y1].every(Number.isFinite)) {
        return;
      }
      const k = Math.min(focusMaxZoom, Math.max(1, 0.7 * Math.min(width / (x1 - x0 || 1), height / (y1 - y0 || 1))));
      const cx = (x0 + x1) / 2;
      onBeforeFocus?.();
      setFocusedKey(key);
      flyTo({ cx, cy: (y0 + y1) / 2, k });
      focusAngles(cx);
    },
    [features, flyTo, focusAngles, focusMaxZoom, focusedKey, height, mercator, onBeforeFocus, reset, width]
  );

  const focusPoint = useCallback(
    (coordinates: [number, number], key: string) => {
      const pointKey = `point:${key}`;
      if (focusedKey === pointKey) {
        reset();
        return;
      }
      const projected = mercator.projection(coordinates);
      if (!projected) {
        return;
      }
      const [cx, cy] = projected;
      onBeforeFocus?.();
      setFocusedKey(pointKey);
      flyTo({ cx, cy, k: Math.min(focusMaxZoom, 4) });
      focusAngles(cx);
    },
    [focusAngles, flyTo, focusMaxZoom, focusedKey, mercator, onBeforeFocus, reset]
  );

  useEffect(() => {
    flight.current?.stop();
    applyView({ cx: width / 2, cy: height / 2, k: 1 });
    setFocusedKey(null);
  }, [applyView, width, height]);

  useEffect(() => {
    if (focusedKey === null) {
      moveAngles(overviewStaticYaw, overviewTilt);
    }
  }, [focusedKey, moveAngles, overviewStaticYaw, overviewTilt]);

  useEffect(() => {
    const write = () => {
      const plane = planeRef.current;
      if (plane) {
        plane.style.transform = `rotateX(${tilt.get()}deg) rotateY(${yaw.get()}deg)`;
      }
    };
    write();
    const offYaw = yaw.on('change', write);
    const offTilt = tilt.on('change', write);
    return () => {
      offYaw();
      offTilt();
    };
  }, [tilt, yaw]);

  useEffect(() => {
    if (!clickToZoom) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusedKey !== null) {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clickToZoom, focusedKey, reset]);

  useEffect(
    () => () => {
      flight.current?.stop();
      yawAnim.current?.stop();
      tiltAnim.current?.stop();
    },
    []
  );

  const followsPointer =
    perspective !== undefined && overviewView === 'pointer' && focusedKey === null && !reduceMotion;

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const press = pressRef.current;
      if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_CLICK_TOLERANCE) {
        press.moved = true;
      }
      if (!followsPointer) {
        return;
      }
      const box = event.currentTarget.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));

      yawAnim.current?.stop();
      yawAnim.current = animate(yaw, overviewYaw - 2 * overviewYaw * t, POINTER_SPRING);
    },
    [followsPointer, overviewYaw, yaw]
  );

  const onPointerLeave = useCallback(() => {
    if (!followsPointer) {
      return;
    }
    yawAnim.current?.stop();
    yawAnim.current = animate(yaw, 0, POINTER_SPRING);
  }, [followsPointer, yaw]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    pressRef.current = { x: event.clientX, y: event.clientY, moved: false };
  }, []);

  const wasDrag = useCallback(() => pressRef.current?.moved ?? false, []);

  const api = useMemo<ChoroplethCameraApi>(
    () => ({
      enabled: clickToZoom,
      focusedKey,
      focusedFeatureIndex: focusedKey?.startsWith('feature:') ? Number(focusedKey.slice('feature:'.length)) : null,
      maxZoom: focusMaxZoom,
      isHoverable: (key: string) => focusedKey === null || focusedKey === key,
      focusFeature,
      focusPoint,
      reset,
      wasDrag,
    }),
    [clickToZoom, focusFeature, focusMaxZoom, focusPoint, focusedKey, reset, wasDrag]
  );

  return {
    api,
    cameraRef,
    svgRef,
    planeRef,
    yaw,
    tilt,
    depth,
    hasPerspective,
    edgeFade: hasPerspective ? Math.min(45, Math.max(0, perspective?.edgeFade ?? 0)) : 0,
    edgeFadeActive: focusedKey !== null || overviewView !== 'flat' || overviewTilt !== 0,
    onPointerDown,
    onPointerMove,
    onPointerLeave,
  };
}
