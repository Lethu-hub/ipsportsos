'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Athlete, AthleteVisibility } from '@/types/database';

interface PlayerCardProps {
  athlete: Athlete;
  visibility: AthleteVisibility | null;
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function PlayerCard({ athlete, visibility }: PlayerCardProps) {
  const [flipped, setFlipped] = useState(false);
  const age = calculateAge(athlete.date_of_birth);

  const showDetails = visibility?.is_public ?? false;

  const front = (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
        {athlete.shirt_number ?? '—'}
      </div>
      <p className="mt-2 text-sm font-semibold leading-tight">
        {athlete.first_name} {athlete.last_name}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{athlete.position ?? 'Player'}</p>
    </div>
  );

  const back = (
    <div className="flex h-full flex-col justify-center gap-1.5 p-4 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile</p>
      {visibility?.show_age && age !== null ? <Detail label="Age" value={String(age)} /> : null}
      {visibility?.show_nationality && athlete.nationality ? <Detail label="Nationality" value={athlete.nationality} /> : null}
      {visibility?.show_height && athlete.height !== null ? <Detail label="Height" value={`${athlete.height} m`} /> : null}
      {visibility?.show_weight && athlete.weight !== null ? <Detail label="Weight" value={`${athlete.weight} kg`} /> : null}
      {athlete.preferred_foot ? <Detail label="Foot" value={athlete.preferred_foot.toLowerCase()} /> : null}
      {!visibility?.show_age && !visibility?.show_nationality && !visibility?.show_height && !visibility?.show_weight ? (
        <p className="text-xs text-muted-foreground">No additional details shared yet.</p>
      ) : null}
    </div>
  );

  return (
    <div className="group relative h-48">
      {/* Desktop: 3D flip */}
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        disabled={!showDetails}
        aria-label={`${athlete.first_name} ${athlete.last_name} card details`}
        className="hidden h-full w-full md:block"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative h-full w-full transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 rounded-lg border border-border bg-card shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {front}
          </div>
          <div
            className="absolute inset-0 rounded-lg border border-border bg-card shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {back}
          </div>
        </div>
      </button>

      {/* Mobile: expandable drawer */}
      <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-sm md:hidden">
        {front}
        {showDetails ? (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              className="flex w-full items-center justify-center gap-1 py-2 text-xs font-medium text-muted-foreground"
            >
              {flipped ? 'Hide details' : 'Show details'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', flipped && 'rotate-180')} />
            </button>
            {flipped ? <div className="px-4 pb-4">{back}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
