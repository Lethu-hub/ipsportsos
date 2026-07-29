

CLAUDE.md
IP SPORTS OS
AI Development Rules & Project Context
Version 1.0

1. Project Identity
You are working on IP Sports OS.
IP Sports OS is a multi-tenant sports operating system designed to help sports organisations manage operations, publish public information, analyse performance, and use AI-powered insights.
The first sport implementation is football (soccer), but the architecture must support expansion into:
Basketball
Netball
Rugby
Volleyball
Other sports
Do not build a football-only application.

2. Core Product Philosophy
The platform has two connected worlds.
Public World
For:
Fans
Supporters
Sponsors
Media
Investors
General users
Purpose:
Discover sports.

Private World
For:
Clubs
Coaches
Analysts
Scouts
Medical staff
Administrators
Purpose:
Manage sports organisations.

The platform connects:
Fans

↓

Teams

↓

Athletes

↓

Data

↓

Analytics

↓

AI Insights


3. Non-Negotiable Architecture Rules
Rule 1: Multi-Tenant First
Every organisation must have isolated data.
Never create features that assume one club.
Wrong:
players
matches
analytics

Correct:
organizations

teams

players

matches

analytics

Every organisation-owned record must have an ownership relationship.

Rule 2: Do Not Hardcode Football
Avoid:
FootballPlayer
FootballMatch
FootballClub

Use:
Athlete

Match

Organisation

Team

Sport should be a property.

Rule 3: Role-Based Access Control
Never hide features only through frontend logic.
Permissions must exist at:
Database level
API level
Frontend level

4. Technology Rules
Required stack:
Frontend:
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Backend:
Next.js backend services
Database:
PostgreSQL
Supabase
Hosting:
Vercel
Authentication:
Supabase Auth

5. Code Quality Rules
TypeScript
Use strict TypeScript.
Avoid:
any

unless there is a strong reason.

Components
Create reusable components.
Wrong:
MatebelePlayerCard.tsx

Correct:
PlayerCard.tsx


File Organisation
Use feature-based structure.
Example:
features/

players/

matches/

analytics/

teams/

Do not put everything into:
components/


6. Database Rules
Database changes must be planned.
Before creating tables ask:
Does this support multiple organisations?
Does this support future sports?
Does this require permissions?
Does this information belong in a separate entity?

Do not store:
Calculated statistics
Temporary analytics
AI recommendations
inside core athlete records.
Keep separate tables.

7. Public Platform Rules
The public experience is designed for discovery.
The homepage should contain:
Competitions
Fixtures
Results
Standings
News
Featured teams
Featured athletes
There should NOT be:
Login buttons
Club management links
Internal analytics

8. Club Public Website Rules
Every organisation receives a public profile.
Example:
ipsportsos.com/team/matebelefc

The club controls:
History
Images
Sponsors
Squad visibility
Player information
News

Important:
Public information uses a publishing workflow.
Never immediately expose edits.
Required workflow:
Edit

↓

Save Draft

↓

Preview

↓

Publish

↓

Public Update


9. Private Portal Rules
Private portal:
portal.ipsportsos.com/team-name

Modules:
Dashboard

Squad

Matches

Analytics

Training

Medical

Scouting

AI Insights

Website Manager

Settings


10. Analytics Rules
Analytics is not a collection of hardcoded pages.
Analytics uses a widget system.
Structure:
Analytics Widget

↓

Dashboard

↓

User Role

Examples:
Goals trend
Player comparison
Passing network
Heat maps
Injury risk
AI recommendations

11. Analytics Studio Rules
Super Admin owns analytics creation.
Super Admin can:
Create widgets
Test widgets
Publish widgets
Assign widgets to subscription levels
Roll out widgets to clubs
Do not create analytics directly inside club dashboards.

12. Dashboard Builder Rules
Clubs can customise dashboards.
Users can:
Add widgets
Remove widgets
Resize widgets
Create role-specific dashboards
Example:
Coach dashboard:
Team Form

Passing Network

Player Fitness

AI Match Review

Medical dashboard:
Injury Risk

Training Load

Recovery


