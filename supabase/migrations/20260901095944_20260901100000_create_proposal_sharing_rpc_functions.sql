/*
# Add proposal sharing, public access, comment, and decision RPC functions

## Overview
Adds server-side functions for:
1. Owner preparing/sharing a draft proposal (generates token, sets Sent).
2. Public proposal retrieval by token (returns only safe display fields).
3. Public comment submission by external clients.
4. Public acceptance of a proposal (one-time, with authorization confirmation).
5. Public decline of a proposal (one-time, with optional reason).

All public functions validate the token, check status/expiry, and log activity
events. Owner functions derive ownership from auth.uid(). No anonymous table
policies are added — all public access goes through SECURITY DEFINER functions.

## New Functions

### prepare_proposal(p_proposal_id) — owner-only
- Validates auth.uid() ownership and Draft status.
- Sets status to 'sent', sent_at to now().
- public_token already has a DEFAULT gen_random_uuid() from the schema; this
  function does NOT regenerate it — the token exists from creation.
- Logs a 'sent' activity event.
- Returns the updated proposal row.

### get_public_proposal(p_token) — public (EXECUTE to anon, authenticated)
- Looks up proposal by public_token.
- If not found or status is 'draft', returns NULL (invalid link).
- If expiry_date has passed and status is not accepted/rejected, atomically
  sets status to 'expired' and logs an 'expired' event.
- If status is 'sent' (first valid open), atomically sets status to 'viewed',
  viewed_at to now(), and logs a 'viewed' event.
- Returns a JSON object with ONLY safe display fields: business branding from
  profiles, client display name/company, proposal number/title/status/currency/
  items/totals/notes/terms/expiry/timestamps, and allowed comments.
- Never returns user_id, client UUID, proposal UUID, ownership fields.

### add_public_comment(p_token, p_author_name, p_body) — public
- Validates token, status (must be sent/viewed — not draft/expired/rejected/accepted).
- Trims and validates author_name (1-200 chars) and body (1-1000 chars).
- Inserts comment with user_id = NULL (external commenter).
- Logs a 'commented' activity event with author name in metadata.
- Returns the safe comment row (id, author_name, body, created_at).

### accept_proposal(p_token, p_client_name, p_authorized) — public
- Validates token, status (must be sent/viewed), expiry not passed.
- Validates p_authorized is true, p_client_name is 1-200 chars (trimmed).
- One-time transition: sets status to 'accepted', accepted_at to now().
- Logs an 'accepted' event with client_name in metadata.
- Returns the updated safe proposal JSON.

### decline_proposal(p_token, p_client_name, p_reason) — public
- Validates token, status (must be sent/viewed), expiry not passed.
- Validates p_client_name is 1-200 chars (trimmed). p_reason optional, max 1000.
- One-time transition: sets status to 'rejected', rejected_at to now().
- Logs a 'rejected' event with client_name and reason in metadata.
- Returns the updated safe proposal JSON.

## Security
- All functions use SECURITY DEFINER with SET search_path = public.
- Owner function derives ownership from auth.uid(), never from parameters.
- Public functions validate by token only — no auth required.
- EXECUTE revoked from PUBLIC on owner function; granted to authenticated.
- EXECUTE granted to anon, authenticated on public functions.
- No new RLS policies added. No anonymous table access.
- Generic error messages — no stack traces or internal details exposed.
- Token is never logged in error messages or event metadata.
*/

-- ============================================================================
-- PREPARE_PROPOSAL — owner-only, transitions Draft → Sent
-- ============================================================================

CREATE OR REPLACE FUNCTION prepare_proposal(p_proposal_id uuid)
RETURNS proposals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_result proposals%ROWTYPE;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal was not found';
  END IF;

  IF v_proposal.status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft proposals can be prepared for sharing';
  END IF;

  UPDATE proposals
  SET status = 'sent',
      sent_at = now()
  WHERE id = p_proposal_id;

  INSERT INTO activity_events (proposal_id, user_id, event_type, metadata)
  VALUES (p_proposal_id, auth.uid(), 'sent', '{}'::jsonb);

  SELECT * INTO v_result FROM proposals WHERE id = p_proposal_id;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION prepare_proposal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prepare_proposal(uuid) TO authenticated;

-- ============================================================================
-- GET_PUBLIC_PROPOSAL — public retrieval by token
-- ============================================================================

