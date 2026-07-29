export default function PortalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your club portal.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Players', value: '—', hint: 'Squad size' },
          { label: 'Upcoming Fixtures', value: '—', hint: 'Next 7 days' },
          { label: 'Recent Results', value: '—', hint: 'Last 5 matches' },
          { label: 'Published Pages', value: '—', hint: 'Live on public site' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Getting Started</h2>
        <p className="text-sm text-muted-foreground">Sprint 1 is in progress. Authentication, squad management, match management, and the website editor will be built here. Database migrations are next.</p>
      </div>
    </div>
  );
}
