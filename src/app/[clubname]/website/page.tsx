import { requirePortalUser, hasPermission } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WebsiteManager } from '@/components/portal/website-manager';
import type { WebsitePage } from '@/types/database';
export const dynamic='force-dynamic';
export default async function ClubWebsitePage({params}:{params:{clubname:string}}){const session=await requirePortalUser();const supabase=await createClient();const {data:org}=await supabase.from('organizations').select('*').eq('slug',params.clubname).eq('status','ACTIVE').maybeSingle();if(!org)notFound();const {data:pages}=await supabase.from('website_pages').select('*').eq('organization_id',org.id).order('updated_at',{ascending:false});const canEdit=hasPermission(session.access,org.id,'website:update')||hasPermission(session.access,org.id,'website:create');const canPublish=hasPermission(session.access,org.id,'website:publish');return <div className="space-y-6"><PageHeader title="Website manager" description={`Create, review and publish the public story of ${org.name}.`}/><WebsiteManager organizationId={org.id} profileId={session.profile?.id??''} initialPages={(pages??[]) as WebsitePage[]} canEdit={canEdit} canPublish={canPublish}/></div>}
