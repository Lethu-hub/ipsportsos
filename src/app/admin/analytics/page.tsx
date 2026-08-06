import { requirePlatformAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { AnalyticsStudio } from '@/components/portal/admin/analytics-studio';
import { ChartBar as BarChart3, Building2, LayoutDashboard } from 'lucide-react';
export const dynamic='force-dynamic';
export default async function AdminAnalyticsPage(){await requirePlatformAdmin();const supabase=await createClient();const [definitions,widgets,dashboards]=await Promise.all([supabase.from('analytics_definitions').select('*').order('updated_at',{ascending:false}),supabase.from('analytics_widgets').select('id',{count:'exact',head:true}),supabase.from('dashboards').select('id',{count:'exact',head:true})]);return <div className="space-y-6"><PageHeader title="Analytics studio" description="Create and publish reusable analytics definitions for every club."/><div className="grid gap-4 md:grid-cols-3"><StatCard label="Definitions" value={definitions.data?.length??0} hint="Published or draft" icon={<BarChart3 className="h-4 w-4"/>}/><StatCard label="Club widgets" value={widgets.count??0} hint="Installed widgets" icon={<Building2 className="h-4 w-4"/>}/><StatCard label="Dashboards" value={dashboards.count??0} hint="Role-scoped views" icon={<LayoutDashboard className="h-4 w-4"/>}/></div><AnalyticsStudio definitions={definitions.data??[]}/></div>}
