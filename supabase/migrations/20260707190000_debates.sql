-- Fan Zone debates : question admin + réponses supporters

CREATE TABLE debates (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE debate_posts (
  id SERIAL PRIMARY KEY,
  debate_id INTEGER NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES debate_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debates_room_id ON debates(room_id);
CREATE INDEX idx_debate_posts_debate_id ON debate_posts(debate_id);
CREATE INDEX idx_debate_posts_parent_id ON debate_posts(parent_id) WHERE parent_id IS NOT NULL;

ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debates_public_read" ON debates FOR SELECT
  USING (is_active = true);

CREATE POLICY "debates_admin_read_all" ON debates FOR SELECT
  USING (is_admin());

CREATE POLICY "debates_admin_all" ON debates FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "debate_posts_public_read" ON debate_posts FOR SELECT
  USING (true);

CREATE POLICY "debate_posts_auth_insert" ON debate_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "debate_posts_admin_delete" ON debate_posts FOR DELETE
  USING (is_admin());

-- Validation : 1 niveau de réponse, même débat
CREATE OR REPLACE FUNCTION validate_debate_post_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_debate INTEGER;
  parent_parent INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'parent_id cannot equal id';
  END IF;

  SELECT debate_id, parent_id INTO parent_debate, parent_parent
  FROM debate_posts WHERE id = NEW.parent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'parent not found';
  END IF;

  IF parent_parent IS NOT NULL THEN
    RAISE EXCEPTION 'nested replies not allowed';
  END IF;

  IF parent_debate IS DISTINCT FROM NEW.debate_id THEN
    RAISE EXCEPTION 'parent debate mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER debate_posts_validate_parent
  BEFORE INSERT ON debate_posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_debate_post_parent();

ALTER PUBLICATION supabase_realtime ADD TABLE debate_posts;

GRANT SELECT ON debates TO anon, authenticated;
GRANT SELECT, INSERT ON debate_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON debates TO authenticated;
GRANT DELETE ON debate_posts TO authenticated;
