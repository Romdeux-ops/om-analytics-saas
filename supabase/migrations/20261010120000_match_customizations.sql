-- Table pour stocker les personnalisations staff/admin par match :
-- 1. Composition personnalisée (formation tactique, titulaires, remplaçants)
-- 2. Textes éditoriaux IA réécrits (titre, sous-titre, paragraphes, clés tactiques, joueur clé, pronostic)

CREATE TABLE IF NOT EXISTS match_customizations (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  custom_lineup JSONB,
  custom_editorial JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_customizations_match_id ON match_customizations(match_id);

ALTER TABLE match_customizations ENABLE ROW LEVEL SECURITY;

-- Lecture publique (supporters & admins)
CREATE POLICY "match_customizations_read_all" ON match_customizations
  FOR SELECT USING (true);

-- Écriture réservée aux administrateurs
CREATE POLICY "match_customizations_admin_all" ON match_customizations
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

GRANT SELECT ON match_customizations TO anon, authenticated;
GRANT ALL ON match_customizations TO service_role;
