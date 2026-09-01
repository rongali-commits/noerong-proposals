/*
# Add dashboard aggregation and settings update RPC functions

## Overview
Adds two server-side SECURITY DEFINER functions:
1. `get_dashboard_data()` — aggregates all dashboard metrics in a single call,
   scoped to auth.uid(). Returns pipeline value by currency, accepted value by
   currency, acceptance rate, status counts, active client count, expiring
   proposals, recent proposals, and recent activity events.
2. `update_profile()` — updates the authenticated user's profile with
   server-side validation of all fields. Owner derived from auth.uid(), never
   from parameters.

## New Functions

### get_dashboard_data() — authenticated only
Returns a JSONB object with:
- `pipeline_by_currency`: array of {currency, total} for Sent+Viewed proposals
- `accepted_by_currency`: array of {currency, total} for Accepted proposals
- `acceptance_rate`: numeric (accepted / (accepted + rejected) * 100), or null
  if no final decisions exist
- `status_counts`: object with counts for draft, sent, viewed, accepted, rejected, expired
- `active_clients`: integer count of non-archived clients
- `expiring_proposals`: array of proposals expiring within 7 days that are not
  finalized (not accepted/rejected/expired), with client name
- `recent_proposals`: array of 5 most recently updated proposals with client name
- `recent_activity`: array of 10 most recent activity events with proposal title

All queries are scoped to auth.uid(). No anonymous access.

### update_profile(p_business_name, p_logo_url, p_brand_color, p_contact_email,
                   p_contact_phone, p_address, p_default_currency,
                   p_default_tax_rate, p_default_terms, p_proposal_prefix)
- Validates auth.uid() ownership (RLS also enforces this).
- Normalizes proposal_prefix to uppercase alphanumeric, 2-8 chars.
- Validates brand_color as a hex color (#RRGGBB or #RGB).
- Validates default_tax_rate between 0 and 100.
- Validates contact_email format if provided.
- Validates default_currency is non-empty and at most 3 chars.
- Returns the updated profile row.

## Security
- Both functions use SECURITY DEFINER with SET search_path = public.
- Owner derived from auth.uid(), never from parameters.
- EXECUTE revoked from PUBLIC; granted to authenticated only.
- No new RLS policies added. No anonymous table access.
*/