13. AI Rules
AI is advisory.
AI may:
Analyse
Recommend
Summarise
Highlight patterns
AI must not:
Automatically change player data
Automatically publish content
Override staff decisions
Human approval is required.

14. UI Rules
Design principles:
Modern sports technology
Premium SaaS appearance
Mobile-first
Clean information hierarchy
Prefer:
Cards
Dashboards
Expandable sections
Animations
Avoid:
Cluttered pages
Excessive navigation
Complex menus

15. Player Card Rules
Players use interactive cards.
Front:
Photo
Name
Position
Number
Back:
Public statistics
Biography
Approved information
The club controls visibility.

16. Development Approach
Always work in phases.
Do not jump ahead.
Order:
Phase 1
Foundation
Database
Authentication
Permissions

Phase 2
Public Experience
Homepage
Teams
Players
Fixtures

Phase 3
Club Portal
Dashboard
Squad
Website Manager

Phase 4
Analytics Engine
Widgets
Dashboards
Builder

Phase 5
AI Features

17. Before Making Changes
Before writing code:
Explain:
What files will change.
Why they need changing.
Possible side effects.
For large changes:
Provide a plan first.

18. Never Do This
Do not:
❌ Rewrite the entire application for small fixes.
❌ Duplicate components.
❌ Remove existing features without approval.
❌ Change database structures casually.
❌ Build temporary solutions that prevent scaling.

19. When Unsure
Ask:
"Does this decision support IP Sports OS becoming a multi-sport SaaS platform?"
If no:
Choose another approach.

20. Project North Star
Everything built must support this vision:
IP Sports OS is the digital operating system where sports organisations operate, fans connect, athletes are represented, and data drives better decisions.

END CLAUDE.MD

I would put this file in the root of the repository:
IP-Sports-OS/

├── CLAUDE.md   ⭐
├── package.json
├── src/
├── public/
├── supabase/
└── README.md

Then every Claude Code session starts with the same understanding.

One more thing I would add before we code: a MVP scope document.
Because right now our vision is huge (which is good), but the first build should probably be:
"IP Soccer OS Beta — One Sport, One League, Three Clubs."
That would let you demonstrate the full ecosystem without trying to build FIFA's entire backend in version one 😂.
The MVP document will define exactly what gets built first and what gets parked for later.



Perfect. This is the document that keeps us from accidentally trying to build FIFA + Opta + Power BI + a ticketing platform + a social network in version one 😂.
The vision stays huge, but the MVP proves the core loop:
A club joins → gets a digital home → manages information → fans discover it → staff use data.

IP SPORTS OS
MVP Scope Document
IP Soccer OS Beta
Version 1.0

1. MVP Objective
The purpose of the MVP is to validate that IP Sports OS can successfully connect:
Public Football Experience

Club Management Platform

Analytics Foundation
into one working ecosystem.
The MVP should demonstrate:
A fan can discover football.
A club can manage its digital identity.
Staff can manage team data.
Analytics can provide useful insights.
IP can onboard multiple clubs.

2. MVP Target Market
Initial focus:
Football Clubs
Starting with:
Botswana football clubs
Semi-professional clubs
Professional clubs
Academies
The platform should support expansion later.

3. MVP Users
Public User
(Fan)
Can:
✅ View football homepage
✅ View leagues
✅ View fixtures
✅ View results
✅ Browse clubs
✅ View squad
✅ View player cards
✅ View live match information
✅ Purchase tickets through IP Tickets link
Cannot:
❌ Edit information
❌ Access club systems

Club Administrator
Can:
✅ Manage club profile
✅ Add/edit players
✅ Add fixtures
✅ Publish website updates
✅ Manage staff accounts
✅ View analytics dashboard

Club Analyst/Coach
Can:
✅ View analytics
✅ View squad data
✅ View match data

IP Super Admin
Can:
✅ Create clubs
✅ Suspend clubs
✅ Manage subscriptions
✅ Create analytics widgets
✅ Control platform settings

4. MVP Features

MODULE 1
Public Football Portal
Priority: MUST HAVE
Purpose:
The front door of IP Sports OS.

Homepage
Sections:
Hero
Example:
Your home for football intelligence.

