import { requirePortalUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PortalWebsitePage() {
  await requirePortalUser();

  return (
    <div className="space-y-6">
      <PageHeader title="Website" description="Manage your public club pages and news." />
      <EmptyState
        icon={<Globe className="h-6 w-6" />}
        title="Website manager coming in Sprint 2"
        description="Draft, review, and publish club pages and news articles with the draft-to-publish workflow."
      />
    </div>
  );
}
