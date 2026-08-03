import { requirePlatformAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartBar as BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requirePlatformAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics Engine" description="System-wide dashboards, metrics, and operational performance." />
      <EmptyState
        icon={<BarChart3 className="h-6 w-6 text-primary" />}
        title="Operational Analytics (Sprint 2)"
        description="Platform-wide metrics, subscription statistics, and resource utilization insights will load here. Access is restricted to Platform Administrators."
      />
    </div>
  );
}
