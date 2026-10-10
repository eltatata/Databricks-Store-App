import { format, parseISO } from 'date-fns';
import type { KpiFormat } from '@/types/dashboard.types';

const LOCALE = 'en-US';
const EMPTY_VALUE = '—';

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 2,
});
const countFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const compactCountFormatter = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
const scoreFormatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
const signedPercentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const signedPointsFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2, signDisplay: 'exceptZero' });

const isPresent = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value);

export const formatCurrency = (value: number | null | undefined) =>
  isPresent(value) ? currencyFormatter.format(value) : EMPTY_VALUE;

export const formatCompactCurrency = (value: number | null | undefined) =>
  isPresent(value) ? compactCurrencyFormatter.format(value) : EMPTY_VALUE;

export const formatCount = (value: number | null | undefined) =>
  isPresent(value) ? countFormatter.format(value) : EMPTY_VALUE;

export const formatCompactCount = (value: number | null | undefined) =>
  isPresent(value) ? compactCountFormatter.format(value) : EMPTY_VALUE;

export const formatScore = (value: number | null | undefined) =>
  isPresent(value) ? scoreFormatter.format(value) : EMPTY_VALUE;

export const formatPercent = (value: number | null | undefined) =>
  isPresent(value) ? percentFormatter.format(value) : EMPTY_VALUE;

export const formatSignedPercent = (value: number) => signedPercentFormatter.format(value);

export const formatSignedPoints = (value: number) => `${signedPointsFormatter.format(value * 100)} pts`;

export const formatKpiValue = (value: number | null, kind: KpiFormat) => {
  switch (kind) {
    case 'currency':
      return formatCurrency(value);
    case 'count':
      return formatCount(value);
    case 'score':
      return formatScore(value);
    case 'percent':
      return formatPercent(value);
  }
};

export const formatIsoDate = (value: string | null | undefined, pattern = 'MMM d, yyyy') =>
  value ? format(parseISO(value), pattern) : EMPTY_VALUE;

export const formatDateTime = (value: string | null | undefined) =>
  value ? format(parseISO(value), 'MMM d, yyyy, HH:mm') : EMPTY_VALUE;

export const humanizeSlug = (value: string | null | undefined) => (value ? value.replaceAll('_', ' ') : EMPTY_VALUE);

export const shortId = (value: string, length = 8) => (value.length > length ? `${value.slice(0, length)}…` : value);

export const toDisplayText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE;
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  return JSON.stringify(value);
};
