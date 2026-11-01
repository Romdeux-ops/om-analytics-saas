-- Pronostics des supporters (score avant coup d'envoi, points attribués par la sync)
-- et notes des joueurs après match (+ vote homme du match).
--
-- Les points ne sont calculés qu'à partir des résultats réels des snapshots football :
-- matches.home_score / away_score peuvent contenir un score simulé.

-- ---------------------------------------------------------------------------
-- Helpers de fenêtre temporelle (lisent matches.date sans dépendre de la RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION match_has_kicked_off(p_match_id INTEGER)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT date <= now() FROM public.matches WHERE id = p_match_id), false);
$$;

-- Notes ouvertes de coup d'envoi + 2 h à coup d'envoi + 72 h.
CREATE OR REPLACE FUNCTION rating_window_open(p_match_id INTEGER)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT now() >= date + interval '2 hours' AND now() < date + interval '72 hours'
      FROM public.matches
      WHERE id = p_match_id
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Pronostics
-- ---------------------------------------------------------------------------

CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_score SMALLINT NOT NULL CHECK (home_score BETWEEN 0 AND 15),
  away_score SMALLINT NOT NULL CHECK (away_score BETWEEN 0 AND 15),
  points SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);

-- Un supporter ne peut ni écrire après le coup d'envoi ni s'attribuer des points.
-- Sans auth.uid() (connexion directe de la sync), l'écriture est libre.
CREATE OR REPLACE FUNCTION guard_prediction_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF match_has_kicked_off(NEW.match_id) THEN
    RAISE EXCEPTION 'predictions closed for this match';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.points := NULL;
  ELSE
    NEW.points := OLD.points;
    NEW.match_id := OLD.match_id;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER predictions_guard_write
  BEFORE INSERT OR UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION guard_prediction_write();

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Les pronostics des autres restent cachés jusqu'au coup d'envoi.
CREATE POLICY "predictions_read" ON predictions FOR SELECT
  USING (auth.uid() = user_id OR match_has_kicked_off(match_id));

CREATE POLICY "predictions_self_insert" ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT match_has_kicked_off(match_id));

CREATE POLICY "predictions_self_update" ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND NOT match_has_kicked_off(match_id))
  WITH CHECK (auth.uid() = user_id AND NOT match_has_kicked_off(match_id));

CREATE POLICY "predictions_self_delete" ON predictions FOR DELETE
  USING (auth.uid() = user_id AND NOT match_has_kicked_off(match_id));

-- Répartition communautaire, uniquement après le coup d'envoi.
CREATE OR REPLACE FUNCTION prediction_distribution(p_match_id INTEGER)
RETURNS TABLE (
  total BIGINT,
  home_win BIGINT,
  draw BIGINT,
  away_win BIGINT,
  top_home_score SMALLINT,
  top_away_score SMALLINT,
  top_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH p AS (
    SELECT home_score, away_score
    FROM public.predictions
    WHERE match_id = p_match_id AND match_has_kicked_off(p_match_id)
  ),
  top AS (
    SELECT home_score, away_score, COUNT(*) AS c
    FROM p
    GROUP BY home_score, away_score
    ORDER BY c DESC, home_score, away_score
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*) FROM p),
    (SELECT COUNT(*) FROM p WHERE home_score > away_score),
    (SELECT COUNT(*) FROM p WHERE home_score = away_score),
    (SELECT COUNT(*) FROM p WHERE home_score < away_score),
    top.home_score,
    top.away_score,
    COALESCE(top.c, 0)
  FROM (SELECT 1) AS one
  LEFT JOIN top ON true;
$$;

-- Classement des pronostiqueurs sur les matchs corrigés depuis p_since.
CREATE OR REPLACE FUNCTION prediction_leaderboard(p_since TIMESTAMPTZ, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  exact_count BIGINT,
  outcome_count BIGINT,
  scored_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    SUM(p.points)::BIGINT AS total_points,
    COUNT(*) FILTER (WHERE p.points = 3) AS exact_count,
    COUNT(*) FILTER (WHERE p.points > 0) AS outcome_count,
    COUNT(*) AS scored_count
  FROM public.predictions p
  JOIN public.matches m ON m.id = p.match_id
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.points IS NOT NULL AND m.date >= p_since
  GROUP BY p.user_id, pr.display_name, pr.avatar_url
  ORDER BY total_points DESC, exact_count DESC, scored_count ASC, pr.display_name ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 200);
