-- Actu du club : articles de presse (RSS) + actus générées depuis les résultats

CREATE TABLE news_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('article', 'auto')),
  title TEXT NOT NULL,
  excerpt TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mercato', 'match', 'club', 'blessure')),
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_items_published_at ON news_items(published_at);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_items_public_read" ON news_items FOR SELECT USING (true);

GRANT SELECT ON TABLE public.news_items TO anon, authenticated;
