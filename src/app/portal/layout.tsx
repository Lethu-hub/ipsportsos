import { redirect } from 'next/navigation';
import { getSessionUser, isPlatformAdmin, primaryOrgMembership } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login');
  }

  // Redirect to Platform Admin if they are a platform admin
  if (isPlatformAdmin(session.access)) {
    redirect('/admin');
  }

  // Redirect to the club staff portal if they have a club membership
  const org = primaryOrgMembership(session.access);
  if (org && org.organization_slug) {
    redirect(`/${org.organization_slug}`);
  }

  // Fallback
  return <>{children}</>;
}
