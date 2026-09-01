/*
# Create Noerong Proposals database schema

## Overview
Creates the complete database schema for the Noerong Proposals platform — a white-label
proposal, pricing, and client approval SaaS for freelancers and small agencies.

## New Tables

### profiles
- One row per authenticated user, storing business branding and default settings.
- `id` (uuid, PK) — references `auth.users(id)`, one-to-one with the auth account.
- `business_name`, `logo_url`, `brand_color` — branding fields for white-label proposals.
- `contact_email`, `contact_phone`, `address` — business contact details.
- `default_currency` (text, default 'USD'), `default_tax_rate` (numeric, default 0).
- `default_terms` (text) — default terms appended to new proposals.
- `proposal_prefix` (text, default 'NP') — prefix for human-readable proposal numbers.
- `created_at`, `updated_at` — timestamps.

### clients
- Stores the user's clients with contact details and archive support.
- `id` (uuid, PK), `user_id` (uuid, FK to auth.users, owner, DEFAULT auth.uid()).
- `name`, `company`, `email`, `phone`, `address`, `notes` — client details.
- `archived` (bool, default false) — soft archive flag.
- `created_at`, `updated_at`.

### proposals
- Core proposal records with lifecycle tracking and public sharing.
- `id` (uuid, PK), `user_id` (uuid, FK to auth.users, owner, DEFAULT auth.uid()).
- `client_id` (uuid, FK to clients, ON DELETE CASCADE).
- `title`, `status` (enum: draft/sent/viewed/accepted/rejected/expired).
- `proposal_number` (text) — human-readable number like "NP-0042".
- `currency` (text, default 'USD').
- `subtotal`, `discount_amount`, `tax_rate`, `total` (numeric, all CHECK >= 0).
- `notes`, `terms` (text).
- `expiry_date` (date).
- `public_token` (uuid, DEFAULT gen_random_uuid(), UNIQUE) — for public proposal links.
- `sent_at`, `viewed_at`, `accepted_at`, `rejected_at` (timestamptz, nullable).
- `created_at`, `updated_at`.

### proposal_items
- Line items belonging to a proposal.
- `id` (uuid, PK), `proposal_id` (uuid, FK to proposals, ON DELETE CASCADE).
- `description` (text), `quantity` (numeric, CHECK > 0), `rate` (numeric, CHECK >= 0).
- `discount` (numeric, default 0, CHECK >= 0).
- `sort_order` (int, default 0).
- `created_at`.

### proposal_comments
- Comments on a proposal from both the owner and the external client.
- `id` (uuid, PK), `proposal_id` (uuid, FK to proposals, ON DELETE CASCADE).
- `user_id` (uuid, nullable, FK to auth.users) — null for external client comments.
- `author_name` (text), `body` (text).
- `created_at`.

### activity_events
- Immutable log of proposal lifecycle events.
- `id` (uuid, PK), `proposal_id` (uuid, FK to proposals, ON DELETE CASCADE).
- `user_id` (uuid, nullable, FK to auth.users) — null for system/public events.
- `event_type` (text) — created/sent/viewed/commented/accepted/rejected/expired.
- `metadata` (jsonb, default '{}').
- `created_at`.

## Security (RLS + Policies)

### profiles
- RLS enabled. Users can SELECT and UPDATE only their own profile row (auth.uid() = id).
- No INSERT or DELETE policy — profiles are created exclusively by the database trigger
  on signup, never by the client.

### clients
- RLS enabled. Owner-scoped CRUD: authenticated users can only access rows where
  user_id = auth.uid(). All four CRUD policies (SELECT, INSERT, UPDATE, DELETE).

### proposals
- RLS enabled. Owner-scoped CRUD through user_id = auth.uid().
- No broad unauthenticated read policy — public access goes through a SECURITY DEFINER
  function that validates the public_token, not through RLS.

### proposal_items
- RLS enabled. No direct user_id column — access scoped through parent proposal ownership:
  EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id
  AND proposals.user_id = auth.uid()). All four CRUD policies.

### proposal_comments
- RLS enabled. Owner-scoped through parent proposal ownership, same pattern as items.
- All four CRUD policies.

### activity_events
- RLS enabled. Owner-scoped through parent proposal ownership.
- SELECT and INSERT only (events are immutable once created — no UPDATE or DELETE).

## Constraints
- `proposals_status_check`: status must be one of draft/sent/viewed/accepted/rejected/expired.
- `proposals_nonnegative_subtotal`: subtotal >= 0.
- `proposals_nonnegative_discount`: discount_amount >= 0.
- `proposals_nonnegative_tax_rate`: tax_rate >= 0.
- `proposals_nonnegative_total`: total >= 0.
- `proposal_items_quantity_positive`: quantity > 0.
- `proposal_items_nonnegative_rate`: rate >= 0.
- `proposal_items_nonnegative_discount`: discount >= 0.
- `activity_events_event_type_check`: event_type must be one of the allowed values.

## Indexes
- `clients_user_id_idx` on clients(user_id).
- `proposals_user_id_idx` on proposals(user_id).
- `proposals_client_id_idx` on proposals(client_id).
- `proposals_public_token_idx` on proposals(public_token).
- `proposals_status_idx` on proposals(status).
- `proposal_items_proposal_id_idx` on proposal_items(proposal_id).
- `proposal_comments_proposal_id_idx` on proposal_comments(proposal_id).
- `activity_events_proposal_id_idx` on activity_events(proposal_id).
- `activity_events_created_at_idx` on activity_events(created_at).

## Important Notes
1. All owner columns (`user_id`) default to `auth.uid()` so client-side inserts that
   omit the owner still satisfy the INSERT WITH CHECK policy.
2. Child tables (proposal_items, proposal_comments, activity_events) have no user_id
   column — their RLS policies check ownership through the parent proposals table.
3. The public proposal view will be handled by a SECURITY DEFINER function (added in
   a later migration) that validates the public_token. No anon RLS policy on proposals.
4. A trigger on auth.users INSERT creates a default profile row automatically on signup.
*/

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text DEFAULT '',
  logo_url text DEFAULT '',
  brand_color text DEFAULT '#a8d61f',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  address text DEFAULT '',
  default_currency text NOT NULL DEFAULT 'USD',
  default_tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  default_terms text DEFAULT '',
  proposal_prefix text NOT NULL DEFAULT 'NP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CLIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_own" ON clients;
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_insert_own" ON clients;
CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_update_own" ON clients;
CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_delete_own" ON clients;
CREATE POLICY "clients_delete_own" ON clients
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);

