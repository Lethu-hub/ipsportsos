import { requirePortalUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ClubWebsiteProps {
  params: { clubname: string };
}

export default async function ClubWebsitePage({ params }: ClubWebsiteProps) {
  await requirePortalUser();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', params.clubname)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Website" description={`Manage public website pages and news for ${org.name}.`} />
      <EmptyState
        icon={<Globe className="h-6 w-6 text-primary" />}
        title="Website manager coming in Sprint 2"
        description={`Draft, review, and publish pages and news articles for ${org.name} with the draft-to-publish workflow.`}
      />
    </div>
  );
}
