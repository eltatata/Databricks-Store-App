'use client';

import type { Transition } from 'motion/react';
import { domAnimation, LazyMotion } from 'motion/react';
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { Area, type AreaProps } from './area';
import { AreaValueLabels } from './area-value-labels';
import { type LineConfig, type Margin, useStableMargin } from './chart-context';
import { ChartLoadingLabel } from './chart-loading-label';
import { ParentSize } from './chart-parent-size';
import {
  type ChartPhase,
  type ChartStatus,
  DEFAULT_CHART_STATUS,
  DEFAULT_Y_DOMAIN_TWEEN_MS,
  resolveRestingChartPhase,
} from './chart-phase';
import { PatternArea } from './pattern-area';
import { TimeSeriesChartInner, timeSeriesChartHasRoom } from './time-series-chart-shell';

interface AreaChartProps {
  data: Record<string, unknown>[];

  xDataKey?: string;

  margin?: Partial<Margin>;

  animationDuration?: number;

  animationEasing?: string;

  enterTransition?: Transition;

  revealSignature?: string;

  aspectRatio?: string;

  className?: string;

  status?: ChartStatus;

  loadingLabel?: string;

  yDomainTweenDuration?: number;

  yDomainTween?: boolean;

  xDomain?: [Date, Date];

  xDomainSlotCount?: number;

  tweenYDomainOnXDomainChange?: boolean;

  style?: CSSProperties;

  onPhaseChange?: (phase: ChartPhase) => void;

  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 40, bottom: 40, left: 40 };

function extractAreaConfigs(children: ReactNode): (LineConfig & AreaProps)[] {
  const configs: (LineConfig & AreaProps)[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const childType = child.type as {
      displayName?: string;
      name?: string;
    };
    const componentName = typeof child.type === 'function' ? childType.displayName || childType.name || '' : '';

    const props = child.props as AreaProps | undefined;
    const isPatternArea = componentName === 'PatternArea' || child.type === PatternArea;

    const isSeriesOverlay =
      componentName === 'TrendLine' || componentName === 'LineSeriesTerminalMarker' || componentName === 'LineBackdrop';
    const isAreaComponent =
      componentName === 'Area' ||
      child.type === Area ||
      (props && typeof props.dataKey === 'string' && props.dataKey.length > 0 && !isPatternArea && !isSeriesOverlay);

    if (isAreaComponent && props?.dataKey) {
      configs.push({
        ...props,
        dataKey: props.dataKey,
        stroke: props.stroke || props.fill || 'var(--chart-line-primary)',
        strokeWidth: props.strokeWidth || 2,
        yAxisId: props.yAxisId,
      });
    }
  });

  return configs;
}

export function AreaChart({
  data,
  xDataKey = 'date',
  margin: marginProp,
  animationDuration = 1100,
  animationEasing,
  enterTransition,
  revealSignature,
  aspectRatio = '2 / 1',
  className = '',
  status = DEFAULT_CHART_STATUS,
  loadingLabel,
  yDomainTweenDuration = DEFAULT_Y_DOMAIN_TWEEN_MS,
  yDomainTween = true,
  xDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange = false,
  style,
  onPhaseChange,
  children,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const margin = useStableMargin({ ...DEFAULT_MARGIN, ...marginProp });
  const lines = useMemo(() => extractAreaConfigs(children), [children]);
  const [chartPhase, setChartPhase] = useState<ChartPhase>(() => resolveRestingChartPhase(status));
  const handlePhaseChange = useCallback(
    (phase: ChartPhase) => {
      setChartPhase(phase);
      onPhaseChange?.(phase);
    },
    [onPhaseChange]
  );

  const showLoadingLabel = Boolean(
    loadingLabel?.trim() &&
      (chartPhase === 'loading' ||
        chartPhase === 'exiting' ||
        chartPhase === 'gridTweenReady' ||
        chartPhase === 'revealingLoading')
  );

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={cn('relative w-full', className)}
        ref={containerRef}
        style={{ aspectRatio, touchAction: 'none', ...style }}
      >
        <ParentSize debounceTime={10}>
          {({ width, height }) =>
            timeSeriesChartHasRoom(width, height) ? (
              <TimeSeriesChartInner
                animationDuration={animationDuration}
                animationEasing={animationEasing}
                chartStatus={status}
                clipPathId="chart-area-grow-clip"
                containerRef={containerRef}
                data={data}
                enterTransition={enterTransition}
                height={height}
                lines={lines}
                loadingLabel={loadingLabel}
                margin={margin}
                onPhaseChange={handlePhaseChange}
                revealSignature={revealSignature}
                tweenYDomainOnXDomainChange={tweenYDomainOnXDomainChange}
                width={width}
                xDataKey={xDataKey}
                xDomain={xDomain}
                xDomainSlotCount={xDomainSlotCount}
                yDomainTween={yDomainTween}
                yDomainTweenDuration={yDomainTweenDuration}
              >
                {children}
                <AreaValueLabels series={lines} />
              </TimeSeriesChartInner>
            ) : null
          }
        </ParentSize>
        {showLoadingLabel ? <ChartLoadingLabel exiting={chartPhase !== 'loading'} text={loadingLabel} /> : null}
      </div>
    </LazyMotion>
  );
}
