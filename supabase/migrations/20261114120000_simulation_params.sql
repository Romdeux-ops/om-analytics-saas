-- Paramètres du modèle de prédiction (Dixon-Coles), régénérés par la synchro quand de nouveaux résultats arrivent.

CREATE TABLE simulation_params (
  key TEXT PRIMARY KEY,
  params JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE simulation_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_params_public_read" ON simulation_params FOR SELECT USING (true);

GRANT SELECT ON TABLE public.simulation_params TO anon, authenticated;
