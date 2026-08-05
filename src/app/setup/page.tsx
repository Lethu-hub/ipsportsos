import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Setup required — IP Sports OS',
};

export default function SetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <section className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">IP Sports OS</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Supabase connection required</h1>
        <p className="mt-3 text-muted-foreground">
          This deployment is missing the Supabase environment variables required to load the application data.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">Add these variables in Vercel:</p>
          <pre className="mt-3 overflow-x-auto text-sm text-foreground">
            <code>{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key`}</code>
          </pre>
        </div>

        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Open the Vercel project and go to Settings → Environment Variables.</li>
          <li>Add both variables for Production (and Preview if you use preview deployments).</li>
          <li>Redeploy the project after saving the variables.</li>
        </ol>

        <p className="mt-6 text-sm text-muted-foreground">
          The database migrations must also be applied to the Supabase project before the portal can be used. See the{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            public site
          </Link>{' '}
          after redeploying.
        </p>
      </section>
    </main>
  );
}
