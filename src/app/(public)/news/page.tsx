import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Newspaper } from 'lucide-react';

export const metadata = {
  title: 'News — IP Sports OS',
};

export default async function NewsPage() {
  const supabase = await createClient();

  const { data: news } = await supabase
    .from('news_items')
    .select('*, organizations(name, slug)')
    .eq('status', 'PUBLISHED')
    .eq('visibility', 'PUBLIC')
    .order('published_at', { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader title="News" description="Latest stories from across the league." className="mb-8" />
      {news && news.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item) => {
            const org = item.organizations as unknown as { name: string; slug: string } | null;
            return (
              <article key={item.id} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {org ? (
                    <a href={`/clubs/${org.slug}`} className="font-medium text-primary hover:underline">
                      {org.name}
                    </a>
                  ) : (
                    'News'
                  )}
                  {item.published_at ? ` · ${new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                {item.summary ? <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.summary}</p> : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Newspaper className="h-6 w-6" />} title="No news yet" description="Published news from clubs will appear here." />
      )}
    </div>
  );
}
