/*
# Auto-create profile on signup

## Overview
When a new user signs up via Supabase Auth, a corresponding row in the `profiles`
table must be created automatically with default branding settings. This migration
creates a database trigger that fires on INSERT into `auth.users` and inserts a
new `profiles` row with the user's ID and default values.

## Security
- The trigger function runs as SECURITY DEFINER (the table owner) so it can insert
  into `profiles` even though the `profiles` table has no INSERT policy for
  authenticated users. This is intentional: profiles are created by the system on
  signup, never by the client.
- The function only inserts — it does not expose any data or allow user-controlled
  values. All profile fields are set to their defaults.
- The function has a fixed search_path to prevent search_path injection.

## Important Notes
1. This trigger fires AFTER INSERT on auth.users, so the auth account exists before
   the profile is created.
2. The function is idempotent — it uses ON CONFLICT DO NOTHING, so if a profile
   already exists (e.g., from a re-run), it will not fail.
3. The profile's `id` is set to the new user's `id` from auth.users, establishing
   the one-to-one relationship.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
