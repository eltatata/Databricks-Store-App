'use client';

import { useEffect, useState } from 'react';

export const TOOLTIP_HIDE_DELAY_MS = 120;

export function useDelayedTooltipData<T>(
  tooltipData: T | null,
  showDelay = 0,
  hideDelay = TOOLTIP_HIDE_DELAY_MS
): T | null {
  const [displayData, setDisplayData] = useState<T | null>(null);
  const [prevTooltipData, setPrevTooltipData] = useState<T | null>(null);

  const isShowing = displayData !== null;

  if (prevTooltipData !== tooltipData) {
    setPrevTooltipData(tooltipData);
    if (tooltipData) {
      if (isShowing || showDelay === 0) {
        setDisplayData(tooltipData);
      }
    } else if (hideDelay === 0) {
      setDisplayData(null);
    }
  }

  useEffect(() => {
    if (tooltipData) {
      if (displayData === tooltipData) {
        return;
      }
      const showTimer = setTimeout(() => {
        setDisplayData(tooltipData);
      }, showDelay);
      return () => clearTimeout(showTimer);
    }

    if (displayData === null) {
      return;
    }
    const hideTimer = setTimeout(() => {
      setDisplayData(null);
    }, hideDelay);
    return () => clearTimeout(hideTimer);
  }, [tooltipData, displayData, showDelay, hideDelay]);

  return displayData;
}
