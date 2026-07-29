# IP Sports OS Analytics Architecture Specification

## 1. Purpose
The analytics architecture defines how IP Sports OS turns raw sports data into reusable, publishable insights for platform administrators, club staff, and public-facing experiences. It separates raw data from calculations, widgets, and dashboards so analytics can evolve without tightly coupling every chart to a single template or UI.

## 2. Core analytics layers

### 2.1 Raw data layer
This layer contains the canonical source records that describe the sports system.

Primary sources:
- matches
- event_types
- match_events
- athletes
- athlete_team_history
- athlete_statistics
- competitions
- seasons
- teams
- organizations

Examples:
- A goal event recorded in match_events
- A player appearance stored in athlete_statistics
- A team participation entry in competition_participants

### 2.2 Analytics engine layer
This layer transforms raw data into reusable metrics, aggregates, and derived insights.

Responsibilities:
- calculate metrics such as goals, assists, win rates, form, and contribution share
- join related entities across matches, teams, athletes, and seasons
- normalize definitions so the same metric can be reused by many widgets
- support both simple and complex analytics without embedding logic in UI components

Example:
- Raw: a goal event with player and match context
- Derived metric: player goal contribution share = goals / team goals

### 2.3 Widget layer
This layer defines the presentation of analytics outputs.

Widgets are reusable UI components that represent a metric or visual summary.

Examples:
- line chart for goals trend
- bar chart for appearances by player
- pie chart for contribution share
- table for recent form

### 2.4 Dashboard layer
This layer organizes widgets into user-facing experiences.

Dashboards are role-aware and tenant-scoped.

Examples:
- Coach dashboard
- Analyst dashboard
- Club admin dashboard
- Platform analytics view

## 3. Analytics data flow

Raw data -> calculations -> widget definitions -> dashboard placement

Example flow:
1. Match events are stored in the database
2. The analytics engine calculates team form and player contribution metrics
3. A widget definition is published for that metric
4. Clubs or roles add the widget to a dashboard

## 4. Analytics studio workflow

### 4.1 Platform Owner or Super Admin creates an analytics definition
A platform administrator creates a reusable analytics definition that specifies:
- name
- metric logic
- required data source
- supported sport
- allowed roles or access scope
- publication status

### 4.2 Analytics definition is published
Once validated, the definition can be published for use by clubs.

### 4.3 Widget is created from the definition
A widget is a presentation format for a published analytics definition.

Example:
- Definition: Player Goal Contribution Share
- Widget: Pie chart

### 4.4 Widget is assigned to a dashboard
Clubs can place published widgets on a dashboard for coaches, analysts, or admins.

## 5. Recommended architecture objects

### 5.1 analytics_definitions
Purpose: stores the reusable logic and source definition for a metric.

Contains:
- metric name
- data-source configuration
- query rules
- allowed roles
- sport context
- status
- owner or creator

### 5.2 analytics_widgets
Purpose: presentation layer for analytics definitions.

Contains:
- widget name
- category
- chart or table type
- linked analytics definition
- publication status

### 5.3 dashboards
Purpose: container for widgets shown to a specific audience.

Contains:
- dashboard name
- owning organization
- role scope
- created by

### 5.4 dashboard_widgets
Purpose: layout mapping between dashboards and widgets.

Contains:
- widget placement
- dashboard relationship
- display size and order

## 6. Analytics Builder
This is the product experience that makes IP Sports OS different from a standard dashboard tool.

### 6.1 Builder workflow
Platform administrators create analytics through a guided studio experience:

1. Select data sources
   - match_events
   - athletes
   - teams
   - competitions
   - seasons

2. Define the metric
   - Example: Goals Contribution %
   - Formula: player goals / team goals

3. Choose a visualization
   - pie chart
   - line chart
   - bar chart
   - table

4. Preview the result
   - preview the chart with real sample data
   - validate permissions and data access

5. Publish to clubs
   - make the widget available to selected roles or organizations
   - publish only after review

### 6.2 Builder experience example
Super Admin clicks Create Analytics.

They choose:
- data sources: match_events, athletes, teams
- metric: Goals Contribution %
- visualization: pie chart
- audience: Coach, Analyst, Club Admin

After preview and publish, the widget becomes available to subscribed clubs.

### 6.3 Builder role expectations
Platform Owner and Super Admin can:
- create and publish analytics definitions
- define formulas and data-source mappings
- control which clubs and roles receive the widget

Club users can:
- consume published widgets
- place them on dashboards
- configure their own dashboard layout

## 7. Permissions and governance
Analytics must be governed by role and tenant boundaries.

### Platform-level permissions
Platform Owners and Super Admins can:
- create analytics definitions
- publish analytics definitions
- create widgets
- control availability to organizations

### Organization-level permissions
Club admins, coaches, and analysts can:
- view published analytics available to their organization
- add widgets to dashboards
- configure dashboard layout

### Public access
Public users should not receive private analytics or sensitive data.

## 8. Future AI integration
The analytics architecture should be AI-ready.

Future AI features can consume the same analytics definitions and output:
- match summaries
- tactical insights
- player recommendations
- trend explanations
- predictive commentary

Important principle:
AI should be advisory and should never directly modify core records without human approval.

## 9. Design principles
- Separate raw data from derived analytics
- Keep metrics reusable across multiple widgets and dashboards
- Keep widget presentation independent from backend calculation logic
- Make analytics role-aware and tenant-scoped
- Prepare for future AI-assisted recommendations without hard-coding them into the core model
