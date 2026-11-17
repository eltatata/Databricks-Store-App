'use client';

import { useCallback, useEffect, useState } from 'react';
import { type ChartPhase, type ChartStatus, resolveRestingChartPhase } from './chart-phase';

interface UseChartPhaseOrchestratorOptions {
  chartStatus: ChartStatus;
  targetData: Record<string, unknown>[];
  skeletonData: Record<string, unknown>[];
  animationDuration: number;
  yDomainTweenDuration: number;

  revealSignature?: string;

  skipEnterReveal?: boolean;
}

function resolveInitialChartPhase(
  chartStatus: ChartStatus,
  skipEnterReveal: boolean,
  animationDuration: number
): ChartPhase {
  if (chartStatus === 'ready' && !skipEnterReveal && animationDuration > 0) {
    return 'revealing';
  }
  return resolveRestingChartPhase(chartStatus);
}

function resolvePlotData<T>(chartPhase: ChartPhase, chartStatus: ChartStatus, skeletonData: T, targetData: T): T {
  if (chartPhase === 'exiting') {
    return skeletonData;
  }
  if (chartPhase === 'loading' && chartStatus === 'loading') {
    return skeletonData;
  }
  return targetData;
}

interface PhaseInputs {
  chartStatus: ChartStatus;
  chartPhase: ChartPhase;
  animationDuration: number;
  revealSignature: string;
  skipEnterReveal: boolean;
}

interface PhaseTransition {
  nextPhase: ChartPhase;
  resetLoaded: boolean;
  bumpConceal: boolean;
  bumpReveal: boolean;
}

function phaseInputsEqual(a: PhaseInputs, b: PhaseInputs): boolean {
  return (
    a.chartStatus === b.chartStatus &&
    a.chartPhase === b.chartPhase &&
    a.animationDuration === b.animationDuration &&
    a.revealSignature === b.revealSignature &&
    a.skipEnterReveal === b.skipEnterReveal
  );
}

function resolveStatusTransition(
  prevStatus: ChartStatus,
  chartStatus: ChartStatus,
  animationDuration: number,
  yDomainTweenDuration: number
): { phase: ChartPhase; conceal: boolean } | null {
  if (chartStatus === 'ready' && prevStatus === 'loading') {
    if (animationDuration > 0) {
      return { phase: 'exiting', conceal: false };
    }
    return {
      phase: yDomainTweenDuration <= 0 ? 'revealing' : 'gridTweenReady',
      conceal: false,
    };
  }
  if (chartStatus === 'loading' && prevStatus === 'ready') {
    if (animationDuration > 0) {
      return { phase: 'exitingReady', conceal: true };
    }
    return {
      phase: yDomainTweenDuration <= 0 ? 'loading' : 'gridTweenLoading',
      conceal: false,
    };
  }
  return null;
}

function shouldReplayReveal(prev: PhaseInputs, next: PhaseInputs): boolean {
  if (next.skipEnterReveal || next.chartStatus !== 'ready') {
    return false;
  }
  if (next.chartPhase !== 'ready') {
    return false;
  }
  return (
    prev.animationDuration !== next.animationDuration ||
    prev.revealSignature !== next.revealSignature ||
    prev.skipEnterReveal !== next.skipEnterReveal
  );
}

function resolvePhaseTransition(prev: PhaseInputs, next: PhaseInputs, yDomainTweenDuration: number): PhaseTransition {
  let nextPhase = next.chartPhase;
  let resetLoaded = false;
  let bumpConceal = false;

  if (prev.chartStatus === next.chartStatus) {
    if (shouldReplayReveal(prev, next)) {
      nextPhase = 'revealing';
      resetLoaded = true;
    }
  } else {
    const status = resolveStatusTransition(
      prev.chartStatus,
      next.chartStatus,
      next.animationDuration,
      yDomainTweenDuration
    );
    if (status) {
      nextPhase = status.phase;
      resetLoaded = true;
      bumpConceal = status.conceal;
    }
  }

  const bumpReveal =
    nextPhase === 'revealing' &&
    (prev.chartPhase !== 'revealing' ||
      nextPhase !== next.chartPhase ||
      prev.animationDuration !== next.animationDuration);

  return { nextPhase, resetLoaded, bumpConceal, bumpReveal };
}

export function useChartPhaseOrchestrator({
  chartStatus,
  targetData,
  skeletonData,
  animationDuration,
  yDomainTweenDuration,
  revealSignature = '',
  skipEnterReveal = false,
}: UseChartPhaseOrchestratorOptions) {
  const [chartPhase, setChartPhase] = useState<ChartPhase>(() =>
    resolveInitialChartPhase(chartStatus, skipEnterReveal, animationDuration)
  );
  const [revealEpoch, setRevealEpoch] = useState(() => (chartStatus === 'ready' && !skipEnterReveal ? 1 : 0));
  const [concealEpoch, setConcealEpoch] = useState(0);
  const [isLoaded, setIsLoaded] = useState(
    () => chartStatus === 'ready' && (skipEnterReveal || animationDuration <= 0)
  );

  const [prev, setPrev] = useState<PhaseInputs>({
    chartStatus,
    chartPhase,
    animationDuration,
    revealSignature,
    skipEnterReveal,
  });

  const current: PhaseInputs = {
    chartStatus,
    chartPhase,
    animationDuration,
    revealSignature,
    skipEnterReveal,
  };
  if (!phaseInputsEqual(prev, current)) {
    const transition = resolvePhaseTransition(prev, current, yDomainTweenDuration);
    if (transition.resetLoaded) {
      setIsLoaded(false);
    }
    if (transition.bumpConceal) {
      setConcealEpoch((epoch) => epoch + 1);
    }
    if (transition.bumpReveal) {
      setRevealEpoch((epoch) => epoch + 1);
    }
    if (transition.nextPhase !== chartPhase) {
      setChartPhase(transition.nextPhase);
    }
    setPrev({ ...current, chartPhase: transition.nextPhase });
  }

  const plotData = resolvePlotData(chartPhase, chartStatus, skeletonData, targetData);

  const notifyLoadingPulseComplete = useCallback(() => {
    setChartPhase((phase) => (phase === 'exiting' ? 'gridTweenReady' : phase));
  }, []);

  const notifyRevealConcealComplete = useCallback(() => {
    setChartPhase((phase) => (phase === 'exitingReady' ? 'gridTweenLoading' : phase));
  }, []);

  const notifyYDomainTweenComplete = useCallback(() => {
    setChartPhase((phase) => {
      if (phase === 'gridTweenLoading') {
        return 'loading';
      }
      if (phase === 'gridTweenReady') {
        return 'revealing';
      }
      return phase;
    });
  }, []);

  useEffect(() => {
    if (chartPhase !== 'revealing') {
      return;
    }
    const timer = window.setTimeout(
      () => {
        setChartPhase('ready');
        setIsLoaded(true);
      },
      Math.max(0, animationDuration)
    );
    return () => window.clearTimeout(timer);
  }, [animationDuration, chartPhase]);

  return {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete,
  };
}
