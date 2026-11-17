'use client';

import { BackgroundPatternLayer, type BackgroundProps } from '../background';
import { useChoroplethCamera } from './choropleth-camera';
import { useChoroplethStable } from './choropleth-context';

interface ChoroplethBackgroundProps extends BackgroundProps {
  hideOnFocus?: boolean;
}

export function ChoroplethBackground({ hideOnFocus = false, ...props }: ChoroplethBackgroundProps) {
  const { width, height, isLoaded, enterTransition } = useChoroplethStable();
  const { focusedKey } = useChoroplethCamera();
  const hidden = hideOnFocus && focusedKey !== null;
  return (
    <g style={{ opacity: hidden ? 0 : 1, transition: 'opacity 0.3s ease-out' }}>
      <BackgroundPatternLayer
        {...props}
        enterTransition={enterTransition}
        height={height}
        isLoaded={isLoaded}
        width={width}
      />
    </g>
  );
}

ChoroplethBackground.displayName = 'ChoroplethBackground';