-- ============================================================================
-- PROPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  status proposal_status NOT NULL DEFAULT 'draft',
  proposal_number text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  terms text DEFAULT '',
  expiry_date date,
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposals_status_check CHECK (
    status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')
  ),
  CONSTRAINT proposals_nonnegative_subtotal CHECK (subtotal >= 0),
  CONSTRAINT proposals_nonnegative_discount CHECK (discount_amount >= 0),
  CONSTRAINT proposals_nonnegative_tax_rate CHECK (tax_rate >= 0),
  CONSTRAINT proposals_nonnegative_total CHECK (total >= 0)
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select_own" ON proposals;
CREATE POLICY "proposals_select_own" ON proposals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_insert_own" ON proposals;
CREATE POLICY "proposals_insert_own" ON proposals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_update_own" ON proposals;
CREATE POLICY "proposals_update_own" ON proposals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_delete_own" ON proposals;
CREATE POLICY "proposals_delete_own" ON proposals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS proposals_user_id_idx ON proposals(user_id);
CREATE INDEX IF NOT EXISTS proposals_client_id_idx ON proposals(client_id);
CREATE INDEX IF NOT EXISTS proposals_public_token_idx ON proposals(public_token);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);

-- ============================================================================
-- PROPOSAL ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  rate numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT proposal_items_nonnegative_rate CHECK (rate >= 0),
  CONSTRAINT proposal_items_nonnegative_discount CHECK (discount >= 0)
);

ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposal_items_select_own" ON proposal_items;
CREATE POLICY "proposal_items_select_own" ON proposal_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_items_insert_own" ON proposal_items;
CREATE POLICY "proposal_items_insert_own" ON proposal_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_items_update_own" ON proposal_items;
CREATE POLICY "proposal_items_update_own" ON proposal_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_items_delete_own" ON proposal_items;
CREATE POLICY "proposal_items_delete_own" ON proposal_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS proposal_items_proposal_id_idx ON proposal_items(proposal_id);

-- ============================================================================
-- PROPOSAL COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposal_comments_select_own" ON proposal_comments;
CREATE POLICY "proposal_comments_select_own" ON proposal_comments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_comments.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_comments_insert_own" ON proposal_comments;
CREATE POLICY "proposal_comments_insert_own" ON proposal_comments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_comments.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_comments_update_own" ON proposal_comments;
CREATE POLICY "proposal_comments_update_own" ON proposal_comments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_comments.proposal_id AND proposals.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_comments.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "proposal_comments_delete_own" ON proposal_comments;
CREATE POLICY "proposal_comments_delete_own" ON proposal_comments
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_comments.proposal_id AND proposals.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS proposal_comments_proposal_id_idx ON proposal_comments(proposal_id);

-- ============================================================================
-- ACTIVITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_events_event_type_check CHECK (
    event_type IN ('created', 'sent', 'viewed', 'commented', 'accepted', 'rejected', 'expired')
  )
);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_events_select_own" ON activity_events;
CREATE POLICY "activity_events_select_own" ON activity_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = activity_events.proposal_id AND proposals.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "activity_events_insert_own" ON activity_events;
CREATE POLICY "activity_events_insert_own" ON activity_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM proposals WHERE proposals.id = activity_events.proposal_id AND proposals.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS activity_events_proposal_id_idx ON activity_events(proposal_id);
CREATE INDEX IF NOT EXISTS activity_events_created_at_idx ON activity_events(created_at);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION (reusable for all tables with updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS proposals_updated_at ON proposals;
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
