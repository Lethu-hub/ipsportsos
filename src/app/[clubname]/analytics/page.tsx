import { requirePortalUser, hasPermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartBar as BarChart3 } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/portal/analytics-dashboard';
export const dynamic='force-dynamic';
export default async function ClubAnalyticsPage({params}:{params:{clubname:string}}){const session=await requirePortalUser();const supabase=await createClient();const {data:org}=await supabase.from('organizations').select('id,name').eq('slug',params.clubname).maybeSingle();if(!org)notFound();const member=session.access.find(m=>m.organization_id===org.id);const readable=hasPermission(session.access,org.id,'analytics:read');if(!readable)return <div className="space-y-6"><PageHeader title="Analytics" description="Role-scoped club intelligence."/><EmptyState icon={<BarChart3 className="h-6 w-6"/>} title="Analytics access required" description="Ask a club administrator to grant your role analytics access."/></div>;return <div className="space-y-6"><PageHeader title="Analytics" description={`Performance intelligence for ${org.name}.`}/><AnalyticsDashboard canBuild={hasPermission(session.access,org.id,'analytics:update')} role={member?.role??'CLUB_ADMIN'}/></div>}
