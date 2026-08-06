import { requirePortalUser, hasPermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { MatchManager } from '@/components/portal/match-manager';
import { notFound } from 'next/navigation';
import type { Match, Team } from '@/types/database';
export const dynamic = 'force-dynamic';
export default async function ClubMatchesPage({ params }: {params:{clubname:string}}) { const session=await requirePortalUser();const supabase=await createClient();const {data:org}=await supabase.from('organizations').select('*').eq('slug',params.clubname).eq('status','ACTIVE').maybeSingle();if(!org)notFound();const [teamsResult,matchesResult]=await Promise.all([supabase.from('teams').select('*').eq('organization_id',org.id).eq('is_active',true).order('name'),supabase.from('matches').select('*, home_team:home_team_id(name), away_team:away_team_id(name)').eq('organization_id',org.id).order('match_date',{ascending:false})]);const canManage=hasPermission(session.access,org.id,'matches:create')||hasPermission(session.access,org.id,'matches:update');return <div className="space-y-6"><PageHeader title="Match centre" description={`Schedule fixtures, record results, and keep ${org.name} match-ready.`}/><MatchManager organizationId={org.id} teams={(teamsResult.data??[]) as Team[]} initialMatches={(matchesResult.data??[]) as unknown as Array<Match & {home_team:{name:string}|null;away_team:{name:string}|null}>} canManage={canManage}/></div> }
