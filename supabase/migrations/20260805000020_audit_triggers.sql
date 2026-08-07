-- ============================================================
-- IP Sports OS — 0020: audit hardening + automatic change logging
-- ============================================================
-- Sprint 1 acceptance: important platform and tenant mutations must
-- be auditable without relying on every client to remember to call an
-- RPC. This migration keeps the audit log append-only and records the
-- actor from auth.uid() when a change is made through Supabase.

-- log_action is intentionally callable only by signed-in users. The
-- original migration left the default PUBLIC execute grant in place,
-- which allowed anonymous audit-log spam.
create or replace function public.log_action(
  p_action          text,
  p_entity_type     text,
  p_entity_id       uuid default null,
  p_organization_id uuid default null,
  p_metadata        jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_profile_id uuid := public.current_profile_id();
  v_id               uuid;
begin
  if v_actor_profile_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_organization_id is not null
     and not (public.is_platform_admin() or public.is_org_member(p_organization_id)) then
    raise exception 'You cannot write audit events for this organization';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    p_organization_id,
    v_actor_profile_id,
    upper(trim(p_action)),
    lower(trim(p_entity_type)),
    p_entity_id,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_action(text, text, uuid, uuid, jsonb) from public;
grant execute on function public.log_action(text, text, uuid, uuid, jsonb) to authenticated;

-- Generic trigger function. Metadata deliberately contains only the
-- table and operation, never a full row (which could expose sensitive
-- profile or subscription data in an audit payload).
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_profile_id uuid := public.current_profile_id();
  v_organization_id  uuid;
  v_entity_id        uuid;
  v_action           text := case TG_OP
                               when 'INSERT' then 'CREATE'
                               when 'UPDATE' then 'UPDATE'
                               when 'DELETE' then 'DELETE'
                             end;
  v_metadata         jsonb := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP
  );
begin
  -- Seed scripts and trusted service operations may legitimately run
  -- without an end-user session. They should not create unattributed
  -- audit events.
  if v_actor_profile_id is null then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if TG_OP = 'DELETE' then
    v_entity_id := old.id;
  else
    v_entity_id := new.id;
  end if;

  -- Resolve the tenant for the tables that carry one. For deletes we
  -- leave the FK column null because the organization may be deleted
  -- in the same transaction; the table and entity remain in metadata.
  if TG_OP <> 'DELETE' then
    case TG_TABLE_NAME
      when 'organizations' then v_organization_id := new.id;
      when 'organization_memberships' then v_organization_id := new.organization_id;
      when 'organization_branding' then v_organization_id := new.organization_id;
      when 'teams' then v_organization_id := new.organization_id;
      when 'athletes' then v_organization_id := new.organization_id;
      when 'athlete_visibility' then v_organization_id := new.organization_id;
      when 'athlete_statistics' then v_organization_id := new.organization_id;
      when 'matches' then v_organization_id := new.organization_id;
      when 'match_events' then v_organization_id := new.organization_id;
      when 'website_pages' then v_organization_id := new.organization_id;
      when 'website_page_versions' then v_organization_id := new.organization_id;
      when 'news_items' then v_organization_id := new.organization_id;
      when 'club_page_sections' then v_organization_id := new.organization_id;
      when 'organization_subscriptions' then v_organization_id := new.organization_id;
      when 'feature_entitlements' then v_organization_id := new.organization_id;
      when 'dashboards' then v_organization_id := new.organization_id;
      when 'analytics_widgets' then v_organization_id := new.organization_id;
      else v_organization_id := null;
    end case;
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    v_organization_id,
    v_actor_profile_id,
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_metadata
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Core Sprint 1 mutations. DROP + CREATE makes this safe to re-run in a
-- development database while keeping the migration idempotent.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'sports',
    'organizations',
    'organization_memberships',
    'organization_branding',
    'teams',
    'athletes',
    'athlete_team_history',
    'athlete_visibility',
    'athlete_statistics',
    'matches',
    'match_events',
    'website_pages',
    'website_page_versions',
    'news_items',
    'club_page_sections',
    'organization_subscriptions',
    'feature_entitlements',
    'dashboards',
    'analytics_widgets'
  ] loop
    execute format('drop trigger if exists audit_%I_change on public.%I', v_table, v_table);
    execute format(
      'create trigger audit_%I_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      v_table,
      v_table
    );
  end loop;
end;
$$;

revoke all on function public.audit_row_change() from public;