Fixtures
Shows:
Upcoming matches
Teams
Date
Venue
Status

Results
Shows:
Previous matches
Scores
Competition

League Table
Shows:
Position
Played
Wins
Draws
Losses
Points

Featured Clubs
Cards:
Logo

Club Name

League

Position


Football News
Basic MVP:
Title
Image
Summary

MODULE 2
Club Public Pages
Priority: MUST HAVE
Every club receives:
ipsportsos.com/team/{club-name}


Club Header
Contains:
Logo
Cover image
Colours
Club name

About Section
Club controls:
History
Description
Location
Stadium

Squad Section
Interactive player cards.

Fixtures
Season fixtures.

Results
Previous games.

Sponsors
Optional.

News
Optional.

MODULE 3
Player Cards
Priority: MUST HAVE
Interactive flip cards.

Front:
Photo

Name

Position

Number


Back:
Age

Nationality

Height

Basic Statistics


Visibility controlled by club.

MODULE 4
Club Portal
Priority: MUST HAVE
Private environment.

Navigation:
Dashboard

Squad

Matches

Analytics

Website

Settings


Dashboard
Shows:
Upcoming fixtures
Recent results
Squad overview
Quick statistics

Squad Management
Club staff can:
Create player
Edit player
Upload photo
Assign position
Manage visibility

Match Management
Staff can:
Create fixtures
Add results
Add match events

Website Manager
Critical feature.
Allows clubs to control public information.

Workflow:
Create/Edit

↓

Save Draft

↓

Preview

↓

Publish


MODULE 5
Analytics Foundation
Priority: MUST HAVE
Not advanced analytics yet.
The MVP builds the engine.

Initial widgets:
Team Performance
Wins
Draws
Losses
Goals scored
Goals conceded

Player Contribution
Appearances
Goals
Assists

Form Tracker
Last 5 matches.

MODULE 6
Analytics Studio
Priority: SHOULD HAVE
Super Admin feature.

MVP version:
IP Admin can:
Create chart widgets.
Example:
Widget Name

Chart Type

Data Source

Available To


Publish:
All Clubs

Selected Clubs


MODULE 7
AI Features
Priority: LATER
Do not build full AI immediately.
MVP placeholder:
AI Insights section.
Example:
Coming soon:

AI Match Analysis

AI Player Recommendations

AI Tactical Insights


Reason:
AI needs reliable data first.

MODULE 8
Ticket Integration
Priority: SHOULD HAVE
Do not build ticketing.
Integrate.

Fixture:
Matebele FC vs Rollers

[Live Match]

[Buy Ticket]

Buy Ticket:
→ IP Tickets

5. NOT IN MVP
These are future phases.

Advanced Analytics
Later:
Heat maps
Expected goals
Passing networks
Pressing intensity
Player chemistry

AI Coach
Later:
Tactical suggestions
Recruitment recommendations
Automated reports

Medical System
Later:
Injury tracking
Recovery
Player workload

Scouting System
Later:
Talent database
Scout reports
Recruitment pipeline

Mobile Applications
Later:
iOS
Android

Multi-Sport Expansion
Later:
Basketball
Rugby
Netball

6. MVP Database Requirements
Must support:
Sports

Organisations

Teams

Users

Roles

Players

Matches

Competitions

Seasons

Statistics

Website Content

Analytics Widgets

Dashboards


7. MVP Success Criteria
The MVP is successful if:
Fan Experience
A user can:
Visit IP Sports OS.
Browse football information.
Find a club.
View the club page.
View players.
View fixtures.

Club Experience
A club can:
Receive an account.
Login.
Add players.
Add fixtures.
Update public information.
Publish changes.
View analytics.

IP Experience
IP can:
Add clubs.
Manage subscriptions.
Create analytics widgets.
Control platform access.

8. MVP Development Roadmap
Sprint 1
Foundation
Build:
Repository
Next.js setup
Supabase
Authentication
Roles
Database

Sprint 2
Public Football Portal
Build:
Homepage
Fixtures
Teams
League tables
Public pages

Sprint 3
Club Portal
Build:
Dashboard
Squad
Match management
Website editor

