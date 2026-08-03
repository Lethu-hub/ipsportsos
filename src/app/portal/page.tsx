import { redirect } from 'next/navigation';
import { getSessionUser, isPlatformAdmin, primaryOrgMembership } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalRedirectPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login');
  }

  // If Platform Admin / OS Admin, send to /admin
  if (isPlatformAdmin(session.access)) {
    redirect('/admin');
  }

  // If Organization / Club staff, send to /[club-slug]
  const org = primaryOrgMembership(session.access);
  if (org && org.organization_slug) {
    redirect(`/${org.organization_slug}`);
  }

  // Fallback to home page if no memberships/roles are found
  redirect('/');
}
