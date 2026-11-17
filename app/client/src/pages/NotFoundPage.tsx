import { Link } from 'react-router';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes';

export function NotFoundPage() {
  return (
    <EmptyState
      title="This page does not exist"
      description="The link may be outdated. Go back to the dashboard to keep working."
      action={
        <Button asChild variant="outline">
          <Link to={ROUTES.dashboard}>Open the dashboard</Link>
        </Button>
      }
    />
  );
}
