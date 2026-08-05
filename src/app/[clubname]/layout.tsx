import { notFound } from 'next/navigation';
import { getSessionUser, isPlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ClubLoginForm } from '@/components/auth/club-login-form';
import { ClubPortalShell } from '@/components/shells/club-portal-shell';
import { ShieldAlert, LogOut } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ClubLayoutProps {
  params: { clubname: string };
  children: React.ReactNode;
}

export default async function ClubLayout({ params, children }: ClubLayoutProps) {
  const supabase = await createClient();

  // 1. Resolve club slug in organizations table.
  const { data: org } = await supabase
    .from('organizations')
    .select('*, organization_branding(*)')
    .eq('slug', params.clubname)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  // If no club exists with this slug, return a standard 404 page.
  if (!org) {
    notFound();
  }

  // 2. Resolve signed-in user.
  const session = await getSessionUser();

  // If not authenticated, render the custom club-branded login form directly at this URL!
  if (!session) {
    return <ClubLoginForm club={org} />;
  }

  // 3. Verify user membership in this club, or if they are a Platform Admin (OS Admin).
  const hasAccess =
    isPlatformAdmin(session.access) ||
    session.access.some((m) => m.organization_id === org.id);

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 text-center">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({session.email}) does not have permission to access the staff portal for{' '}
            <strong className="text-foreground">{org.name}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Back to Home
            </Link>
            {/* Standard HTML form trigger to sign out and clear cookies */}
            <form action="/api/auth/signout" method="POST" className="w-full">
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                <LogOut className="h-4 w-4" />
                Sign Out / Switch Account
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const profile = session.profile;
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    session.email.split('@')[0] ||
    'Staff User';

  const membership = session.access.find((m) => m.organization_id === org.id);
  const permissions = isPlatformAdmin(session.access) ? ['teams:create', 'matches:create', 'website:update', 'analytics:read', 'analytics:update'] : membership?.permissions ?? [];
  return (
    <ClubPortalShell club={org} userName={name} userEmail={session.email} permissions={permissions}>
      {children}
    </ClubPortalShell>
  );
}
