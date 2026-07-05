-- Fan Zone Phase 2 : profiles, triggers, indexes

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION increment_poll_option_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM poll_options WHERE id = NEW.option_id AND poll_id = NEW.poll_id
  ) THEN
    RAISE EXCEPTION 'option does not belong to poll';
  END IF;
  UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION increment_poll_option_vote_count();

CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);
