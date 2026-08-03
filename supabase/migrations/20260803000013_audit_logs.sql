-- ============================================================
-- IP Sports OS — 0013: audit_logs (append-only)
-- ============================================================

create table if not exists public.audit_logs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid references public.organizations(id),
  actor_profile_id  uuid references public.profiles(id),
  action            text not null,
  entity_type       text not null,
  entity_id         uuid,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  ip_address        text,
  session_id        text
);

create index audit_logs_organization_id_idx on public.audit_logs(organization_id);
create index audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

alter table public.audit_logs enable row level security;

-- Append-only: authenticated users may insert audit records (the app
-- writes them via security-definer helpers), platform administrators
-- may read them. No UPDATE or DELETE policies exist.

create policy "audit_logs_authenticated_insert" on public.audit_logs
  for insert
  to authenticated
  with check (true);

create policy "audit_logs_platform_read" on public.audit_logs
  for select
  to authenticated
  using (public.is_platform_admin());

-- ------------------------------------------------------------
-- Convenience helper: write an audit record for the current user.
-- Security definer so callers cannot be blocked by RLS on insert;
-- the table remains append-only because no update/delete policies exist.
-- ------------------------------------------------------------
create or replace function public.log_action(
  p_action        text,
  p_entity_type   text,
  p_entity_id     uuid default null,
  p_organization_id uuid default null,
  p_metadata      jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    p_organization_id,
    public.current_profile_id(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;
