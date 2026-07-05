-- Réponses (threads) + réactions emoji sur messages

ALTER TABLE messages
  ADD COLUMN parent_id INTEGER REFERENCES messages(id) ON DELETE CASCADE;

CREATE INDEX idx_messages_parent_id ON messages(parent_id);
CREATE INDEX idx_messages_room_top_level ON messages(room_id, created_at DESC)
  WHERE parent_id IS NULL;

CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_reactions_public_read" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "message_reactions_auth_insert" ON message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "message_reactions_auth_update" ON message_reactions FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "message_reactions_auth_delete" ON message_reactions FOR DELETE
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

GRANT SELECT ON TABLE public.message_reactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.message_reactions TO authenticated;
