/*
# Add is_sample columns and sample workspace RPC functions

## Overview
Adds is_sample boolean columns to clients and proposals tables, plus two
SECURITY DEFINER RPC functions for loading and removing sample workspace
data. All operations are owner-scoped via auth.uid().

## Modified Tables
- clients: ADD COLUMN is_sample boolean NOT NULL DEFAULT false
- proposals: ADD COLUMN is_sample boolean NOT NULL DEFAULT false

## New Functions
1. load_sample_workspace() — idempotent: checks if sample data already exists
   for this user, and if so returns without creating duplicates. Creates 3
   fictional clients, 4 proposals (Draft, Sent/Viewed, Accepted, Expired),
   line items, a comment, and activity events. All marked is_sample=true.
2. remove_sample_workspace() — deletes all is_sample=true clients and
   proposals owned by the current user. Cascading deletes handle items,
   comments, and activity events. Never touches real user records.
3. has_sample_data() — returns boolean indicating if any is_sample records
   exist for the current user.

## Security
- All functions SECURITY DEFINER, SET search_path = public
- Owner derived from auth.uid(), never from parameters
- EXECUTE revoked from PUBLIC, granted to authenticated only
- No new RLS policies, no anonymous table access
- Generic errors only
*/

-- ============================================================================
-- ADD is_sample COLUMNS
-- ============================================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

-- ============================================================================
-- HAS_SAMPLE_DATA — check if user has any sample records
-- ============================================================================

