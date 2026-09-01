-- Update get_dashboard_data to include has_sample_data and is_sample flags on recent proposals and expiring proposals
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
  v_has_sample boolean;
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

  -- Acceptance rate
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
    'client_name', cl.name,
    'is_sample', pr.is_sample
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
    'client_name', cl.name,
    'is_sample', pr.is_sample
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

  -- Has sample data
  SELECT has_sample_data() INTO v_has_sample;

  RETURN jsonb_build_object(
    'pipeline_by_currency', v_pipeline,
    'accepted_by_currency', v_accepted,
    'acceptance_rate', v_acceptance_rate,
    'status_counts', v_status_counts,
    'active_clients', v_active_clients,
    'expiring_proposals', v_expiring,
    'recent_proposals', v_recent_proposals,
    'recent_activity', v_recent_activity,
    'has_sample_data', v_has_sample
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_dashboard_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO authenticated;
