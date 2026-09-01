/*
# Add proposal RPC functions, detail column, and counter table

## Overview
Adds server-side database functions for safe proposal numbering, atomic
create/update with server-computed totals, and duplication. Also adds a
`detail` column to proposal_items for optional line-item descriptions, and a
`proposal_counters` table for concurrency-safe per-user proposal numbering.

## Modified Table: proposal_items
- Added `detail` column (text, NOT NULL, default '') for optional line-item detail.
- Added CHECK constraint: discount must be <= 100 (treated as a percentage).

## New Table: proposal_counters
- `user_id` (uuid, PK, FK to auth.users) — one row per user.
- `next_number` (integer, NOT NULL, default 1) — next proposal sequence number.
- RLS enabled with NO policies — only accessible through SECURITY DEFINER functions.

## New Functions (all SECURITY DEFINER, search_path = public)

1. `recompute_proposal_totals(p_proposal_id)` — reads items from the database,
   computes subtotal (sum of rounded line totals), caps the proposal-level
   discount at the subtotal, computes tax on the taxable amount, and updates
   the proposal row. Internal helper — not callable by client roles.

2. `generate_proposal_number()` — atomically increments the per-user counter
   using INSERT ... ON CONFLICT DO UPDATE, formats it with the user's profile
   prefix as "PREFIX-0001", and returns the string.

3. `create_proposal_with_items(p_client_id, p_title, p_currency, p_expiry_date,
   p_discount_amount, p_tax_rate, p_notes, p_terms, p_items)` — validates
   client ownership and active status, validates items (at least one, all
   quantities > 0, rates >= 0, discounts 0-100), generates a proposal number,
   inserts the proposal and items, recomputes totals server-side, logs a
   'created' activity event, and returns the proposal row. Owner is always
   auth.uid(), never accepted from the client.

4. `update_proposal_with_items(p_proposal_id, p_client_id, p_title, p_currency,
   p_expiry_date, p_discount_amount, p_tax_rate, p_notes, p_terms, p_items)` —
   validates the proposal is owned by the caller and is in 'draft' status,
   validates client ownership, replaces all items, recomputes totals, and
   returns the updated proposal row.

5. `duplicate_proposal(p_proposal_id)` — validates ownership, generates a new
   number, inserts a new 'draft' proposal with copied fields (no sent/viewed/
   accepted dates), copies all items, recomputes totals, logs a 'created'
   event, and returns the new proposal row.

## Security
- All functions use SECURITY DEFINER with SET search_path = public.
- Owner is always derived from auth.uid(), never from function parameters.
- Client ownership is validated before any write.
- EXECUTE revoked from PUBLIC on all functions; granted to authenticated only
  (except recompute_proposal_totals which is internal-only).
- proposal_counters has RLS enabled with no policies (deny all direct access).
*/

-- ============================================================================
-- ADD DETAIL COLUMN TO proposal_items
-- ============================================================================

ALTER TABLE proposal_items ADD COLUMN IF NOT EXISTS detail text NOT NULL DEFAULT '';

-- ============================================================================
-- ADD DISCOUNT MAX CHECK (percentage 0-100)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'proposal_items_discount_max_check'
    AND conrelid = 'proposal_items'::regclass
  ) THEN
    ALTER TABLE proposal_items ADD CONSTRAINT proposal_items_discount_max_check CHECK (discount <= 100);
  END IF;
END $$;

-- ============================================================================
-- PROPOSAL COUNTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposal_counters (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  next_number integer NOT NULL DEFAULT 1
);

ALTER TABLE proposal_counters ENABLE ROW LEVEL SECURITY;
-- No policies: only SECURITY DEFINER functions can access this table.

-- ============================================================================
-- RECOMPUTE_PROPOSAL_TOTALS — internal helper
-- ============================================================================

CREATE OR REPLACE FUNCTION recompute_proposal_totals(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2);
  v_tax_rate numeric(5,2);
  v_taxable numeric(12,2);
  v_tax numeric(12,2) := 0;
  v_total numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(
    round(quantity * rate * (1 - discount / 100), 2)
  ), 0)
  INTO v_subtotal
  FROM proposal_items
  WHERE proposal_id = p_proposal_id;

  SELECT discount_amount, tax_rate
  INTO v_discount, v_tax_rate
  FROM proposals
  WHERE id = p_proposal_id;

  v_discount := LEAST(COALESCE(v_discount, 0), v_subtotal);
  v_taxable := v_subtotal - v_discount;
  v_tax := round(v_taxable * v_tax_rate / 100, 2);
  v_total := v_taxable + v_tax;

  UPDATE proposals
  SET subtotal = v_subtotal,
      discount_amount = v_discount,
      total = v_total
  WHERE id = p_proposal_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION recompute_proposal_totals(uuid) FROM PUBLIC;