CREATE OR REPLACE FUNCTION has_sample_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM clients WHERE user_id = v_uid AND is_sample = true
  ) OR EXISTS(
    SELECT 1 FROM proposals WHERE user_id = v_uid AND is_sample = true
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

REVOKE EXECUTE ON FUNCTION has_sample_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION has_sample_data() TO authenticated;

-- ============================================================================
-- LOAD_SAMPLE_WORKSPACE — idempotent insertion of fictional demo data
-- ============================================================================

CREATE OR REPLACE FUNCTION load_sample_workspace()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_prefix text;
  v_counter integer;
  v_client1_id uuid;
  v_client2_id uuid;
  v_client3_id uuid;
  v_proposal_id uuid;
  v_token uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotency: if sample data already exists, return silently
  IF has_sample_data() THEN
    RETURN;
  END IF;

  -- Get prefix
  SELECT proposal_prefix INTO v_prefix FROM profiles WHERE id = v_uid;
  IF v_prefix IS NULL THEN
    v_prefix := 'NP';
  END IF;

  -- Get next counter number (reuse the existing counter logic)
  INSERT INTO proposal_counters (user_id, next_number)
  VALUES (v_uid, 1)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create 3 sample clients
  INSERT INTO clients (user_id, name, company, email, phone, address, notes, is_sample)
  VALUES
    (v_uid, 'Sample: Sarah Chen', 'Northwind Studio', 'sarah.sample@northwind-studio.example', '(555) 123-4567', '123 Market St, San Francisco, CA 94103', 'Sample client for demonstration', true)
  RETURNING id INTO v_client1_id;

  INSERT INTO clients (user_id, name, company, email, phone, address, notes, is_sample)
  VALUES
    (v_uid, 'Sample: Marcus Webb', 'Brightpath Agency', 'marcus.sample@brightpath.example', '(555) 234-5678', '456 Oak Ave, Portland, OR 97201', 'Sample client for demonstration', true)
  RETURNING id INTO v_client2_id;

  INSERT INTO clients (user_id, name, company, email, phone, address, notes, is_sample)
  VALUES
    (v_uid, 'Sample: Elena Rodriguez', 'Coastline Brands', 'elena.sample@coastline.example', '(555) 345-6789', '789 Pine St, Seattle, WA 98101', 'Sample client for demonstration', true)
  RETURNING id INTO v_client3_id;

  -- Proposal 1: Draft (for Sarah Chen)
  SELECT next_number INTO v_counter FROM proposal_counters WHERE user_id = v_uid;
  UPDATE proposal_counters SET next_number = v_counter + 1 WHERE user_id = v_uid;

  INSERT INTO proposals (user_id, client_id, title, status, proposal_number, currency, subtotal, discount_amount, tax_rate, total, notes, terms, expiry_date, is_sample)
  VALUES (
    v_uid, v_client1_id, 'Sample: Website Redesign Proposal', 'draft'::proposal_status,
    v_prefix || '-' || lpad(v_counter::text, 4, '0'),
    'USD', 0, 0, 0, 0,
    'This is a sample draft proposal for demonstration purposes only.',
    'Sample terms: 50% upfront, 50% on completion. 30-day timeline.',
    NULL, true
  )
  RETURNING id INTO v_proposal_id;

  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order) VALUES
    (v_proposal_id, 'Sample: Discovery and strategy', 'Stakeholder interviews, competitive analysis, and sitemap', 1, 1500, 0, 0),
    (v_proposal_id, 'Sample: UI design', 'High-fidelity mockups for desktop and mobile', 3, 1200, 10, 1),
    (v_proposal_id, 'Sample: Frontend development', 'Responsive implementation with component library', 5, 1800, 0, 2);

  PERFORM recompute_proposal_totals(v_proposal_id);

  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'created', jsonb_build_object('sample', true));

  -- Proposal 2: Viewed (Sent then Viewed) (for Marcus Webb)
  SELECT next_number INTO v_counter FROM proposal_counters WHERE user_id = v_uid;
  UPDATE proposal_counters SET next_number = v_counter + 1 WHERE user_id = v_uid;

  INSERT INTO proposals (user_id, client_id, title, status, proposal_number, currency, subtotal, discount_amount, tax_rate, total, notes, terms, expiry_date, sent_at, viewed_at, is_sample)
  VALUES (
    v_uid, v_client2_id, 'Sample: Brand Identity Package', 'viewed'::proposal_status,
    v_prefix || '-' || lpad(v_counter::text, 4, '0'),
    'USD', 0, 0, 8.5, 0,
    'Sample proposal demonstrating the viewed state after a client opens the link.',
    'Sample terms: 50% deposit to begin work. 6-week timeline.',
    CURRENT_DATE + 14, now() - interval '3 days', now() - interval '1 day', true
  )
  RETURNING id, public_token INTO v_proposal_id, v_token;

  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order) VALUES
    (v_proposal_id, 'Sample: Logo design', '3 initial concepts, 2 rounds of revisions, final files', 1, 2800, 0, 0),
    (v_proposal_id, 'Sample: Brand guidelines', 'Color palette, typography, logo usage, and brand voice', 1, 1500, 0, 1),
    (v_proposal_id, 'Sample: Business card design', 'Print-ready files, front and back', 2, 350, 5, 2);

  PERFORM recompute_proposal_totals(v_proposal_id);

  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'created', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'sent', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'viewed', jsonb_build_object('sample', true));

  INSERT INTO proposal_comments (proposal_id, author_name, body)
  VALUES (v_proposal_id, 'Sample: Marcus Webb', 'This looks great. Can we discuss the timeline for the business cards?');

  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'commented', jsonb_build_object('sample', true, 'author_name', 'Sample: Marcus Webb'));

  -- Proposal 3: Accepted (for Elena Rodriguez)
  SELECT next_number INTO v_counter FROM proposal_counters WHERE user_id = v_uid;
  UPDATE proposal_counters SET next_number = v_counter + 1 WHERE user_id = v_uid;

  INSERT INTO proposals (user_id, client_id, title, status, proposal_number, currency, subtotal, discount_amount, tax_rate, total, notes, terms, expiry_date, sent_at, viewed_at, accepted_at, is_sample)
  VALUES (
    v_uid, v_client3_id, 'Sample: Social Media Campaign', 'accepted'::proposal_status,
    v_prefix || '-' || lpad(v_counter::text, 4, '0'),
    'USD', 0, 200, 7.5, 0,
    'Sample proposal demonstrating the accepted state after client approval.',
    'Sample terms: Net 30 payment terms. Campaign runs for 8 weeks.',
    CURRENT_DATE - 10, now() - interval '8 days', now() - interval '7 days', now() - interval '5 days', true
  )
  RETURNING id INTO v_proposal_id;

  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order) VALUES
    (v_proposal_id, 'Sample: Campaign strategy', 'Audience research, platform selection, content pillars', 1, 2000, 0, 0),
    (v_proposal_id, 'Sample: Content creation', '12 posts, 4 stories, 2 reels per week', 4, 800, 15, 1),
    (v_proposal_id, 'Sample: Community management', 'Daily monitoring and engagement', 8, 500, 0, 2);

  PERFORM recompute_proposal_totals(v_proposal_id);

  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'created', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'sent', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'viewed', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'accepted', jsonb_build_object('sample', true, 'client_name', 'Sample: Elena Rodriguez'));

  -- Proposal 4: Expired (for Sarah Chen)
  SELECT next_number INTO v_counter FROM proposal_counters WHERE user_id = v_uid;
  UPDATE proposal_counters SET next_number = v_counter + 1 WHERE user_id = v_uid;

  INSERT INTO proposals (user_id, client_id, title, status, proposal_number, currency, subtotal, discount_amount, tax_rate, total, notes, terms, expiry_date, sent_at, viewed_at, is_sample)
  VALUES (
    v_uid, v_client1_id, 'Sample: Monthly Retainer Proposal', 'expired'::proposal_status,
    v_prefix || '-' || lpad(v_counter::text, 4, '0'),
    'USD', 0, 0, 0, 0,
    'Sample proposal demonstrating the expired state after the expiry date passed.',
    'Sample terms: Monthly retainer, 30-day notice to cancel.',
    CURRENT_DATE - 30, now() - interval '35 days', now() - interval '33 days', true
  )
  RETURNING id INTO v_proposal_id;

  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order) VALUES
    (v_proposal_id, 'Sample: Monthly design support', 'Up to 20 hours of design work per month', 1, 3000, 0, 0),
    (v_proposal_id, 'Sample: Priority response', '48-hour turnaround on requests', 1, 500, 0, 1);

  PERFORM recompute_proposal_totals(v_proposal_id);

  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'created', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, v_uid, 'sent', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'viewed', jsonb_build_object('sample', true));
  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (v_proposal_id, 'expired', jsonb_build_object('sample', true));
END;
$$;

REVOKE EXECUTE ON FUNCTION load_sample_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION load_sample_workspace() TO authenticated;

-- ============================================================================
-- REMOVE_SAMPLE_WORKSPACE — delete only sample records for this user
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_sample_workspace()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete sample proposals (cascade handles items, comments, activity events)
  DELETE FROM proposals WHERE user_id = v_uid AND is_sample = true;

  -- Delete sample clients
  DELETE FROM clients WHERE user_id = v_uid AND is_sample = true;
END;
$$;

REVOKE EXECUTE ON FUNCTION remove_sample_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION remove_sample_workspace() TO authenticated;
