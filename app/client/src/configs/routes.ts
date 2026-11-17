export const ROUTES = {
  dashboard: '/',
  products: '/products',
  productDetail: '/products/:productId',
  legacyExplore: '/explore',
  assistant: '/assistant',
} as const;

export const productDetailPath = (productId: string) => `/products/${encodeURIComponent(productId)}`;

export const API_DOCS_URL = '/api/v1/docs/';

interface NavigationItem {
  label: string;
  to: string;
  end: boolean;
}

export const NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', to: ROUTES.dashboard, end: true },
  { label: 'Products', to: ROUTES.products, end: false },
  { label: 'Assistant', to: ROUTES.assistant, end: false },
];

export interface RouteHandle {
  layout?: 'viewport';
}
