import { requirePortalUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartBar as BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalAnalyticsPage() {
  await requirePortalUser();

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Dashboards, widgets, and performance insights." />
      <EmptyState
        icon={<BarChart3 className="h-6 w-6" />}
        title="Analytics coming in Sprint 2"
        description="Reusable widgets and role-aware dashboards will live here. The analytics engine is already modeled in the database."
      />
    </div>
  );
}