-- ============================================================================
-- GET_DASHBOARD_DATA — aggregated metrics for the owner dashboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pipeline jsonb;
  v_accepted jsonb;
  v_accepted_count integer;
  v_rejected_count integer;
  v_acceptance_rate numeric;
  v_status_counts jsonb;
  v_active_clients integer;
  v_expiring jsonb;
  v_recent_proposals jsonb;
  v_recent_activity jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Pipeline value by currency (Sent + Viewed only)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('currency', currency, 'total', sum_total)), '[]'::jsonb)
  INTO v_pipeline
  FROM (
    SELECT currency, SUM(total) AS sum_total
    FROM proposals
    WHERE user_id = v_uid AND status IN ('sent', 'viewed')
    GROUP BY currency
  ) p;

  -- Accepted value by currency
  SELECT COALESCE(jsonb_agg(jsonb_build_object('currency', currency, 'total', sum_total)), '[]'::jsonb)
  INTO v_accepted
  FROM (
    SELECT currency, SUM(total) AS sum_total
    FROM proposals
    WHERE user_id = v_uid AND status = 'accepted'
    GROUP BY currency
  ) p;

  -- Acceptance rate: accepted / (accepted + rejected) * 100
  SELECT COUNT(*) INTO v_accepted_count
  FROM proposals WHERE user_id = v_uid AND status = 'accepted';

  SELECT COUNT(*) INTO v_rejected_count
  FROM proposals WHERE user_id = v_uid AND status = 'rejected';

  IF (v_accepted_count + v_rejected_count) > 0 THEN
    v_acceptance_rate := round(
      v_accepted_count::numeric / (v_accepted_count + v_rejected_count) * 100,
      1
    );
  ELSE
    v_acceptance_rate := NULL;
  END IF;

  -- Status counts
  SELECT jsonb_build_object(
    'draft', COUNT(*) FILTER (WHERE status = 'draft'),
    'sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'viewed', COUNT(*) FILTER (WHERE status = 'viewed'),
    'accepted', COUNT(*) FILTER (WHERE status = 'accepted'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'expired', COUNT(*) FILTER (WHERE status = 'expired')
  ) INTO v_status_counts
  FROM proposals WHERE user_id = v_uid;

  -- Active clients
  SELECT COUNT(*) INTO v_active_clients
  FROM clients WHERE user_id = v_uid AND archived = false;

  -- Expiring within 7 days (not finalized)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id,
    'title', pr.title,
    'proposal_number', pr.proposal_number,
    'status', pr.status,
    'currency', pr.currency,
    'total', pr.total,
    'expiry_date', pr.expiry_date,
    'client_name', cl.name
  ) ORDER BY pr.expiry_date), '[]'::jsonb)
  INTO v_expiring
  FROM proposals pr
  LEFT JOIN clients cl ON cl.id = pr.client_id
  WHERE pr.user_id = v_uid
    AND pr.expiry_date IS NOT NULL
    AND pr.expiry_date >= CURRENT_DATE
    AND pr.expiry_date <= CURRENT_DATE + 7
    AND pr.status NOT IN ('accepted', 'rejected', 'expired');

  -- Recent proposals (5 most recently updated)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id,
    'title', pr.title,
    'proposal_number', pr.proposal_number,
    'status', pr.status,
    'currency', pr.currency,
    'total', pr.total,
    'updated_at', pr.updated_at,
    'client_name', cl.name
  ) ORDER BY pr.updated_at DESC), '[]'::jsonb)
  INTO v_recent_proposals
  FROM proposals pr
  LEFT JOIN clients cl ON cl.id = pr.client_id
  WHERE pr.user_id = v_uid
  LIMIT 5;

  -- Recent activity (10 most recent)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ae.id,
    'event_type', ae.event_type,
    'created_at', ae.created_at,
    'proposal_title', pr.title,
    'proposal_id', pr.id
  ) ORDER BY ae.created_at DESC), '[]'::jsonb)
  INTO v_recent_activity
  FROM activity_events ae
  JOIN proposals pr ON pr.id = ae.proposal_id
  WHERE ae.proposal_id IN (SELECT id FROM proposals WHERE user_id = v_uid)
  LIMIT 10;

  RETURN jsonb_build_object(
    'pipeline_by_currency', v_pipeline,
    'accepted_by_currency', v_accepted,
    'acceptance_rate', v_acceptance_rate,
    'status_counts', v_status_counts,
    'active_clients', v_active_clients,
    'expiring_proposals', v_expiring,
    'recent_proposals', v_recent_proposals,
    'recent_activity', v_recent_activity
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_dashboard_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO authenticated;

-- ============================================================================
-- UPDATE_PROFILE — owner-only profile update with validation
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profile(
  p_business_name text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_brand_color text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_default_currency text DEFAULT NULL,
  p_default_tax_rate numeric DEFAULT NULL,
  p_default_terms text DEFAULT NULL,
  p_proposal_prefix text DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing profiles%ROWTYPE;
  v_prefix text;
  v_color text;
  v_currency text;
  v_tax numeric;
  v_email text;
  v_result profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_existing FROM profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Normalize and validate proposal_prefix
  IF p_proposal_prefix IS NOT NULL THEN
    v_prefix := upper(regexp_replace(p_proposal_prefix, '[^A-Z0-9]', '', 'gi'));
    IF length(v_prefix) < 2 OR length(v_prefix) > 8 THEN
      RAISE EXCEPTION 'Proposal prefix must be 2 to 8 letters or numbers';
    END IF;
  ELSE
    v_prefix := v_existing.proposal_prefix;
  END IF;

  -- Validate brand_color
  IF p_brand_color IS NOT NULL THEN
    v_color := lower(p_brand_color);
    IF v_color !~ '^#[0-9a-f]{3}([0-9a-f]{3})?$' THEN
      RAISE EXCEPTION 'Brand color must be a valid hex color (e.g. #a8d61f)';
    END IF;
  ELSE
    v_color := v_existing.brand_color;
  END IF;

  -- Validate default_currency
  IF p_default_currency IS NOT NULL THEN
    v_currency := upper(btrim(p_default_currency));
    IF length(v_currency) = 0 OR length(v_currency) > 3 THEN
      RAISE EXCEPTION 'Currency must be a 3-letter code';
    END IF;
  ELSE
    v_currency := v_existing.default_currency;
  END IF;

  -- Validate default_tax_rate
  IF p_default_tax_rate IS NOT NULL THEN
    v_tax := p_default_tax_rate;
    IF v_tax < 0 OR v_tax > 100 THEN
      RAISE EXCEPTION 'Tax rate must be between 0 and 100';
    END IF;
  ELSE
    v_tax := v_existing.default_tax_rate;
  END IF;

  -- Validate contact_email
  IF p_contact_email IS NOT NULL AND btrim(p_contact_email) <> '' THEN
    v_email := btrim(p_contact_email);
    IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      RAISE EXCEPTION 'Contact email must be a valid email address';
    END IF;
  ELSE
    v_email := COALESCE(p_contact_email, v_existing.contact_email);
  END IF;

  -- Update the profile
  UPDATE profiles
  SET
    business_name = COALESCE(p_business_name, v_existing.business_name),
    logo_url = COALESCE(p_logo_url, v_existing.logo_url),
    brand_color = v_color,
    contact_email = v_email,
    contact_phone = COALESCE(p_contact_phone, v_existing.contact_phone),
    address = COALESCE(p_address, v_existing.address),
    default_currency = v_currency,
    default_tax_rate = v_tax,
    default_terms = COALESCE(p_default_terms, v_existing.default_terms),
    proposal_prefix = v_prefix
  WHERE id = v_uid;

  SELECT * INTO v_result FROM profiles WHERE id = v_uid;
  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_profile(text, text, text, text, text, text, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_profile(text, text, text, text, text, text, text, numeric, text, text) TO authenticated;
