'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ChartBar as BarChart3,
  Globe,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Building2,
  UserCog,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import type { AccessMembership } from '@/types/database';

interface PortalShellProps {
  userName: string;
  userEmail: string;
  access: AccessMembership[];
  children: React.ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  visible: (access: AccessMembership[]) => boolean;
  section: 'main' | 'admin';
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/portal',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    visible: () => true,
    section: 'main',
  },
  {
    href: '/portal/squad',
    label: 'Squad',
    icon: <Users className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.organization_id !== null),
    section: 'main',
  },
  {
    href: '/portal/matches',
    label: 'Matches',
    icon: <Trophy className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.organization_id !== null),
    section: 'main',
  },
  {
    href: '/portal/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.organization_id !== null),
    section: 'main',
  },
  {
    href: '/portal/website',
    label: 'Website',
    icon: <Globe className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.organization_id !== null),
    section: 'main',
  },
  {
    href: '/portal/settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.organization_id !== null),
    section: 'main',
  },
  {
    href: '/portal/admin/sports',
    label: 'Sports',
    icon: <ShieldCheck className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.role_scope === 'PLATFORM'),
    section: 'admin',
  },
  {
    href: '/portal/admin/organizations',
    label: 'Organizations',
    icon: <Building2 className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.role_scope === 'PLATFORM'),
    section: 'admin',
  },
  {
    href: '/portal/admin/users',
    label: 'Users & Roles',
    icon: <UserCog className="h-4 w-4" />,
    visible: (a) => a.some((m) => m.role_scope === 'PLATFORM'),
    section: 'admin',
  },
];

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

export function PortalShell({ userName, userEmail, access, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.visible(access));
  const mainItems = visibleItems.filter((i) => i.section === 'main');
  const adminItems = visibleItems.filter((i) => i.section === 'admin');

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy className="h-4 w-4" />
        </div>
        <span className="font-semibold">IP Sports OS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Portal">
        {mainItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href} />
        ))}
        {adminItems.length > 0 ? (
          <>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Platform Admin
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </>
        ) : null}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Globe className="h-4 w-4" />
          Back to public site
        </Link>
        <div className="mt-2 border-t border-border pt-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-card shadow-lg animate-slide-up">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">Club Portal</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <Avatar initials={initialsOf(userName)} aria-hidden="true" />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}
