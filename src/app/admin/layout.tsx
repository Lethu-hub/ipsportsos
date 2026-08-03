import { getSessionUser, isPlatformAdmin } from '@/lib/auth';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { AdminShell } from '@/components/shells/admin-shell';
import { ShieldAlert, LogOut } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Platform Admin — IP Sports OS',
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    return <AdminLoginForm />;
  }

  const platformAdmin = isPlatformAdmin(session.access);

  if (!platformAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 text-center">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({session.email}) does not have platform administrator privileges. This area is reserved for OS administrators.
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
                Sign Out
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
    'Admin User';

  return (
    <AdminShell userName={name} userEmail={session.email}>
      {children}
    </AdminShell>
  );
}