Sprint 4
Analytics
Build:
Statistics engine
Widgets
Dashboard display

Sprint 5
Admin Tools
Build:
Club management
Analytics Studio

Sprint 6
Polish
Improve:
Mobile experience
Animations
Performance
UX

9. First Demonstration Version
The first investor/demo version should tell this story:

A fan opens IP Sports OS.
↓
They see football fixtures and leagues.
↓
They click Matebele FC.
↓
They see the club story.
↓
They flip player cards.
↓
They check upcoming matches.
↓
A club administrator logs in.
↓
They update the squad.
↓
They publish changes.
↓
Fans immediately see the updated information.
↓
The coach opens analytics.
↓
They view team performance.

That is enough to make someone understand the vision.

Final MVP Statement
IP Soccer OS Beta is a digital football ecosystem where clubs own their online identity, fans experience football digitally, and organisations begin their journey toward data-driven decision making.

At this point we actually have the full product package:
✅ Business Requirements
✅ Product Requirements
✅ Architecture
✅ Database Design
✅ Permissions
✅ Claude Rules
✅ MVP Scope
The next thing before coding would be the actual Supabase database schema (SQL migrations) because that becomes the first thing Claude builds. That will translate the ERD into real tables, relationships, and security policies.


Perfect. Now we move from architecture thinking into the actual foundation Claude will build.
This is the Supabase Database Schema Specification.
Important: I am not going to make this a giant SQL dump yet. A proper SaaS database should be reviewed first as a schema design because once migrations are created, changing core relationships becomes painful.
This document defines:
tables
relationships
purpose
security expectations
future expansion

IP SPORTS OS
Supabase Database Schema Specification
Version 1.0

1. Database Principles
Principle 1: Multi-Tenant Architecture
Every club belongs to an organisation.
Every organisation's data must remain isolated.
Structure:
IP Sports OS

        |
        |
 Organisations

        |
        |
 Teams

        |
        |
 Players / Matches / Analytics


Principle 2: Sport Agnostic
The database must support multiple sports.
Do not create:
football_players
football_matches

Instead:
players
matches
sports


2. Core Platform Tables

SPORTS
Stores supported sports.
Example:
Football
Basketball
Netball

Table:
sports

Fields:
Field
Type
id
uuid
name
text
code
text
created_at
timestamp
Example:
id:
1

name:
Football

code:
FBL


ORGANISATIONS
Represents customers.
Examples:
Matebele FC
Botswana Football Association
Basketball Club

Table:
organizations

Fields:
Field
Type
id
uuid
name
text
type
text
logo_url
text
country
text
status
text
subscription_plan
text
subscription_status
text
created_at
timestamp

Possible types:
CLUB

LEAGUE

ACADEMY

ASSOCIATION


TEAMS
One organisation can have many teams.
Example:
Matebele FC:
Senior Team

U21

Academy


Table:
teams

Fields:
Field
Type
id
uuid
organization_id
uuid
sport_id
uuid
name
text
slug
text
gender
text
category
text
logo_url
text
created_at
timestamp

Relationship:
Organization

1

|

Many

Teams


3. Authentication & Permissions

USERS
Connected to Supabase Auth.
Stores application profile.

Table:
profiles

Fields:
Field
Type
id
uuid
organization_id
uuid
first_name
text
last_name
text
email
text
role_id
uuid
status
text
created_at
timestamp

Relationship:
User

belongs to

Organisation


ROLES
Table:
roles

Fields:
Field
Type
id
uuid
name
text
description
text

Default roles:
SUPER_ADMIN

CLUB_ADMIN

COACH

ANALYST

SCOUT

MEDICAL

MEDIA

PLAYER


PERMISSIONS
Fine-grained access.
Table:
permissions

Fields:
Field
Type
id
uuid
module
text
action
text
Examples:
analytics:view

analytics:edit

website:publish

medical:view


ROLE_PERMISSIONS
Many-to-many.
Table:
role_permissions

Fields:
role_id

permission_id


4. Competition System

COMPETITIONS
Works across sports.
Examples:
Botswana Premier League
CAF Champions League

Table:
competitions