-- ============================================================================
-- GENERATE_PROPOSAL_NUMBER — concurrency-safe per-user counter
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_number integer;
BEGIN
  SELECT proposal_prefix INTO v_prefix FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  INSERT INTO proposal_counters (user_id, next_number)
  VALUES (auth.uid(), 1)
  ON CONFLICT (user_id)
  DO UPDATE SET next_number = proposal_counters.next_number + 1
  RETURNING next_number INTO v_number;

  RETURN v_prefix || '-' || lpad(v_number::text, 4, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_proposal_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_proposal_number() TO authenticated;

-- ============================================================================
-- VALIDATE_ITEMS — internal helper to validate a jsonb items array
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_proposal_items(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_invalid integer;
  v_item jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one service item is required';
  END IF;

  v_count := jsonb_array_length(p_items);
  FOR i IN 0..v_count - 1 LOOP
    v_item := p_items->i;
    IF v_item->>'description' IS NULL OR btrim(v_item->>'description') = '' THEN
      RAISE EXCEPTION 'Item % is missing a description', i + 1;
    END IF;
    IF (v_item->>'quantity')::numeric <= 0 THEN
      RAISE EXCEPTION 'Item % quantity must be greater than zero', i + 1;
    END IF;
    IF (v_item->>'rate')::numeric < 0 THEN
      RAISE EXCEPTION 'Item % rate cannot be negative', i + 1;
    END IF;
    IF COALESCE((v_item->>'discount')::numeric, 0) < 0
       OR COALESCE((v_item->>'discount')::numeric, 0) > 100 THEN
      RAISE EXCEPTION 'Item % discount must be between 0 and 100', i + 1;
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION validate_proposal_items(jsonb) FROM PUBLIC;

-- ============================================================================
-- CREATE_PROPOSAL_WITH_ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_proposal_with_items(
  p_client_id uuid,
  p_title text,
  p_currency text,
  p_expiry_date date,
  p_discount_amount numeric DEFAULT 0,
  p_tax_rate numeric DEFAULT 0,
  p_notes text DEFAULT '',
  p_terms text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal_id uuid;
  v_proposal_number text;
  v_client_exists boolean;
  v_result proposals%ROWTYPE;
BEGIN
  -- Validate title
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  -- Validate client ownership and active status
  SELECT EXISTS(
    SELECT 1 FROM clients
    WHERE id = p_client_id AND user_id = auth.uid() AND archived = false
  ) INTO v_client_exists;
  IF NOT v_client_exists THEN
    RAISE EXCEPTION 'Selected client was not found or is archived';
  END IF;

  -- Validate items
  PERFORM validate_proposal_items(p_items);

  -- Validate discount and tax
  IF COALESCE(p_discount_amount, 0) < 0 THEN
    RAISE EXCEPTION 'Discount amount cannot be negative';
  END IF;
  IF COALESCE(p_tax_rate, 0) < 0 THEN
    RAISE EXCEPTION 'Tax rate cannot be negative';
  END IF;

  -- Generate proposal number
  v_proposal_number := generate_proposal_number();

  -- Insert proposal (user_id defaults to auth.uid())
  INSERT INTO proposals (
    client_id, title, status, proposal_number, currency,
    expiry_date, discount_amount, tax_rate, notes, terms
  )
  VALUES (
    p_client_id, p_title, 'draft', v_proposal_number, COALESCE(p_currency, 'USD'),
    p_expiry_date, COALESCE(p_discount_amount, 0), COALESCE(p_tax_rate, 0),
    COALESCE(p_notes, ''), COALESCE(p_terms, '')
  )
  RETURNING id INTO v_proposal_id;

  -- Insert items
  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order)
  SELECT
    v_proposal_id,
    item->>'description',
    COALESCE(item->>'detail', ''),
    (item->>'quantity')::numeric,
    (item->>'rate')::numeric,
    COALESCE((item->>'discount')::numeric, 0),
    COALESCE((item->>'sort_order')::int, 0)
  FROM jsonb_array_elements(p_items) AS item;

  -- Recompute totals server-side
  PERFORM recompute_proposal_totals(v_proposal_id);

  -- Log activity
  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_proposal_id, auth.uid(), 'created', '{}'::jsonb);

  -- Return the proposal
  SELECT * INTO v_result FROM proposals WHERE id = v_proposal_id;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_proposal_with_items(uuid, text, text, date, numeric, numeric, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_proposal_with_items(uuid, text, text, date, numeric, numeric, text, text, jsonb) TO authenticated;

-- ============================================================================
-- UPDATE_PROPOSAL_WITH_ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_proposal_with_items(
  p_proposal_id uuid,
  p_client_id uuid,
  p_title text,
  p_currency text,
  p_expiry_date date,
  p_discount_amount numeric DEFAULT 0,
  p_tax_rate numeric DEFAULT 0,
  p_notes text DEFAULT '',
  p_terms text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_client_exists boolean;
  v_result proposals%ROWTYPE;
BEGIN
  -- Fetch proposal and check ownership + draft status
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal was not found';
  END IF;
  IF v_proposal.status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft proposals can be edited';
  END IF;

  -- Validate title
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  -- Validate client ownership and active status
  SELECT EXISTS(
    SELECT 1 FROM clients
    WHERE id = p_client_id AND user_id = auth.uid() AND archived = false
  ) INTO v_client_exists;
  IF NOT v_client_exists THEN
    RAISE EXCEPTION 'Selected client was not found or is archived';
  END IF;

  -- Validate items
  PERFORM validate_proposal_items(p_items);

  -- Validate discount and tax
  IF COALESCE(p_discount_amount, 0) < 0 THEN
    RAISE EXCEPTION 'Discount amount cannot be negative';
  END IF;
  IF COALESCE(p_tax_rate, 0) < 0 THEN
    RAISE EXCEPTION 'Tax rate cannot be negative';
  END IF;

  -- Update proposal fields (not status, not proposal_number, not public_token,
  -- not lifecycle timestamps)
  UPDATE proposals
  SET
    client_id = p_client_id,
    title = p_title,
    currency = COALESCE(p_currency, 'USD'),
    expiry_date = p_expiry_date,
    discount_amount = COALESCE(p_discount_amount, 0),
    tax_rate = COALESCE(p_tax_rate, 0),
    notes = COALESCE(p_notes, ''),
    terms = COALESCE(p_terms, '')
  WHERE id = p_proposal_id;

  -- Replace items: delete old, insert new
  DELETE FROM proposal_items WHERE proposal_id = p_proposal_id;

  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order)
  SELECT
    p_proposal_id,
    item->>'description',
    COALESCE(item->>'detail', ''),
    (item->>'quantity')::numeric,
    (item->>'rate')::numeric,
    COALESCE((item->>'discount')::numeric, 0),
    COALESCE((item->>'sort_order')::int, 0)
  FROM jsonb_array_elements(p_items) AS item;

  -- Recompute totals server-side
  PERFORM recompute_proposal_totals(p_proposal_id);

  -- Return updated proposal
  SELECT * INTO v_result FROM proposals WHERE id = p_proposal_id;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_proposal_with_items(uuid, uuid, text, text, date, numeric, numeric, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_proposal_with_items(uuid, uuid, text, text, date, numeric, numeric, text, text, jsonb) TO authenticated;

-- ============================================================================
-- DUPLICATE_PROPOSAL
-- ============================================================================

CREATE OR REPLACE FUNCTION duplicate_proposal(p_proposal_id uuid)
RETURNS proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source proposals%ROWTYPE;
  v_new_id uuid;
  v_new_number text;
  v_result proposals%ROWTYPE;
BEGIN
  -- Fetch source and check ownership
  SELECT * INTO v_source FROM proposals WHERE id = p_proposal_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal was not found';
  END IF;

  -- Generate new number
  v_new_number := generate_proposal_number();

  -- Insert new draft proposal
  INSERT INTO proposals (
    client_id, title, status, proposal_number, currency,
    expiry_date, discount_amount, tax_rate, notes, terms
  )
  VALUES (
    v_source.client_id, v_source.title, 'draft', v_new_number, v_source.currency,
    v_source.expiry_date, v_source.discount_amount, v_source.tax_rate,
    v_source.notes, v_source.terms
  )
  RETURNING id INTO v_new_id;

  -- Copy items
  INSERT INTO proposal_items (proposal_id, description, detail, quantity, rate, discount, sort_order)
  SELECT
    v_new_id,
    pi.description,
    pi.detail,
    pi.quantity,
    pi.rate,
    pi.discount,
    pi.sort_order
  FROM proposal_items pi
  WHERE pi.proposal_id = p_proposal_id
  ORDER BY pi.sort_order;

  -- Recompute totals
  PERFORM recompute_proposal_totals(v_new_id);

  -- Log activity
  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (v_new_id, auth.uid(), 'created', jsonb_build_object('duplicated_from', p_proposal_id));

  -- Return new proposal
  SELECT * INTO v_result FROM proposals WHERE id = v_new_id;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION duplicate_proposal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION duplicate_proposal(uuid) TO authenticated;