$$;

-- ---------------------------------------------------------------------------
-- Notes des joueurs & homme du match
-- ---------------------------------------------------------------------------

-- player_key = identifiant ESPN du joueur (RosterPlayer.id) ; player_name figé au vote.
CREATE TABLE player_ratings (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_key TEXT NOT NULL CHECK (char_length(player_key) BETWEEN 1 AND 64),
  player_name TEXT NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 80),
  rating NUMERIC(3, 1) NOT NULL CHECK (rating BETWEEN 1 AND 10 AND rating * 2 = floor(rating * 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id, player_key)
);

CREATE INDEX idx_player_ratings_match_player ON player_ratings(match_id, player_key);
CREATE INDEX idx_player_ratings_user_id ON player_ratings(user_id);

CREATE TABLE motm_votes (
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_key TEXT NOT NULL CHECK (char_length(player_key) BETWEEN 1 AND 64),
  player_name TEXT NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_ratings_public_read" ON player_ratings FOR SELECT USING (true);

CREATE POLICY "player_ratings_self_insert" ON player_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "player_ratings_self_update" ON player_ratings FOR UPDATE
  USING (auth.uid() = user_id AND rating_window_open(match_id))
  WITH CHECK (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "player_ratings_self_delete" ON player_ratings FOR DELETE
  USING (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "player_ratings_admin_delete" ON player_ratings FOR DELETE
  USING (is_admin());

CREATE POLICY "motm_votes_public_read" ON motm_votes FOR SELECT USING (true);

CREATE POLICY "motm_votes_self_insert" ON motm_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "motm_votes_self_update" ON motm_votes FOR UPDATE
  USING (auth.uid() = user_id AND rating_window_open(match_id))
  WITH CHECK (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "motm_votes_self_delete" ON motm_votes FOR DELETE
  USING (auth.uid() = user_id AND rating_window_open(match_id));

CREATE POLICY "motm_votes_admin_delete" ON motm_votes FOR DELETE
  USING (is_admin());

CREATE OR REPLACE FUNCTION player_rating_summary(p_match_id INTEGER)
RETURNS TABLE (player_key TEXT, player_name TEXT, avg_rating DOUBLE PRECISION, votes BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    player_key,
    MAX(player_name),
    ROUND(AVG(rating), 2)::DOUBLE PRECISION,
    COUNT(*)
  FROM public.player_ratings
  WHERE match_id = p_match_id
  GROUP BY player_key;
$$;

CREATE OR REPLACE FUNCTION motm_summary(p_match_id INTEGER)
RETURNS TABLE (player_key TEXT, player_name TEXT, votes BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT player_key, MAX(player_name), COUNT(*)
  FROM public.motm_votes
  WHERE match_id = p_match_id
  GROUP BY player_key
  ORDER BY COUNT(*) DESC, MAX(player_name) ASC;
$$;

-- Moyenne par joueur sur la saison (pondérée par vote) + nombre de matchs notés.
CREATE OR REPLACE FUNCTION player_season_ratings(p_since TIMESTAMPTZ)
RETURNS TABLE (player_key TEXT, player_name TEXT, avg_rating DOUBLE PRECISION, votes BIGINT, matches_rated BIGINT)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    r.player_key,
    MAX(r.player_name),
    ROUND(AVG(r.rating), 2)::DOUBLE PRECISION,
    COUNT(*),
    COUNT(DISTINCT r.match_id)
  FROM public.player_ratings r
  JOIN public.matches m ON m.id = r.match_id
  WHERE m.date >= p_since
  GROUP BY r.player_key;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT ON predictions, player_ratings, motm_votes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON predictions, player_ratings, motm_votes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE predictions_id_seq, player_ratings_id_seq TO authenticated;
GRANT ALL ON predictions, player_ratings, motm_votes TO service_role;

GRANT EXECUTE ON FUNCTION match_has_kicked_off(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rating_window_open(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION prediction_distribution(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION prediction_leaderboard(TIMESTAMPTZ, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION player_rating_summary(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION motm_summary(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION player_season_ratings(TIMESTAMPTZ) TO anon, authenticated;
