-- Likes séparés des réactions emoji (like + 1 emoji peuvent coexister)

CREATE TABLE message_likes (
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_message_likes_message_id ON message_likes(message_id);

-- Migrer les ❤️ existants
INSERT INTO message_likes (message_id, user_id, created_at)
SELECT message_id, user_id, created_at
FROM message_reactions
WHERE emoji = '❤️'
ON CONFLICT DO NOTHING;

DELETE FROM message_reactions WHERE emoji = '❤️';

ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_likes_public_read" ON message_likes FOR SELECT USING (true);
CREATE POLICY "message_likes_auth_insert" ON message_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "message_likes_auth_delete" ON message_likes FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE message_likes;

GRANT SELECT ON TABLE public.message_likes TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.message_likes TO authenticated;