Fields:
Field
Type
id
uuid
sport_id
uuid
name
text
country
text
organisation_id
uuid

SEASONS
Table:
seasons

Fields:
id

name

start_date

end_date

Example:
2026 Season


5. Athlete Management

PLAYERS
Players are athletes.

Table:
players

Fields:
Field
Type
id
uuid
team_id
uuid
first_name
text
last_name
text
date_of_birth
date
nationality
text
position
text
shirt_number
integer
height
numeric
weight
numeric
preferred_foot
text
photo_url
text
created_at
timestamp

PLAYER VISIBILITY
Controls public information.
Table:
player_visibility

Fields:
player_id

show_age

show_height

show_weight

show_nationality

show_statistics

show_photo


Example:
Club chooses:
Age:
OFF

Photo:
ON

Statistics:
ON


PLAYER STATISTICS
Separate from player profile.
Table:
player_statistics

Fields:
id

player_id

season_id

appearances

minutes

goals

assists

rating


6. Match System

MATCHES
Central sporting event table.
Table:
matches

Fields:
id

competition_id

season_id

home_team_id

away_team_id

venue

match_date

status

home_score

away_score


Statuses:
UPCOMING

LIVE

FINISHED

POSTPONED


MATCH EVENTS
For live updates.
Table:
match_events

Fields:
id

match_id

player_id

event_type

minute

description


Events:
GOAL

YELLOW_CARD

RED_CARD

SUBSTITUTION


7. Public Website System

WEBSITE_CONTENT
Controls club pages.
Table:
website_content

Fields:
id

team_id

section

content

visibility

status

created_at

updated_at


Status:
DRAFT

PUBLISHED


Example:
section:

history


status:

published


NEWS
Table:
news

Fields:
id

team_id

title

content

image_url

status

published_at


8. Analytics System
This is the differentiator.

ANALYTICS_WIDGETS
Created by IP Super Admin.
Table:
analytics_widgets

Fields:
id

name

description

category

sport_id

subscription_level

status

created_at


Examples:
Goals Trend

Player Chemistry

Passing Network

Fatigue Index


DASHBOARDS
Created by clubs.
Table:
dashboards

Fields:
id

team_id

name

created_by

role_visibility


Examples:
Head Coach Dashboard

Medical Dashboard


DASHBOARD_WIDGETS
Controls layout.
Table:
dashboard_widgets

Fields:
id

dashboard_id

widget_id

position

size


Example:
Coach Dashboard

1. Form Chart

2. Passing Network

3. Player Fitness


9. Training System
Future-ready but include structure.

TRAINING_SESSIONS
training_sessions

Fields:
id

team_id

date

location

coach_id

notes


TRAINING_ATTENDANCE
training_attendance

Fields:
id

session_id

player_id

status


10. Medical System
Sensitive data.
Requires strict permissions.

MEDICAL_RECORDS
medical_records

Fields:
id

player_id

injury

severity

start_date

expected_return

status


11. Scouting System

SCOUTING_REPORTS
scouting_reports

Fields:
id

team_id

created_by

player_name

position

rating

notes


12. AI System

AI_INSIGHTS
Stores generated recommendations.
Table:
ai_insights

Fields:
id

team_id

category

content

created_at

status


Example:
Player partnership recommendation

Training recommendation

Match review


13. Audit System
Important for a commercial SaaS.

ACTIVITY_LOGS
Tracks changes.
Table:
activity_logs

Fields:
id

user_id

action

table_name

record_id

created_at


Example:
Media Officer

updated

club history

10:45


14. Storage Buckets
Supabase Storage:
/logos

/player-images

/team-banners

/news-images

/documents


15. Row Level Security Strategy
Every organisation-owned table follows:
Example:
Players:
organization_id = auth user's organization_id

Meaning:
Matebele FC users:
Can access:
Matebele Players

Cannot access:
Rollers Players


16. Initial Migration Order
Claude should create migrations in this order:
001_create_sports

002_create_organizations

003_create_teams

004_create_roles_permissions

005_create_profiles

006_create_competitions

007_create_seasons

008_create_players

009_create_matches

010_create_website_system

011_create_analytics_system

012_create_security_policies


