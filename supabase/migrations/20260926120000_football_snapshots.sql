-- Données sportives synchronisées (football-data.org / ESPN) : calendrier OM + classement

CREATE TABLE football_snapshots (
  competition TEXT PRIMARY KEY CHECK (competition IN ('ligue1', 'europa', 'coupe')),
  fixtures JSONB NOT NULL DEFAULT '[]'::jsonb,
  standings JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE football_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "football_snapshots_public_read" ON football_snapshots FOR SELECT USING (true);

GRANT SELECT ON TABLE public.football_snapshots TO anon, authenticated;
