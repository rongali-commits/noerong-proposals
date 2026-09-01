-- Fix security defects found in pre-publish audit:
-- 1. Revoke EXECUTE from anon/PUBLIC on internal functions that should never be callable directly
-- 2. Add SET search_path = public to set_updated_at trigger function

-- handle_new_user: trigger function, should never be called directly by any role
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;

-- recompute_proposal_totals: internal helper, only called by other SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION recompute_proposal_totals(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION recompute_proposal_totals(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION recompute_proposal_totals(uuid) FROM authenticated;

-- validate_proposal_items: internal helper, only called by other SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION validate_proposal_items(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION validate_proposal_items(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION validate_proposal_items(jsonb) FROM authenticated;

-- set_updated_at: add fixed search_path to prevent search_path injection
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