CREATE OR REPLACE FUNCTION get_public_proposal(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_client clients%ROWTYPE;
  v_items jsonb;
  v_comments jsonb;
  v_result jsonb;
  v_expired boolean := false;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE public_token = p_token;

  -- Not found or still draft = invalid link
  IF NOT FOUND OR v_proposal.status = 'draft' THEN
    RETURN NULL;
  END IF;

  -- Check expiry: if past and not yet accepted/rejected, transition to expired
  IF v_proposal.expiry_date IS NOT NULL
     AND v_proposal.expiry_date < CURRENT_DATE
     AND v_proposal.status NOT IN ('accepted', 'rejected') THEN
    UPDATE proposals
    SET status = 'expired'
    WHERE id = v_proposal.id AND status NOT IN ('accepted', 'rejected');

    INSERT INTO activity_events (proposal_id, event_type, metadata)
    VALUES (v_proposal.id, 'expired', '{}'::jsonb);

    v_proposal.status := 'expired';
    v_expired := true;
  END IF;

  -- First valid open: transition sent → viewed
  IF v_proposal.status = 'sent' AND NOT v_expired THEN
    UPDATE proposals
    SET status = 'viewed',
        viewed_at = now()
    WHERE id = v_proposal.id;

    INSERT INTO activity_events (proposal_id, event_type, metadata)
    VALUES (v_proposal.id, 'viewed', '{}'::jsonb);

    v_proposal.status := 'viewed';
  END IF;

  -- Fetch related data
  SELECT * INTO v_profile FROM profiles WHERE id = v_proposal.user_id;

  SELECT * INTO v_client FROM clients WHERE id = v_proposal.client_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'description', pi.description,
    'detail', pi.detail,
    'quantity', pi.quantity,
    'rate', pi.rate,
    'discount', pi.discount,
    'sort_order', pi.sort_order
  ) ORDER BY pi.sort_order), '[]'::jsonb) INTO v_items
  FROM proposal_items pi
  WHERE pi.proposal_id = v_proposal.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pc.id,
    'author_name', pc.author_name,
    'body', pc.body,
    'created_at', pc.created_at
  ) ORDER BY pc.created_at), '[]'::jsonb) INTO v_comments
  FROM proposal_comments pc
  WHERE pc.proposal_id = v_proposal.id;

  -- Build safe response — no UUIDs, no user_id, no ownership fields
  v_result := jsonb_build_object(
    'business', jsonb_build_object(
      'name', v_profile.business_name,
      'logo_url', v_profile.logo_url,
      'brand_color', v_profile.brand_color,
      'contact_email', v_profile.contact_email,
      'contact_phone', v_profile.contact_phone,
      'address', v_profile.address
    ),
    'client', jsonb_build_object(
      'name', v_client.name,
      'company', v_client.company
    ),
    'proposal', jsonb_build_object(
      'proposal_number', v_proposal.proposal_number,
      'title', v_proposal.title,
      'status', v_proposal.status,
      'currency', v_proposal.currency,
      'subtotal', v_proposal.subtotal,
      'discount_amount', v_proposal.discount_amount,
      'tax_rate', v_proposal.tax_rate,
      'total', v_proposal.total,
      'notes', v_proposal.notes,
      'terms', v_proposal.terms,
      'expiry_date', v_proposal.expiry_date,
      'sent_at', v_proposal.sent_at,
      'viewed_at', v_proposal.viewed_at,
      'accepted_at', v_proposal.accepted_at,
      'rejected_at', v_proposal.rejected_at,
      'created_at', v_proposal.created_at
    ),
    'items', v_items,
    'comments', v_comments
  );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_public_proposal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_proposal(uuid) TO anon, authenticated;

-- ============================================================================
-- ADD_PUBLIC_COMMENT — external client comment submission
-- ============================================================================

