// ============================================================
// IP Sports OS — typed Supabase schema (hand-maintained mirror of
// supabase/migrations, generated from database-schema-spec.md)
// ============================================================

export type Sport = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  organization_type: 'CLUB' | 'LEAGUE' | 'ACADEMY' | 'ASSOCIATION';
  sport_id: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  subscription_status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type OrganizationBranding = {
  id: string;
  organization_id: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  logo_url: string | null;
  banner_url: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  email: string;
  username?: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: string;
  name: string;
  scope: 'PLATFORM' | 'ORGANIZATION';
  description: string | null;
  is_system_role: boolean;
  created_at: string;
};

export type Permission = {
  id: string;
  key: string;
  description: string | null;
  module: string;
  action: string;
};

export type OrganizationMembership = {
  id: string;
  organization_id: string | null;
  profile_id: string;
  role_id: string;
  status: 'ACTIVE' | 'INVITED' | 'REMOVED';
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  organization_id: string;
  sport_id: string;
  name: string;
  slug: string;
  gender: 'MEN' | 'WOMEN' | 'MIXED' | null;
  category: 'SENIOR' | 'U21' | 'ACADEMY' | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Competition = {
  id: string;
  sport_id: string;
  owner_organization_id: string | null;
  name: string;
  country: string | null;
  slug: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  created_at: string;
  updated_at: string;
};

export type CompetitionParticipant = {
  id: string;
  competition_id: string;
  team_id: string;
  season_id: string;
  created_at: string;
};

export type Season = {
  id: string;
  organization_id: string;
  competition_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export type Athlete = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  shirt_number: number | null;
  height: number | null;
  weight: number | null;
  preferred_foot: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  photo_url: string | null;
  biography: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AthleteTeamHistory = {
  id: string;
  athlete_id: string;
  team_id: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
};

export type AthleteVisibility = {
  id: string;
  athlete_id: string;
  organization_id: string;
  is_public: boolean;
  show_age: boolean;
  show_height: boolean;
  show_weight: boolean;
  show_nationality: boolean;
  show_statistics: boolean;
  show_photo: boolean;
  show_biography: boolean;
  updated_at: string;
};

export type AthleteStatistics = {
  id: string;
  organization_id: string;
  athlete_id: string;
  season_id: string | null;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  organization_id: string;
  competition_id: string | null;
  season_id: string | null;
  home_team_id: string;
  away_team_id: string;
  venue: string | null;
  match_date: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  home_score: number | null;
  away_score: number | null;
  created_at: string;
  updated_at: string;
};

export type EventType = {
  id: string;
  sport_id: string;
  name: string;
  code: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
};

export type MatchEvent = {
  id: string;
  organization_id: string;
  match_id: string;
  athlete_id: string | null;
  event_type_id: string;
  minute: number | null;
  description: string | null;
  created_at: string;
};

export type WebsitePage = {
  id: string;
  organization_id: string;
  team_id: string | null;
  slug: string;
  section_key: string;
  title: string | null;
  body: string | null;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE' | 'MEMBERS_ONLY';
  published_version_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type NewsItem = {
  id: string;
  organization_id: string;
  team_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ClubPageSection = {
  id: string;
  organization_id: string;
  section_type: 'history' | 'squad' | 'sponsors' | 'news' | 'stadium';
  enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_organizations: number | null;
  max_teams: number | null;
  max_users: number | null;
  analytics_widget_limit: number | null;
  content_publish_limit: number | null;
  is_active: boolean;
  created_at: string;
};

export type OrganizationSubscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  started_at: string;
  ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

export type FeatureEntitlement = {
  id: string;
  organization_id: string;
  feature_key: string;
  enabled: boolean;
  limit_value: number | null;
  expires_at: string | null;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalyticsDefinition = {
  id: string;
  name: string;
  definition: Record<string, unknown>;
  allowed_roles: unknown;
  sport_id: string;
  created_by: string;
  status: 'DRAFT' | 'PUBLISHED';
  created_at: string;
  updated_at: string;
};

export type AnalyticsWidget = {
  id: string;
  organization_id: string | null;
  analytics_definition_id: string;
  name: string;
  category: 'PERFORMANCE' | 'PLAYER' | 'FORM';
  widget_type: 'line_chart' | 'bar_chart' | 'table';
  status: 'DRAFT' | 'PUBLISHED';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Dashboard = {
  id: string;
  organization_id: string;
  team_id: string | null;
  name: string;
  role_scope: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DashboardWidget = {
  id: string;
  dashboard_id: string;
  widget_id: string;
  position: number;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string | null;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  session_id: string | null;
};

// ------------------------------------------------------------
// Composite / app-level types
// ------------------------------------------------------------

/** One entry of the get_my_access RPC — a membership with its role
 * and resolved permission keys (drives role-aware navigation). */
export type AccessMembership = {
  membership_id: string;
  organization_id: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  organization_type: string | null;
  role: string;
  role_scope: 'PLATFORM' | 'ORGANIZATION';
  permissions: string[];
};

export type TeamWithOrg = Team & { organizations: Pick<Organization, 'name' | 'slug'> };
export type AthleteWithVisibility = Athlete & { athlete_visibility: AthleteVisibility | null };
export type AthleteWithStats = Athlete & {
  athlete_visibility: AthleteVisibility | null;
  athlete_statistics: AthleteStatistics[];
};

// ------------------------------------------------------------
// Database type for createClient<Database>
// ------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      sports: {
        Row: Sport;
        Insert: Partial<Omit<Sport, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Sport, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'organizations_sport_id_fkey', columns: ['sport_id'], isOneToOne: false, referencedRelation: 'sports', referencedColumns: ['id'] },
        { foreignKeyName: 'organization_branding_organization_id_fkey', columns: ['organization_id'], isOneToOne: true, referencedRelation: 'organization_branding', referencedColumns: ['organization_id'] },
        { foreignKeyName: 'organization_subscriptions_organization_id_fkey', columns: ['organization_id'], isOneToOne: true, referencedRelation: 'organization_subscriptions', referencedColumns: ['organization_id'] }
        ];
      };
      organization_branding: {
        Row: OrganizationBranding;
        Insert: Partial<Omit<OrganizationBranding, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<OrganizationBranding, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'organization_branding_organization_id_fkey', columns: ['organization_id'], isOneToOne: true, referencedRelation: 'organizations', referencedColumns: ['id'] }
        ];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'profiles_auth_user_id_fkey', columns: ['auth_user_id'], isOneToOne: true, referencedRelation: 'auth.users', referencedColumns: ['id'] }
        ];
      };
      roles: {
        Row: Role;
        Insert: Partial<Omit<Role, 'id' | 'created_at'>>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
        Relationships: [];
      };
      permissions: {
        Row: Permission;
        Insert: Partial<Omit<Permission, 'id'>>;
        Update: Partial<Omit<Permission, 'id'>>;
        Relationships: [];
      };
      role_permissions: {
        Row: { role_id: string; permission_id: string };
        Insert: Partial<{ role_id: string; permission_id: string }>;
        Update: Partial<{ role_id: string; permission_id: string }>;
        Relationships: [
        { foreignKeyName: 'role_permissions_role_id_fkey', columns: ['role_id'], isOneToOne: false, referencedRelation: 'roles', referencedColumns: ['id'] },
        { foreignKeyName: 'role_permissions_permission_id_fkey', columns: ['permission_id'], isOneToOne: false, referencedRelation: 'permissions', referencedColumns: ['id'] }
        ];
      };
      organization_memberships: {
        Row: OrganizationMembership;
        Insert: Partial<Omit<OrganizationMembership, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<OrganizationMembership, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'organization_memberships_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'organization_memberships_profile_id_fkey', columns: ['profile_id'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] },
        { foreignKeyName: 'organization_memberships_role_id_fkey', columns: ['role_id'], isOneToOne: false, referencedRelation: 'roles', referencedColumns: ['id'] },
        { foreignKeyName: 'organization_memberships_invited_by_fkey', columns: ['invited_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      teams: {
        Row: Team;
        Insert: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'teams_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'teams_sport_id_fkey', columns: ['sport_id'], isOneToOne: false, referencedRelation: 'sports', referencedColumns: ['id'] }
        ];
      };
      competitions: {
        Row: Competition;
        Insert: Partial<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'competitions_sport_id_fkey', columns: ['sport_id'], isOneToOne: false, referencedRelation: 'sports', referencedColumns: ['id'] },
        { foreignKeyName: 'competitions_owner_organization_id_fkey', columns: ['owner_organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] }
        ];
      };
      competition_participants: {
        Row: CompetitionParticipant;
        Insert: Partial<Omit<CompetitionParticipant, 'id' | 'created_at'>>;
        Update: Partial<Omit<CompetitionParticipant, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'competition_participants_competition_id_fkey', columns: ['competition_id'], isOneToOne: false, referencedRelation: 'competitions', referencedColumns: ['id'] },
        { foreignKeyName: 'competition_participants_team_id_fkey', columns: ['team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] },
        { foreignKeyName: 'competition_participants_season_id_fkey', columns: ['season_id'], isOneToOne: false, referencedRelation: 'seasons', referencedColumns: ['id'] }
        ];
      };
      seasons: {
        Row: Season;
        Insert: Partial<Omit<Season, 'id' | 'created_at'>>;
        Update: Partial<Omit<Season, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'seasons_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'seasons_competition_id_fkey', columns: ['competition_id'], isOneToOne: false, referencedRelation: 'competitions', referencedColumns: ['id'] }
        ];
      };
      athletes: {
        Row: Athlete;
        Insert: Partial<Omit<Athlete, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Omit<Athlete, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'athletes_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'athlete_visibility_athlete_id_fkey', columns: ['athlete_id'], isOneToOne: true, referencedRelation: 'athlete_visibility', referencedColumns: ['athlete_id'] }
        ];
      };
      athlete_team_history: {
        Row: AthleteTeamHistory;
        Insert: Partial<Omit<AthleteTeamHistory, 'id' | 'created_at'>>;
        Update: Partial<Omit<AthleteTeamHistory, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'athlete_team_history_athlete_id_fkey', columns: ['athlete_id'], isOneToOne: false, referencedRelation: 'athletes', referencedColumns: ['id'] },
        { foreignKeyName: 'athlete_team_history_team_id_fkey', columns: ['team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] }
        ];
      };
      athlete_visibility: {
        Row: AthleteVisibility;
        Insert: Partial<Omit<AthleteVisibility, 'id' | 'updated_at'>>;
        Update: Partial<Omit<AthleteVisibility, 'id' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'athlete_visibility_athlete_id_fkey', columns: ['athlete_id'], isOneToOne: true, referencedRelation: 'athletes', referencedColumns: ['id'] },
        { foreignKeyName: 'athlete_visibility_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] }
        ];
      };
      athlete_statistics: {
        Row: AthleteStatistics;
        Insert: Partial<Omit<AthleteStatistics, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<AthleteStatistics, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'athlete_statistics_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'athlete_statistics_athlete_id_fkey', columns: ['athlete_id'], isOneToOne: false, referencedRelation: 'athletes', referencedColumns: ['id'] },
        { foreignKeyName: 'athlete_statistics_season_id_fkey', columns: ['season_id'], isOneToOne: false, referencedRelation: 'seasons', referencedColumns: ['id'] }
        ];
      };
      matches: {
        Row: Match;
        Insert: Partial<Omit<Match, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Match, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'matches_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'matches_competition_id_fkey', columns: ['competition_id'], isOneToOne: false, referencedRelation: 'competitions', referencedColumns: ['id'] },
        { foreignKeyName: 'matches_season_id_fkey', columns: ['season_id'], isOneToOne: false, referencedRelation: 'seasons', referencedColumns: ['id'] },
        { foreignKeyName: 'matches_home_team_id_fkey', columns: ['home_team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] },
        { foreignKeyName: 'matches_away_team_id_fkey', columns: ['away_team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] }
        ];
      };
      event_types: {
        Row: EventType;
        Insert: Partial<Omit<EventType, 'id' | 'created_at'>>;
        Update: Partial<Omit<EventType, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'event_types_sport_id_fkey', columns: ['sport_id'], isOneToOne: false, referencedRelation: 'sports', referencedColumns: ['id'] }
        ];
      };
      match_events: {
        Row: MatchEvent;
        Insert: Partial<Omit<MatchEvent, 'id' | 'created_at'>>;
        Update: Partial<Omit<MatchEvent, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'match_events_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'match_events_match_id_fkey', columns: ['match_id'], isOneToOne: false, referencedRelation: 'matches', referencedColumns: ['id'] },
        { foreignKeyName: 'match_events_athlete_id_fkey', columns: ['athlete_id'], isOneToOne: false, referencedRelation: 'athletes', referencedColumns: ['id'] },
        { foreignKeyName: 'match_events_event_type_id_fkey', columns: ['event_type_id'], isOneToOne: false, referencedRelation: 'event_types', referencedColumns: ['id'] }
        ];
      };
      website_pages: {
        Row: WebsitePage;
        Insert: Partial<Omit<WebsitePage, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<WebsitePage, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'website_pages_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'website_pages_team_id_fkey', columns: ['team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] },
        { foreignKeyName: 'website_pages_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      website_page_versions: {
        Row: {
            id: string;
            website_page_id: string;
            organization_id: string;
            version_number: number;
            title: string | null;
            body: string | null;
            status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
            created_by: string;
            created_at: string;
            published_at: string | null;
          };
        Insert: Partial<Omit<{
            id: string;
            website_page_id: string;
            organization_id: string;
            version_number: number;
            title: string | null;
            body: string | null;
            status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
            created_by: string;
            created_at: string;
            published_at: string | null;
          }, 'id' | 'created_at'>>;
        Update: Partial<{
            id: string;
            website_page_id: string;
            organization_id: string;
            version_number: number;
            title: string | null;
            body: string | null;
            status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
            created_by: string;
            created_at: string;
            published_at: string | null;
          }>;
        Relationships: [
        { foreignKeyName: 'website_page_versions_website_page_id_fkey', columns: ['website_page_id'], isOneToOne: false, referencedRelation: 'website_pages', referencedColumns: ['id'] },
        { foreignKeyName: 'website_page_versions_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'website_page_versions_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      news_items: {
        Row: NewsItem;
        Insert: Partial<Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'news_items_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'news_items_team_id_fkey', columns: ['team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] },
        { foreignKeyName: 'news_items_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      club_page_sections: {
        Row: ClubPageSection;
        Insert: Partial<Omit<ClubPageSection, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<ClubPageSection, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'club_page_sections_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] }
        ];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Partial<Omit<SubscriptionPlan, 'id' | 'created_at'>>;
        Update: Partial<Omit<SubscriptionPlan, 'id' | 'created_at'>>;
        Relationships: [];
      };
      organization_subscriptions: {
        Row: OrganizationSubscription;
        Insert: Partial<Omit<OrganizationSubscription, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<OrganizationSubscription, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'organization_subscriptions_organization_id_fkey', columns: ['organization_id'], isOneToOne: true, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'organization_subscriptions_plan_id_fkey', columns: ['plan_id'], isOneToOne: false, referencedRelation: 'subscription_plans', referencedColumns: ['id'] }
        ];
      };
      feature_entitlements: {
        Row: FeatureEntitlement;
        Insert: Partial<Omit<FeatureEntitlement, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<FeatureEntitlement, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'feature_entitlements_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'feature_entitlements_granted_by_fkey', columns: ['granted_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      analytics_definitions: {
        Row: AnalyticsDefinition;
        Insert: Partial<Omit<AnalyticsDefinition, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<AnalyticsDefinition, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'analytics_definitions_sport_id_fkey', columns: ['sport_id'], isOneToOne: false, referencedRelation: 'sports', referencedColumns: ['id'] },
        { foreignKeyName: 'analytics_definitions_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      analytics_widgets: {
        Row: AnalyticsWidget;
        Insert: Partial<Omit<AnalyticsWidget, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<AnalyticsWidget, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'analytics_widgets_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'analytics_widgets_analytics_definition_id_fkey', columns: ['analytics_definition_id'], isOneToOne: false, referencedRelation: 'analytics_definitions', referencedColumns: ['id'] },
        { foreignKeyName: 'analytics_widgets_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      dashboards: {
        Row: Dashboard;
        Insert: Partial<Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
        { foreignKeyName: 'dashboards_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'dashboards_team_id_fkey', columns: ['team_id'], isOneToOne: false, referencedRelation: 'teams', referencedColumns: ['id'] },
        { foreignKeyName: 'dashboards_created_by_fkey', columns: ['created_by'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
      dashboard_widgets: {
        Row: DashboardWidget;
        Insert: Partial<Omit<DashboardWidget, 'id' | 'created_at'>>;
        Update: Partial<Omit<DashboardWidget, 'id' | 'created_at'>>;
        Relationships: [
        { foreignKeyName: 'dashboard_widgets_dashboard_id_fkey', columns: ['dashboard_id'], isOneToOne: false, referencedRelation: 'dashboards', referencedColumns: ['id'] },
        { foreignKeyName: 'dashboard_widgets_widget_id_fkey', columns: ['widget_id'], isOneToOne: false, referencedRelation: 'analytics_widgets', referencedColumns: ['id'] }
        ];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<Omit<AuditLog, 'id' | 'created_at'>>;
        Update: never;
        Relationships: [
        { foreignKeyName: 'audit_logs_organization_id_fkey', columns: ['organization_id'], isOneToOne: false, referencedRelation: 'organizations', referencedColumns: ['id'] },
        { foreignKeyName: 'audit_logs_actor_profile_id_fkey', columns: ['actor_profile_id'], isOneToOne: false, referencedRelation: 'profiles', referencedColumns: ['id'] }
        ];
      };
    };
    Views: {};
    Functions: {
      create_staff_user: {
        Args: {
          p_organization_id: string | null;
          p_role_name: string;
          p_email: string;
          p_password: string;
          p_first_name?: string | null;
          p_last_name?: string | null;
          p_username?: string | null;
        };
        Returns: string;
      };
      resolve_login_email: {
        Args: {
          p_identifier: string;
        };
        Returns: string | null;
      };
      get_my_access: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      log_action: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string | null;
          p_organization_id?: string | null;
          p_metadata?: Record<string, unknown> | null;
        };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
