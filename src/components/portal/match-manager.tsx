'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Match, Team } from '@/types/database';

type MatchRow = Match & { home_team: { name: string } | null; away_team: { name: string } | null };
export function MatchManager({ organizationId, teams, initialMatches, canManage }: { organizationId:string; teams: Team[]; initialMatches: MatchRow[]; canManage:boolean }) {
 const [matches,setMatches]=useState(initialMatches); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function create(form: FormData) { setBusy(true); setError(''); const supabase=createClient(); const {data,error}=await supabase.from('matches').insert({organization_id:organizationId,home_team_id:String(form.get('home')),away_team_id:String(form.get('away')),match_date:new Date(String(form.get('date'))).toISOString(),venue:String(form.get('venue')) || null,status:'UPCOMING'}).select('*, home_team:home_team_id(name), away_team:away_team_id(name)').single(); setBusy(false); if(error){setError(error.message);return;} setMatches([data as MatchRow,...matches]);setOpen(false); }
 async function updateScore(id:string,status: 'FINISHED', form:FormData) { const supabase=createClient(); const {data,error}=await supabase.from('matches').update({status,home_score: Number(form.get('homeScore')),away_score:Number(form.get('awayScore'))}).eq('id',id).select('*, home_team:home_team_id(name), away_team:away_team_id(name)').single(); if(error){setError(error.message);return};setMatches(matches.map(m=>m.id===id?data as MatchRow:m)); }
 return <div className="space-y-5">
  {canManage && <div className="flex justify-end"><Button onClick={()=>setOpen(!open)}>{open?'Close':'Schedule fixture'}</Button></div>}
  {open && <form action={create} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2"><div><Label>Home team</Label><Select name="home" required><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</Select></div><div><Label>Away team</Label><Select name="away" required><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</Select></div><div><Label>Date & time</Label><Input name="date" type="datetime-local" required /></div><div><Label>Venue</Label><Input name="venue" placeholder="Club ground" /></div><div className="md:col-span-2"><Button disabled={busy}>{busy?'Scheduling…':'Schedule fixture'}</Button></div></form>}
  {error && <p className="text-sm text-destructive">{error}</p>}
  <div className="overflow-hidden rounded-lg border bg-card">{matches.length===0?<p className="p-10 text-center text-sm text-muted-foreground">No fixtures scheduled. Create your first match to start tracking performance.</p>:<div className="divide-y">{matches.map(m=><div key={m.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-medium">{m.home_team?.name ?? 'Home'} <span className="text-muted-foreground">vs</span> {m.away_team?.name ?? 'Away'}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(m.match_date).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}{m.venue?` · ${m.venue}`:''}</p></div><div className="flex items-center gap-3"><Badge variant={m.status==='FINISHED'?'success':m.status==='LIVE'?'warning':'info'}>{m.status.toLowerCase()}</Badge>{m.status==='FINISHED'&&<strong>{m.home_score} – {m.away_score}</strong>}{canManage && <form action={(f)=>updateScore(m.id,'FINISHED',f)} className="flex items-center gap-1"><Input name="homeScore" type="number" min="0" defaultValue={m.home_score??0} className="h-8 w-14"/><span>–</span><Input name="awayScore" type="number" min="0" defaultValue={m.away_score??0} className="h-8 w-14"/><Button size="sm" variant="outline">Result</Button></form>}</div></div>)}</div>}</div>
 </div>
}
