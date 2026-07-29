import Link from 'next/link';
import { LayoutDashboard, Users, Trophy, BarChart3, Globe, Settings, LogOut } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="font-semibold">IP Sports OS</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <PortalNavLink href="/portal" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
          <PortalNavLink href="/portal/squad" icon={<Users className="h-4 w-4" />} label="Squad" />
          <PortalNavLink href="/portal/matches" icon={<Trophy className="h-4 w-4" />} label="Matches" />
          <PortalNavLink href="/portal/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
          <PortalNavLink href="/portal/website" icon={<Globe className="h-4 w-4" />} label="Website" />
          <PortalNavLink href="/portal/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        </nav>
        <div className="border-t border-border p-4">
          <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Back to public site
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <h2 className="text-lg font-semibold">Club Portal</h2>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">A</div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function PortalNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {icon}
      {label}
    </Link>
  );
}
