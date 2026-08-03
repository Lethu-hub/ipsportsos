'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { FormMessage } from '@/components/ui/form-message';
import { Skeleton } from '@/components/ui/skeleton';
import type { Athlete, AthleteVisibility, Team } from '@/types/database';

interface SquadManagerProps {
  organizationId: string;
  initialTeams: Team[];
  sportId: string | null;
  canManage: boolean;
}

type AthleteRow = Athlete & {
  athlete_visibility: AthleteVisibility | null;
  athlete_team_history: { team_id: string; is_current: boolean }[];
};

const EMPTY_VISIBILITY: Omit<AthleteVisibility, 'id' | 'updated_at' | 'athlete_id'> = {
  organization_id: '',
  is_public: false,
  show_age: false,
  show_height: false,
  show_weight: false,
  show_nationality: false,
  show_statistics: false,
  show_photo: false,
  show_biography: false,
};

export function SquadManager({ organizationId, initialTeams, sportId, canManage }: SquadManagerProps) {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeams[0]?.id ?? '');
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Team creation form
  const [teamName, setTeamName] = useState('');
  const [teamCategory, setTeamCategory] = useState<'SENIOR' | 'U21' | 'ACADEMY'>('SENIOR');
  const [teamGender, setTeamGender] = useState<'MEN' | 'WOMEN' | 'MIXED'>('MEN');
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Athlete creation form
  const [athleteForm, setAthleteForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
    shirt_number: '',
    nationality: '',
    date_of_birth: '',
  });
  const [creatingAthlete, setCreatingAthlete] = useState(false);

  const loadAthletes = useCallback(async () => {
    setLoadingAthletes(true);
    const { data } = await supabase
      .from('athletes')
      .select('*, athlete_visibility(*), athlete_team_history(*)')
      .eq('organization_id', organizationId)
      .order('shirt_number', { ascending: true, nullsFirst: false });
    setAthletes((data ?? []) as AthleteRow[]);
    setLoadingAthletes(false);
  }, [organizationId, supabase]);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !sportId) return;
    setCreatingTeam(true);
    setMessage(null);

    const slug = teamName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('teams')
      .insert({ organization_id: organizationId, sport_id: sportId, name: teamName.trim(), slug, gender: teamGender, category: teamCategory })
      .select()
      .single();

    if (error) {
      setMessage({ type: 'error', text: `Could not create team: ${error.message}` });
      setCreatingTeam(false);
      return;
    }

    setTeams((prev) => [...prev, data]);
    setSelectedTeamId(data.id);
    setTeamName('');
    setCreatingTeam(false);
    setMessage({ type: 'success', text: 'Team created.' });
  }

  async function createAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId || !athleteForm.first_name.trim() || !athleteForm.last_name.trim()) return;
    setCreatingAthlete(true);
    setMessage(null);

    const insertPayload = {
      organization_id: organizationId,
      first_name: athleteForm.first_name.trim(),
      last_name: athleteForm.last_name.trim(),
      position: athleteForm.position.trim() || null,
      shirt_number: athleteForm.shirt_number ? Number(athleteForm.shirt_number) : null,
      nationality: athleteForm.nationality.trim() || null,
      date_of_birth: athleteForm.date_of_birth || null,
    };

    const { data: athlete, error } = await supabase.from('athletes').insert(insertPayload).select().single();

    if (error || !athlete) {
      setMessage({ type: 'error', text: `Could not add athlete: ${error?.message ?? 'Unknown error'}` });
      setCreatingAthlete(false);
      return;
    }

    // Link to team (current membership) + create the visibility row.
    await supabase
      .from('athlete_team_history')
      .insert({ athlete_id: athlete.id, team_id: selectedTeamId, is_current: true, start_date: new Date().toISOString().slice(0, 10) });

    const visibility: typeof EMPTY_VISIBILITY & { athlete_id: string } = {
      ...EMPTY_VISIBILITY,
      organization_id: organizationId,
      athlete_id: athlete.id,
    };
    await supabase.from('athlete_visibility').insert(visibility);

    setAthleteForm({ first_name: '', last_name: '', position: '', shirt_number: '', nationality: '', date_of_birth: '' });
    setCreatingAthlete(false);
    setMessage({ type: 'success', text: 'Athlete added to the squad.' });
    loadAthletes();
  }

  async function updateVisibility(athleteId: string, patch: { is_public: boolean }) {
    setMessage(null);
    const { error } = await supabase
      .from('athlete_visibility')
      .update(patch)
      .eq('athlete_id', athleteId);

    if (error) {
      setMessage({ type: 'error', text: `Could not update visibility: ${error.message}` });
      return;
    }
    setAthletes((prev) =>
      prev.map((a) => (a.id === athleteId ? { ...a, athlete_visibility: a.athlete_visibility ? { ...a.athlete_visibility, ...patch } : null } : a)),
    );
  }

  async function removeAthlete(athleteId: string) {
    setMessage(null);
    const { error } = await supabase.from('athletes').delete().eq('id', athleteId);
    if (error) {
      setMessage({ type: 'error', text: `Could not remove athlete: ${error.message}` });
      return;
    }
    setAthletes((prev) => prev.filter((a) => a.id !== athleteId));
    setMessage({ type: 'success', text: 'Athlete removed.' });
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const teamAthletes = athletes.filter((a) =>
    a.athlete_team_history?.some((h) => h.team_id === selectedTeamId && h.is_current),
  );

  return (
    <div className="space-y-6">
      {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}

      {/* Teams */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>Your squads within this club.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams yet — create the first one below.</p>
            ) : (
              teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    team.id === selectedTeamId ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{team.name}</span>
                  <Badge variant="muted">{team.category}</Badge>
                </button>
              ))
            )}

            {canManage && sportId ? (
              <form onSubmit={createTeam} className="space-y-3 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">New team</Label>
                  <Input id="team-name" placeholder="First Team" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="team-category">Category</Label>
                    <Select id="team-category" value={teamCategory} onChange={(e) => setTeamCategory(e.target.value as typeof teamCategory)}>
                      <option value="SENIOR">Senior</option>
                      <option value="U21">U21</option>
                      <option value="ACADEMY">Academy</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-gender">Gender</Label>
                    <Select id="team-gender" value={teamGender} onChange={(e) => setTeamGender(e.target.value as typeof teamGender)}>
                      <option value="MEN">Men</option>
                      <option value="WOMEN">Women</option>
                      <option value="MIXED">Mixed</option>
                    </Select>
                  </div>
                </div>
                <Button type="submit" size="sm" loading={creatingTeam} className="w-full">
                  <Plus className="h-4 w-4" />
                  Create team
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        {/* Athletes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Squad — {selectedTeam?.name ?? 'Select a team'}</CardTitle>
            <CardDescription>
              Add athletes and control what the public can see on the club page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAthletes ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : teamAthletes.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No athletes yet"
                description="Add your first athlete below to build the squad roster."
              />
            ) : (
              <div className="space-y-2">
                {teamAthletes.map((athlete) => {
                  const vis = athlete.athlete_visibility;
                  return (
                    <div key={athlete.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {athlete.shirt_number ?? '—'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {athlete.first_name} {athlete.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {athlete.position ?? 'Unassigned'}
                            {athlete.nationality ? ` · ${athlete.nationality}` : ''}
                          </p>
                        </div>
                        {vis?.is_public ? <Badge variant="success">Public</Badge> : <Badge variant="muted">Hidden</Badge>}
                      </div>
                      <div className="flex items-center gap-4">
                        {canManage ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={vis?.is_public ?? false}
                                onCheckedChange={(checked) => updateVisibility(athlete.id, { is_public: checked })}
                                label={`Publish ${athlete.first_name} to the public roster`}
                              />
                              <span className="text-xs text-muted-foreground">{vis?.is_public ? 'Published' : 'Publish'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAthlete(athlete.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                              aria-label={`Remove ${athlete.first_name} ${athlete.last_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {canManage && selectedTeamId ? (
              <form onSubmit={createAthlete} className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <p className="text-sm font-medium">Add athlete</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-first">First name</Label>
                    <Input id="ath-first" value={athleteForm.first_name} onChange={(e) => setAthleteForm({ ...athleteForm, first_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-last">Last name</Label>
                    <Input id="ath-last" value={athleteForm.last_name} onChange={(e) => setAthleteForm({ ...athleteForm, last_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-position">Position</Label>
                    <Input id="ath-position" placeholder="Striker, GK, Midfielder…" value={athleteForm.position} onChange={(e) => setAthleteForm({ ...athleteForm, position: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-number">Shirt number</Label>
                    <Input id="ath-number" type="number" min={1} max={99} value={athleteForm.shirt_number} onChange={(e) => setAthleteForm({ ...athleteForm, shirt_number: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-nationality">Nationality</Label>
                    <Input id="ath-nationality" placeholder="Botswana" value={athleteForm.nationality} onChange={(e) => setAthleteForm({ ...athleteForm, nationality: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ath-dob">Date of birth</Label>
                    <Input id="ath-dob" type="date" value={athleteForm.date_of_birth} onChange={(e) => setAthleteForm({ ...athleteForm, date_of_birth: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" size="sm" loading={creatingAthlete}>
                  <Plus className="h-4 w-4" />
                  Add to squad
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
