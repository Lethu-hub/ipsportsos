import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface ClubBranding {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  banner_url: string | null;
}

interface ClubCardProps {
  name: string;
  slug: string;
  type: string;
  branding?: ClubBranding | null;
}

export function ClubCard({ name, slug, type, branding }: ClubCardProps) {
  return (
    <Link
      href={`/clubs/${slug}`}
      className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="flex h-24 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${branding?.primary_color ?? '#2563eb'} 0%, ${
            branding?.secondary_color ?? '#ffffff'
          } 100%)`,
        }}
      >
        {branding?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logo_url} alt={`${name} crest`} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-card">{name.charAt(0)}</span>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-semibold group-hover:text-primary">{name}</h3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{type.toLowerCase()}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
