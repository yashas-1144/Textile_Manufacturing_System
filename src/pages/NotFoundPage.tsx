import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Compass } from 'lucide-react';

/**
 * Catch-all route. Without this, an unknown URL falls through to React Router's
 * default error boundary and replaces the whole app shell with a raw error page.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          <EmptyState
            icon={<Compass className="h-7 w-7" />}
            title="Page not found"
            description="The page you are looking for does not exist or may have been moved."
            action={
              <Button onClick={() => navigate('/dashboard')}>
                <Compass className="h-4 w-4" />
                Back to Overview
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}