import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { ROUTES } from '@/configs/routes';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: ROUTES.dashboard,
        lazy: async () => ({ Component: (await import('@/pages/DashboardPage')).DashboardPage }),
      },
      {
        path: ROUTES.products,
        lazy: async () => ({ Component: (await import('@/pages/ProductsPage')).ProductsPage }),
      },
      {
        path: ROUTES.productDetail,
        lazy: async () => ({ Component: (await import('@/pages/ProductDetailPage')).ProductDetailPage }),
      },
      {
        path: ROUTES.explore,
        lazy: async () => ({ Component: (await import('@/pages/ExplorePage')).ExplorePage }),
      },
      {
        path: ROUTES.assistant,
        lazy: async () => ({ Component: (await import('@/pages/AssistantPage')).AssistantPage }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
]);
