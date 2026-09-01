-- Fix: add_public_comment should also block comments on accepted proposals.
-- The migration comment stated it blocks draft/expired/rejected/accepted,
-- but the code only blocked expired and rejected. Accepted is a final
-- decision state where comments should not be allowed.

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

  IF v_proposal.status IN ('expired', 'rejected', 'accepted') THEN
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