Database MVP Outcome
After migrations exist, the platform should be able to answer:
✅ Who owns this club?
✅ Who works for this club?
✅ Who are the players?
✅ What matches exist?
✅ What can the public see?
✅ What can staff see?
✅ Which analytics are available?
✅ Which dashboards exist?

Next document after this:
The final one before coding should be:
IP Sports OS API Specification
Because Claude will need to know:
what endpoints exist,
what data each page receives,
what actions are allowed,
how the frontend talks to Supabase.
That will basically become the bridge between the database and the TypeScript application.



Perfect. This is the last bridge before actual coding.
The database tells us where information lives.
The API specification tells Claude:
"This is how the application communicates with that information."
This prevents Claude from randomly querying Supabase from every component and creating a messy codebase.

IP SPORTS OS
API Specification Document
Version 1.0

1. API Philosophy
IP Sports OS uses a service-based architecture.
The frontend should not directly manipulate database tables.
Flow:
User Interface

↓

Frontend Components

↓

API / Server Actions

↓

Business Logic

↓

Supabase Database

↓

Response


2. API Design Principles
Principle 1: Secure by Default
Every request must verify:
User identity
Organisation access
Permission level

Principle 2: Role Awareness
Every API action checks:
Example:
A coach can:
GET /players

but cannot:
DELETE /players/:id


Principle 3: Organisation Isolation
Every query must respect:
organization_id

Never allow:
Club A
    ↓
Access
    ↓
Club B data


3. API Structure
Base:
/api/v1/


Structure:
/api/v1

/auth

/organizations

/teams

/players

/matches

/competitions

/website

/analytics

/dashboards

/admin

/ai


4. Authentication API
Login
POST

/api/v1/auth/login

Request:
{
 "email":"user@example.com",
 "password":"password"
}

Response:
{
 "user_id":"123",
 "role":"CLUB_ADMIN",
 "organization_id":"456"
}


Logout
POST

/api/v1/auth/logout


Current User
GET

/api/v1/auth/me

Returns:
{
"name":"John",
"role":"COACH",
"team":"Matebele FC"
}


5. Organisation APIs
Used by IP Super Admin.

Create Organisation
POST

/api/v1/organizations

Example:
{
"name":"Matebele FC",
"type":"CLUB",
"sport":"Football"
}


Get Organisation
GET

/api/v1/organizations/:id


Update Organisation
PATCH

/api/v1/organizations/:id


Suspend Organisation
PATCH

/api/v1/organizations/:id/status

Example:
{
"status":"PAUSED"
}


6. Team APIs

List Teams
Public:
GET

/api/v1/teams

Example response:
[
{
"name":"Matebele FC",
"logo":"logo.png",
"league":"Premier League"
}
]


Public Team Page
GET

/api/v1/teams/:slug/public

Returns:
Team information

History

Fixtures

Results

Visible players

News


Club Staff Team View
GET

/api/v1/teams/:id

Requires login.

Update Team Profile
PATCH

/api/v1/teams/:id

Allowed:
Club Admin only.

7. Player APIs

Public Players
GET

/api/v1/teams/:id/players/public

Returns only approved information.
Example:
{
"name":"Thabo",
"position":"Midfielder",
"photo":"player.jpg"
}


Staff Player List
GET

/api/v1/players


Create Player
POST

/api/v1/players

Example:
{
"name":"Thabo",
"position":"Forward"
}


Update Player
PATCH

/api/v1/players/:id


Update Visibility
Important.
PATCH

/api/v1/players/:id/visibility

Example:
{
"show_height":true,
"show_weight":false
}


8. Match APIs

Public Fixtures
GET

/api/v1/matches/fixtures

Returns:
Upcoming matches
Teams
Venue
Date

Team Fixtures
GET

/api/v1/teams/:id/matches


Create Match
POST

/api/v1/matches

Club staff only.

Update Score
PATCH

/api/v1/matches/:id/result

Example:
{
"home_score":2,
"away_score":1
}


Match Events
Add:
POST

/api/v1/matches/:id/events

Example:
{
"type":"GOAL",
"player":"123",
"minute":67
}


9. Website Management APIs

