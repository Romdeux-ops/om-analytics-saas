-- Données de base pour la base Supabase en ligne (sans comptes ni messages de démo).
-- Idempotent : peut être relancé sans créer de doublons.
-- À exécuter dans Supabase > SQL Editor. Ne pas utiliser `db push --include-seed`
-- sur la base en ligne : seed.sql crée des comptes de test (admin / password123).

INSERT INTO clubs (name, budget_transfert, masse_salariale_actuelle, plafond_salarial_dncg, reputation, coach)
SELECT v.name, v.budget, v.masse, v.plafond, v.reputation, v.coach
FROM (VALUES
  ('Olympique de Marseille', 15000000::bigint, 80000000::bigint, 100000000::bigint, 85, 'Bruno Genesio'),
  ('Paris Saint-Germain', 200000000::bigint, 300000000::bigint, 500000000::bigint, 90, NULL)
) AS v(name, budget, masse, plafond, reputation, coach)
WHERE NOT EXISTS (SELECT 1 FROM clubs c WHERE c.name = v.name);

INSERT INTO players (
  club_id, name, position, position_label, jersey_number, age,
  overall_rating, market_value, wage, matches_played, goals, assists
)
SELECT c.id, p.name, p.position::player_position, p.position_label, p.jersey_number, p.age,
       p.rating, p.market_value, p.wage, 0, 0, 0
FROM clubs c
CROSS JOIN (VALUES
  ('Jeffrey de Lange', 'GK', 'Gardien de but', 1, 28, 75, 2500000::bigint, 0::bigint),
  ('Jelle Van Neck', 'GK', 'Gardien de but', 40, 22, 75, NULL::bigint, 0::bigint),
  ('Theo Vermot', 'GK', 'Gardien de but', 92, 29, 75, 300000::bigint, 0::bigint),
  ('Timothy Weah', 'DEF', 'Arrière droit', 22, 26, 75, 20000000::bigint, 0::bigint),
  ('CJ Egan-Riley', 'DEF', 'Défenseur central', 4, 23, 75, 9000000::bigint, 0::bigint),
  ('Derek Cornelius', 'DEF', 'Défenseur central', 13, 28, 75, 2500000::bigint, 0::bigint),
  ('Bamo Meïté', 'DEF', 'Défenseur central', 18, 24, 75, 7000000::bigint, 0::bigint),
  ('Nayef Aguerd', 'DEF', 'Défenseur central', 21, 30, 75, 15000000::bigint, 0::bigint),
  ('Ulisses Garcia', 'DEF', 'Arrière gauche', 25, 30, 75, 3000000::bigint, 0::bigint),
  ('Emerson Palmieri', 'DEF', 'Arrière gauche', 33, 32, 75, 9000000::bigint, 0::bigint),
  ('Alexi Koum', 'DEF', 'Défenseur central', 46, 20, 75, 1500000::bigint, 0::bigint),
  ('Kelyann Bezahaf', 'DEF', 'Arrière droit', 74, 20, 75, 300000::bigint, 0::bigint),
  ('Tochukwu Nnadi', 'MID', 'Milieu défensif', 6, 23, 75, 4500000::bigint, 0::bigint),
  ('Angel Gomes', 'MID', 'Milieu offensif', 7, 26, 75, 10000000::bigint, 0::bigint),
  ('Himad Abdelli', 'MID', 'Milieu central', 8, 26, 75, 5000000::bigint, 0::bigint),
  ('Geoffrey Kondogbia', 'MID', 'Milieu défensif', 19, 33, 75, 2500000::bigint, 0::bigint),
  ('Pierre-Emile Højbjerg', 'MID', 'Milieu défensif', 23, 31, 75, 15000000::bigint, 0::bigint),
  ('Nouhoum Kamissoko', 'MID', 'Milieu central', 42, 21, 75, 1000000::bigint, 0::bigint),
  ('Amine Gouiri', 'FWD', 'Avant-centre', 9, 26, 75, 30000000::bigint, 0::bigint),
  ('Neal Maupay', 'FWD', 'Avant-centre', 11, 30, 75, 4000000::bigint, 0::bigint),
  ('Igor Paixão', 'FWD', 'Ailier gauche', 14, 26, 75, 35000000::bigint, 0::bigint),
  ('Faris Moumbagna', 'FWD', 'Avant-centre', 29, 26, 75, 3500000::bigint, 0::bigint),
  ('Tadjidine Mmadi', 'FWD', 'Ailier gauche', 43, 19, 75, 1000000::bigint, 0::bigint),
  ('Amine Harit', 'FWD', 'Ailier droit', 77, 29, 75, 5000000::bigint, 0::bigint),
  ('Keyliane Abdallah', 'FWD', 'Ailier droit', 48, 20, 75, 5000000::bigint, 0::bigint)
) AS p(name, position, position_label, jersey_number, age, rating, market_value, wage)
WHERE c.name = 'Olympique de Marseille'
  AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.club_id = c.id AND pl.name = p.name);

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
WHERE c.name = 'Paris Saint-Germain'
  AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.club_id = c.id AND pl.name = p.name);

INSERT INTO matches (home_team_id, away_team_id, date, played)
SELECT om.id, psg.id, now() + interval '1 day', false
FROM clubs om, clubs psg
WHERE om.name = 'Olympique de Marseille'
  AND psg.name = 'Paris Saint-Germain'
  AND NOT EXISTS (SELECT 1 FROM matches);

INSERT INTO rooms (name, slug, description)
VALUES
  ('Tribune Principale', 'tribune-principale', 'Débats généraux autour de l''OM'),
  ('Analyse Tactique', 'analyse-tactique', 'Discussions sur les compositions et le jeu')
ON CONFLICT (slug) DO NOTHING;

SELECT
  (SELECT count(*) FROM clubs) AS clubs,
  (SELECT count(*) FROM players) AS joueurs,
  (SELECT count(*) FROM matches) AS matchs,
  (SELECT count(*) FROM rooms) AS salons,
  (SELECT count(*) FROM auth.users WHERE email LIKE '%@test.om') AS comptes_de_test;
