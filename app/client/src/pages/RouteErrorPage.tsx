import { useRouteError } from 'react-router';
import { ErrorState } from '@/components/common/ErrorState';

export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
      <ErrorState error={error} title="This screen stopped working" onRetry={() => window.location.reload()} />
    </div>
  );
}
