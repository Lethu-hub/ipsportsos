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

export type Database = {
  public: {
    Tables: {
      sports: {
        Row: Sport;
        Insert: Omit<Sport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Sport, 'id' | 'created_at' | 'updated_at'>>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
      };
      organization_branding: {
        Row: OrganizationBranding;
        Insert: Omit<OrganizationBranding, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrganizationBranding, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      roles: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
      };
      permissions: {
        Row: Permission;
        Insert: Omit<Permission, 'id'>;
        Update: Partial<Omit<Permission, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>;
      };
      athletes: {
        Row: Athlete;
        Insert: Omit<Athlete, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
        Update: Partial<Omit<Athlete, 'id' | 'created_at' | 'updated_at'>>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Match, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
