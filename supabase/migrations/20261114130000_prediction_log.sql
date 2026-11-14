-- Journal prospectif des prédictions de Ligue 1 : écriture seule.
-- Chaque ligne est une prédiction écrite AVANT le coup d'envoi. Rien n'est jamais modifié ni supprimé :
-- en fin de saison, on évalue la dernière prédiction écrite avant chaque match.

CREATE TABLE prediction_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Identifiant football-data.org du match.
  match_id TEXT NOT NULL,
  season TEXT NOT NULL,
  matchday INTEGER NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  written_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  -- Empreinte des paramètres du modèle (forces, niveau de ligue) et des hyperparamètres gelés.
  params_hash TEXT NOT NULL,
  hyper_hash TEXT NOT NULL,
  data_through DATE,
  -- Grille de scores complète : grid[x][y] = P(score x-y).
  grid JSONB NOT NULL,
  p_home DOUBLE PRECISION NOT NULL,
  p_draw DOUBLE PRECISION NOT NULL,
  p_away DOUBLE PRECISION NOT NULL,
  -- Intervalle à 90 % de chaque issue : {"home":[lo,hi],"draw":[lo,hi],"away":[lo,hi]}.
  probability_interval JSONB NOT NULL,
  lambda_home DOUBLE PRECISION NOT NULL,
  lambda_away DOUBLE PRECISION NOT NULL,
  CONSTRAINT prediction_log_probabilities CHECK (
    p_home >= 0 AND p_draw >= 0 AND p_away >= 0 AND abs(p_home + p_draw + p_away - 1) < 0.001
  ),
  -- Une même prédiction (mêmes paramètres, même coup d'envoi) n'est écrite qu'une fois.
  CONSTRAINT prediction_log_once UNIQUE (match_id, params_hash, kickoff)
);

CREATE INDEX prediction_log_match ON prediction_log (season, match_id, written_at);

-- Écriture refusée dès que le match a commencé ; l'horodatage est imposé par la base (pas d'antidatage).
CREATE FUNCTION prediction_log_before_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.written_at := clock_timestamp();
  IF NEW.kickoff <= NEW.written_at THEN
    RAISE EXCEPTION 'prediction_log : écriture refusée, le match % a commencé (coup d''envoi %)', NEW.match_id, NEW.kickoff
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prediction_log_insert_guard BEFORE INSERT ON prediction_log
  FOR EACH ROW EXECUTE FUNCTION prediction_log_before_insert();

-- Ni mise à jour, ni suppression, ni vidage : y compris pour le rôle qui écrit.
CREATE FUNCTION prediction_log_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'prediction_log est en écriture seule : % interdit', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER prediction_log_no_update BEFORE UPDATE ON prediction_log
  FOR EACH ROW EXECUTE FUNCTION prediction_log_immutable();
CREATE TRIGGER prediction_log_no_delete BEFORE DELETE ON prediction_log
  FOR EACH ROW EXECUTE FUNCTION prediction_log_immutable();
CREATE TRIGGER prediction_log_no_truncate BEFORE TRUNCATE ON prediction_log
  FOR EACH STATEMENT EXECUTE FUNCTION prediction_log_immutable();

ALTER TABLE prediction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prediction_log_public_read" ON prediction_log FOR SELECT USING (true);

REVOKE ALL ON TABLE public.prediction_log FROM anon, authenticated;
GRANT SELECT ON TABLE public.prediction_log TO anon, authenticated;
