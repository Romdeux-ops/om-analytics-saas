-- Seed de démonstration (équivalent de Backend/om_engine/management/commands/init_data.py)

INSERT INTO clubs (name, budget_transfert, masse_salariale_actuelle, plafond_salarial_dncg, reputation, coach)
VALUES
  ('Olympique de Marseille', 15000000, 80000000, 100000000, 85, 'Bruno Genesio'),
  ('Paris Saint-Germain', 200000000, 300000000, 500000000, 90, NULL);

-- Effectif OM 2026-2027 (27 joueurs — remplace l'ancien effectif de démo)
INSERT INTO players (
  club_id, name, position, position_label, jersey_number, age,
  overall_rating, market_value, wage, matches_played, goals, assists
)
SELECT c.id, p.name, p.position::player_position, p.position_label, p.jersey_number, p.age,
       p.rating, p.market_value, p.wage, 0, 0, 0
FROM clubs c
CROSS JOIN (VALUES
  ('Mason Greenwood', 'FWD', 'Ailier droit', 10, 24, 75, 55000000::bigint, 0::bigint),
  ('Igor Paixão', 'FWD', 'Ailier gauche', 14, 26, 75, 35000000::bigint, 0::bigint),
  ('Amine Gouiri', 'FWD', 'Avant-centre', 9, 26, 75, 28000000::bigint, 0::bigint),
  ('Quinten Timber', 'MID', 'Milieu central', 27, 25, 75, 25000000::bigint, 0::bigint),
  ('Timothy Weah', 'MID', 'Milieu droit', NULL::integer, 26, 75, 20000000::bigint, 0::bigint),
  ('Leonardo Balerdi', 'DEF', 'Défenseur central', 5, 27, 75, 18000000::bigint, 0::bigint),
  ('Facundo Medina', 'DEF', 'Défenseur central', 32, 27, 75, 18000000::bigint, 0::bigint),
  ('Nayef Aguerd', 'DEF', 'Défenseur central', 21, 30, 75, 15000000::bigint, 0::bigint),
  ('Pierre-Emile Højbjerg', 'MID', 'Milieu défensif', 23, 30, 75, 15000000::bigint, 0::bigint),
  ('Hamed Traoré', 'FWD', 'Ailier gauche', NULL::integer, 26, 75, 15000000::bigint, 0::bigint),
  ('Angel Gomes', 'MID', 'Milieu offensif', NULL::integer, 25, 75, 10000000::bigint, 0::bigint),
  ('CJ Egan-Riley', 'DEF', 'Défenseur central', 4, 23, 75, 9000000::bigint, 0::bigint),
  ('Emerson', 'DEF', 'Arrière gauche', 33, 31, 75, 9000000::bigint, 0::bigint),
  ('Bamo Meïté', 'DEF', 'Défenseur central', NULL::integer, 24, 75, 7000000::bigint, 0::bigint),
  ('Gerónimo Rulli', 'GK', 'Gardien de but', 1, 34, 75, 6000000::bigint, 0::bigint),
  ('Himad Abdelli', 'MID', 'Milieu offensif', 8, 26, 75, 5000000::bigint, 0::bigint),
  ('Amine Harit', 'FWD', 'Ailier gauche', NULL::integer, 29, 75, 5000000::bigint, 0::bigint),
  ('Tochukwu Nnadi', 'MID', 'Milieu défensif', 6, 23, 75, 4500000::bigint, 0::bigint),
  ('Neal Maupay', 'FWD', 'Avant-centre', NULL::integer, 29, 75, 4000000::bigint, 0::bigint),
  ('Faris Moumbagna', 'FWD', 'Avant-centre', NULL::integer, 26, 75, 3500000::bigint, 0::bigint),
  ('Ulisses Garcia', 'DEF', 'Arrière gauche', NULL::integer, 30, 75, 3000000::bigint, 0::bigint),
  ('Geoffrey Kondogbia', 'MID', 'Milieu défensif', 19, 33, 75, 3000000::bigint, 0::bigint),
  ('Jeffrey de Lange', 'GK', 'Gardien de but', 12, 28, 75, 2500000::bigint, 0::bigint),
  ('Derek Cornelius', 'DEF', 'Défenseur central', 13, 28, 75, 2500000::bigint, 0::bigint),
  ('Pierre-Emerick Aubameyang', 'FWD', 'Avant-centre', 17, 37, 75, 2500000::bigint, 0::bigint),
  ('Ange Lago', 'FWD', 'Avant-centre', 78, 21, 75, 100000::bigint, 0::bigint),
  ('Jelle Van Neck', 'GK', 'Gardien de but', 40, 22, 75, NULL::bigint, 0::bigint)
) AS p(name, position, position_label, jersey_number, age, rating, market_value, wage)
WHERE c.name = 'Olympique de Marseille';

INSERT INTO players (club_id, name, position, position_label, age, overall_rating, market_value, wage)
SELECT c.id, p.name, p.position::player_position, p.position_label, p.age, p.rating, p.market_value, p.wage
FROM clubs c
CROSS JOIN (VALUES
  ('Gianluigi Donnarumma', 'GK', 'Gardien de but', 25, 88, 88000000::bigint, 10000000::bigint),
  ('Marquinhos', 'DEF', 'Défenseur central', 31, 87, 87000000::bigint, 12000000::bigint),
  ('Achraf Hakimi', 'DEF', 'Arrière droit', 26, 86, 86000000::bigint, 10000000::bigint),
  ('Warren Zaïre-Emery', 'MID', 'Milieu central', 19, 82, 82000000::bigint, 5000000::bigint),
  ('Vitinha', 'MID', 'Milieu central', 25, 84, 84000000::bigint, 7000000::bigint),
  ('Kylian Mbappé', 'FWD', 'Avant-centre', 27, 94, 94000000::bigint, 50000000::bigint),
  ('Ousmane Dembélé', 'FWD', 'Ailier droit', 28, 86, 86000000::bigint, 15000000::bigint)
) AS p(name, position, position_label, age, rating, market_value, wage)
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
