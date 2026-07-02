-- Phase 1 : schéma initial (migration depuis modèles Django + préparation Fan Zone)

CREATE TYPE player_position AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- ==============================
--  Core (simulation)
-- ==============================

CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  budget_transfert BIGINT NOT NULL DEFAULT 0,
  masse_salariale_actuelle BIGINT NOT NULL DEFAULT 0,
  plafond_salarial_dncg BIGINT NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position player_position NOT NULL,
  overall_rating INTEGER NOT NULL,
  form_factor REAL NOT NULL DEFAULT 1.0,
  injury_prone REAL NOT NULL DEFAULT 0.1,
  market_value BIGINT NOT NULL,
  wage BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  home_team_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  away_team_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  played BOOLEAN NOT NULL DEFAULT false,
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  match_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_date ON matches(date);

-- ==============================
--  Fan Zone (Phase 2)
-- ==============================

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ
);

CREATE TABLE poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_polls_room_id ON polls(room_id);
CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);

-- ==============================
--  Row Level Security
-- ==============================

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Lecture publique des données sportives
CREATE POLICY "clubs_public_read" ON clubs FOR SELECT USING (true);
CREATE POLICY "players_public_read" ON players FOR SELECT USING (true);
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);
CREATE POLICY "rooms_public_read" ON rooms FOR SELECT USING (is_active = true);
CREATE POLICY "polls_public_read" ON polls FOR SELECT USING (is_active = true);
CREATE POLICY "poll_options_public_read" ON poll_options FOR SELECT USING (true);

-- Messages : lecture publique, écriture authentifiée
CREATE POLICY "messages_public_read" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_auth_insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes : lecture publique, un vote par utilisateur authentifié
CREATE POLICY "votes_public_read" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_auth_insert" ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Realtime pour la Fan Zone
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
