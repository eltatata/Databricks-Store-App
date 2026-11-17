import { describe, expect, it } from 'vitest';
import { resolvePeriod } from '@/utils/period';

describe('resolvePeriod', () => {
  it('compares a preset with the same dates one year earlier', () => {
    const period = resolvePeriod('jan-aug-2018', {});

    expect(period.range).toEqual({ from: '2018-01-01', to: '2018-08-31' });
    expect(period.comparison).toEqual({ from: '2017-01-01', to: '2017-08-31' });
    expect(period.label).toBe('Jan – Aug 2018');
  });

  it('has no comparison for all time', () => {
    const period = resolvePeriod('all-time', {});

    expect(period.range).toEqual({ from: undefined, to: undefined });
    expect(period.comparison).toBeNull();
    expect(period.comparisonLabel).toBeNull();
  });

  it('uses the custom range and labels it with both dates', () => {
    const period = resolvePeriod('custom', { from: '2018-03-01', to: '2018-03-31' });

    expect(period.range).toEqual({ from: '2018-03-01', to: '2018-03-31' });
    expect(period.comparison).toEqual({ from: '2017-03-01', to: '2017-03-31' });
    expect(period.label).toBe('Mar 1, 2018 – Mar 31, 2018');
  });
});
