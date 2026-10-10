export const ROUTES = {
  dashboard: '/',
  products: '/products',
  productDetail: '/products/:productId',
  explore: '/explore',
} as const;

export const productDetailPath = (productId: string) => `/products/${encodeURIComponent(productId)}`;

export const API_DOCS_URL = '/api/v1/docs/';

export interface NavigationItem {
  label: string;
  to: string;
  end: boolean;
}

export const NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', to: ROUTES.dashboard, end: true },
  { label: 'Products', to: ROUTES.products, end: false },
  { label: 'Explore', to: ROUTES.explore, end: false },
];
