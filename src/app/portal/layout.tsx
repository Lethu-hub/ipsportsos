import { redirect } from 'next/navigation';
import { PortalShell } from '@/components/shells/portal-shell';
import { getSessionUser } from '@/lib/auth';

export const metadata = {
  title: 'Club Portal — IP Sports OS',
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login');
  }

  const profile = session.profile;
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    session.email.split('@')[0] ||
    'Portal user';

  return (
    <PortalShell
      userName={name}
      userEmail={session.email}
      access={session.access}
    >
      {children}
    </PortalShell>
  );
}