Get Public Website
GET

/api/v1/teams/:id/site


Edit Website Content
PATCH

/api/v1/site/content/:id


Save Draft
POST

/api/v1/site/draft


Publish Website
POST

/api/v1/site/publish

Permission:
CLUB_ADMIN
MEDIA


10. News APIs

Public News
GET

/api/v1/news


Create News
POST

/api/v1/news


Publish News
PATCH

/api/v1/news/:id/publish


11. Analytics APIs
This is the IP Sports OS differentiator.

Available Widgets
GET

/api/v1/analytics/widgets

Returns:
[
{
"name":"Goals Trend",
"type":"line_chart"
},
{
"name":"Player Form",
"type":"radar"
}
]


Club Dashboard
GET

/api/v1/dashboards/:team

Returns:
{
"name":"Coach Dashboard",

"widgets":[

"Form Chart",

"Passing Network"

]
}


Create Dashboard
POST

/api/v1/dashboards


Add Widget
POST

/api/v1/dashboards/:id/widgets

Example:
{
"widget_id":"123",
"position":1
}


12. Analytics Studio APIs
Super Admin only.

Create Widget
POST

/api/v1/admin/widgets

Example:
{
"name":"Player Chemistry",
"category":"Performance"
}


Publish Widget
PATCH

/api/v1/admin/widgets/:id/publish


Assign Widget
POST

/api/v1/admin/widgets/:id/access

Example:
{
"subscription":"PROFESSIONAL"
}


13. AI APIs
Future module.

Generate Insight
POST

/api/v1/ai/analyse

Example:
{
"type":"player_partnership",
"team":"123"
}


Response:
{
"insight":
"Player A creates more chances when playing with Player B"
}


Store Insight
POST

/api/v1/ai/insights


14. Admin APIs
IP Platform Management.

Clubs
GET

/api/v1/admin/clubs


Subscription Status
PATCH

/api/v1/admin/subscriptions/:club


Platform Analytics
GET

/api/v1/admin/platform-statistics

Shows:
Number of clubs
Active users
Matches
Players

15. Error Handling Standard
All APIs return:
Success:
{
"success":true,
"data":{}
}


Error:
{
"success":false,
"error":"Permission denied"
}


Common errors:
401

Not authenticated


403

No permission


404

Not found


500

Server error


16. Frontend Data Flow Example
Fan opens:
/teams/matebelefc

Flow:
Page loads

↓

GET /api/v1/teams/matebelefc/public

↓

Receive:

Team info

Players

Fixtures

News

↓

Render cards


17. Coach Dashboard Example
Coach opens:
/portal/matebelefc/dashboard

Flow:
Authentication

↓

Check role

↓

GET dashboard

↓

GET widgets

↓

GET team statistics

↓

Render analytics


18. API Development Order
Claude should build APIs in this order:
Phase 1
auth

organizations

roles

permissions


Phase 2
teams

players

matches


Phase 3
website

news


Phase 4
analytics

dashboards


Phase 5
AI


19. API Rules for Claude
Claude must:
✅ Use reusable service functions
✅ Validate inputs
✅ Handle errors
✅ Check permissions
✅ Never expose private data publicly
✅ Never bypass Supabase security
Claude must not:
❌ Query database directly inside UI components
❌ Duplicate API logic
❌ Store sensitive information in public responses

Final Architecture Picture
At this point IP Sports OS looks like:
                  PUBLIC USERS

                       |
                       |

              Public Sports Portal

                       |

                 API Layer

                       |

 ------------------------------------------------

 |                 |                |

Club Portal    Analytics       AI Engine


                       |

                 Supabase

                       |

 ------------------------------------------------

Organizations | Teams | Players | Matches | Data



We now have the complete product package:
✅ Business Requirements
✅ Product Requirements
✅ UX Specification
✅ Architecture
✅ Database Design
✅ Permissions
✅ Claude Rules
✅ MVP Scope
✅ Database Schema
✅ API Specification
The next practical step is not another document.
The next step is to create the actual Figma design brief / prompt that matches this architecture, so the prototype Claude builds is visually aligned with the product vision.
That Figma file becomes your investor/demo piece.