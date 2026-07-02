-- Seed de démonstration (équivalent de Backend/om_engine/management/commands/init_data.py)

INSERT INTO clubs (name, budget_transfert, masse_salariale_actuelle, plafond_salarial_dncg, reputation)
VALUES
  ('Olympique de Marseille', 15000000, 80000000, 100000000, 85),
  ('Paris Saint-Germain', 200000000, 300000000, 500000000, 90);

INSERT INTO players (club_id, name, position, overall_rating, market_value, wage)
SELECT c.id, p.name, p.position::player_position, p.rating, p.market_value, p.wage
FROM clubs c
CROSS JOIN (VALUES
  ('Pau López', 'GK', 82, 41000000, 3000000),
  ('Jonathan Clauss', 'DEF', 83, 41500000, 3800000),
  ('Chancel Mbemba', 'DEF', 84, 42000000, 4500000),
  ('Leonardo Balerdi', 'DEF', 81, 40500000, 3500000),
  ('Quentin Merlin', 'DEF', 79, 39500000, 2000000),
  ('Geoffrey Kondogbia', 'MID', 82, 41000000, 5000000),
  ('Jordan Veretout', 'MID', 82, 41000000, 4200000),
  ('Valentin Rongier', 'MID', 83, 41500000, 4000000),
  ('Amine Harit', 'MID', 80, 40000000, 3000000),
  ('Pierre-Emerick Aubameyang', 'FWD', 86, 43000000, 8000000),
  ('Ismaïla Sarr', 'FWD', 79, 39500000, 3500000)
) AS p(name, position, rating, market_value, wage)
WHERE c.name = 'Olympique de Marseille';

INSERT INTO players (club_id, name, position, overall_rating, market_value, wage)
SELECT c.id, p.name, p.position::player_position, p.rating, p.market_value, p.wage
FROM clubs c
CROSS JOIN (VALUES
  ('Gianluigi Donnarumma', 'GK', 88, 88000000, 10000000),
  ('Marquinhos', 'DEF', 87, 87000000, 12000000),
  ('Achraf Hakimi', 'DEF', 86, 86000000, 10000000),
  ('Warren Zaïre-Emery', 'MID', 82, 82000000, 5000000),
  ('Vitinha', 'MID', 84, 84000000, 7000000),
  ('Kylian Mbappé', 'FWD', 94, 94000000, 50000000),
  ('Ousmane Dembélé', 'FWD', 86, 86000000, 15000000)
) AS p(name, position, rating, market_value, wage)
WHERE c.name = 'Paris Saint-Germain';

INSERT INTO matches (home_team_id, away_team_id, date, played)
SELECT om.id, psg.id, now() + interval '1 day', false
FROM clubs om, clubs psg
WHERE om.name = 'Olympique de Marseille'
  AND psg.name = 'Paris Saint-Germain';

-- Salons Fan Zone de démonstration
INSERT INTO rooms (name, slug, description)
VALUES
  ('Tribune Principale', 'tribune-principale', 'Débats généraux autour de l''OM'),
  ('Analyse Tactique', 'analyse-tactique', 'Discussions sur les compositions et le jeu');
