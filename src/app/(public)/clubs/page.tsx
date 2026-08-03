import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { ClubCard } from '@/components/public/club-card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = {
  title: 'Clubs — IP Sports OS',
};

export default async function ClubsPage() {
  const supabase = await createClient();

  const { data: clubs } = await supabase
    .from('organizations')
    .select('*, organization_branding(*)')
    .eq('organization_type', 'CLUB')
    .eq('status', 'ACTIVE')
    .order('name');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeader title="Clubs" description="Discover every club on IP Sports OS." className="mb-8" />
      {clubs && clubs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              name={club.name}
              slug={club.slug}
              type={club.organization_type}
              branding={
                club.organization_branding ?? {
                  primary_color: null,
                  secondary_color: null,
                  accent_color: null,
                  logo_url: null,
                  banner_url: null,
                }
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No clubs yet" description="Clubs will appear here once they join the platform." />
      )}
    </div>
  );
}