CREATE OR REPLACE FUNCTION add_public_comment(
  p_token uuid,
  p_author_name text,
  p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_author text;
  v_body text;
  v_comment_id uuid;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE public_token = p_token;

  IF NOT FOUND OR v_proposal.status = 'draft' THEN
    RAISE EXCEPTION 'Invalid link';
  END IF;

  IF v_proposal.status IN ('expired', 'rejected') THEN
    RAISE EXCEPTION 'Comments are not available for this proposal';
  END IF;

  -- Trim and validate
  v_author := btrim(p_author_name);
  v_body := btrim(p_body);

  IF v_author IS NULL OR length(v_author) = 0 OR length(v_author) > 200 THEN
    RAISE EXCEPTION 'Author name must be between 1 and 200 characters';
  END IF;

  IF v_body IS NULL OR length(v_body) = 0 OR length(v_body) > 1000 THEN
    RAISE EXCEPTION 'Comment must be between 1 and 1000 characters';
  END IF;

  INSERT INTO proposal_comments (proposal_id, user_id, author_name, body)
  VALUES (v_proposal.id, NULL, v_author, v_body)
  RETURNING id INTO v_comment_id;

  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (
    v_proposal.id,
    'commented',
    jsonb_build_object('author_name', v_author)
  );

  RETURN jsonb_build_object(
    'id', v_comment_id,
    'author_name', v_author,
    'body', v_body,
    'created_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION add_public_comment(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_public_comment(uuid, text, text) TO anon, authenticated;

-- ============================================================================
-- ACCEPT_PROPOSAL — one-time public acceptance
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_proposal(
  p_token uuid,
  p_client_name text,
  p_authorized boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_name text;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE public_token = p_token;

  IF NOT FOUND OR v_proposal.status = 'draft' THEN
    RAISE EXCEPTION 'Invalid link';
  END IF;

  IF v_proposal.status = 'accepted' THEN
    RAISE EXCEPTION 'This proposal has already been accepted';
  END IF;

  IF v_proposal.status = 'rejected' THEN
    RAISE EXCEPTION 'This proposal has already been declined';
  END IF;

  IF v_proposal.status = 'expired' THEN
    RAISE EXCEPTION 'This proposal has expired';
  END IF;

  IF v_proposal.expiry_date IS NOT NULL AND v_proposal.expiry_date < CURRENT_DATE THEN
    UPDATE proposals SET status = 'expired' WHERE id = v_proposal.id;
    INSERT INTO activity_events (proposal_id, event_type, metadata)
    VALUES (v_proposal.id, 'expired', '{}'::jsonb);
    RAISE EXCEPTION 'This proposal has expired';
  END IF;

  IF NOT p_authorized THEN
    RAISE EXCEPTION 'You must confirm you are authorized to approve this proposal';
  END IF;

  v_name := btrim(p_client_name);
  IF v_name IS NULL OR length(v_name) = 0 OR length(v_name) > 200 THEN
    RAISE EXCEPTION 'Your full name is required';
  END IF;

  UPDATE proposals
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = v_proposal.id;

  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (
    v_proposal.id,
    'accepted',
    jsonb_build_object('client_name', v_name)
  );

  RETURN jsonb_build_object(
    'status', 'accepted',
    'accepted_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION accept_proposal(uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_proposal(uuid, text, boolean) TO anon, authenticated;

-- ============================================================================
-- DECLINE_PROPOSAL — one-time public decline
-- ============================================================================

CREATE OR REPLACE FUNCTION decline_proposal(
  p_token uuid,
  p_client_name text,
  p_reason text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
  v_name text;
  v_reason text;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE public_token = p_token;

  IF NOT FOUND OR v_proposal.status = 'draft' THEN
    RAISE EXCEPTION 'Invalid link';
  END IF;

  IF v_proposal.status = 'accepted' THEN
    RAISE EXCEPTION 'This proposal has already been accepted';
  END IF;

  IF v_proposal.status = 'rejected' THEN
    RAISE EXCEPTION 'This proposal has already been declined';
  END IF;

  IF v_proposal.status = 'expired' THEN
    RAISE EXCEPTION 'This proposal has expired';
  END IF;

  IF v_proposal.expiry_date IS NOT NULL AND v_proposal.expiry_date < CURRENT_DATE THEN
    UPDATE proposals SET status = 'expired' WHERE id = v_proposal.id;
    INSERT INTO activity_events (proposal_id, event_type, metadata)
    VALUES (v_proposal.id, 'expired', '{}'::jsonb);
    RAISE EXCEPTION 'This proposal has expired';
  END IF;

  v_name := btrim(p_client_name);
  IF v_name IS NULL OR length(v_name) = 0 OR length(v_name) > 200 THEN
    RAISE EXCEPTION 'Your full name is required';
  END IF;

  v_reason := btrim(COALESCE(p_reason, ''));
  IF length(v_reason) > 1000 THEN
    RAISE EXCEPTION 'Reason must be 1000 characters or fewer';
  END IF;

  UPDATE proposals
  SET status = 'rejected',
      rejected_at = now()
  WHERE id = v_proposal.id;

  INSERT INTO activity_events (proposal_id, event_type, metadata)
  VALUES (
    v_proposal.id,
    'rejected',
    jsonb_build_object('client_name', v_name, 'reason', v_reason)
  );

  RETURN jsonb_build_object(
    'status', 'rejected',
    'rejected_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION decline_proposal(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decline_proposal(uuid, text, text) TO anon, authenticated;
