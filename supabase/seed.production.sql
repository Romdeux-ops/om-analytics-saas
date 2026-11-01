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

-- Effectif OM : apparitions / buts / passes (saison en cours, max 11).
-- Théo Vermot remplace l'orthographe « Theo Vermot ». Timber n'est pas dans l'effectif.
INSERT INTO players (
  club_id, name, position, position_label, jersey_number, age,
  overall_rating, market_value, wage, matches_played, goals, assists
)
SELECT c.id, p.name, p.position::player_position, p.position_label, p.jersey_number, p.age,
       p.rating, p.market_value, p.wage, p.matches_played, p.goals, p.assists
FROM clubs c
CROSS JOIN (VALUES
  ('Jeffrey de Lange', 'GK', 'Gardien de but', 1, 28, 75, 2500000::bigint, 0::bigint, 11, 0, 0),
  ('Jelle Van Neck', 'GK', 'Gardien de but', 40, 22, 75, NULL::bigint, 0::bigint, 0, 0, 0),
  ('Théo Vermot', 'GK', 'Gardien de but', 92, 29, 75, 300000::bigint, 0::bigint, 0, 0, 0),
  ('Ibrahim Gomis', 'GK', 'Gardien de but', NULL::integer, 21, 75, NULL::bigint, 0::bigint, 0, 0, 0),
  ('Timothy Weah', 'DEF', 'Arrière droit', 22, 26, 75, 20000000::bigint, 0::bigint, 10, 1, 2),
  ('CJ Egan-Riley', 'DEF', 'Défenseur central', 4, 23, 75, 9000000::bigint, 0::bigint, 10, 1, 0),
  ('Derek Cornelius', 'DEF', 'Défenseur central', 13, 28, 75, 2500000::bigint, 0::bigint, 4, 0, 0),
  ('Bamo Meïté', 'DEF', 'Défenseur central', 18, 24, 75, 7000000::bigint, 0::bigint, 2, 0, 0),
  ('Nayef Aguerd', 'DEF', 'Défenseur central', 21, 30, 75, 15000000::bigint, 0::bigint, 11, 0, 0),
  ('Ulisses Garcia', 'DEF', 'Arrière gauche', 25, 30, 75, 3000000::bigint, 0::bigint, 7, 0, 0),
  ('Emerson Palmieri', 'DEF', 'Arrière gauche', 33, 32, 75, 9000000::bigint, 0::bigint, 10, 0, 3),
  ('Alexi Koum', 'DEF', 'Arrière gauche', 46, 20, 75, 1500000::bigint, 0::bigint, 0, 0, 0),
  ('Kelyann Bezahaf', 'DEF', 'Arrière droit', 74, 20, 75, 300000::bigint, 0::bigint, 3, 0, 0),
  ('Tochukwu Nnadi', 'MID', 'Milieu défensif', 6, 23, 75, 4500000::bigint, 0::bigint, 6, 0, 1),
  ('Angel Gomes', 'MID', 'Milieu offensif', 7, 26, 75, 10000000::bigint, 0::bigint, 11, 1, 1),
  ('Himad Abdelli', 'MID', 'Milieu central', 8, 26, 75, 5000000::bigint, 0::bigint, 11, 3, 1),
  ('Geoffrey Kondogbia', 'MID', 'Milieu défensif', 19, 33, 75, 2500000::bigint, 0::bigint, 6, 0, 0),
  ('Pierre-Emile Højbjerg', 'MID', 'Milieu défensif', 23, 31, 75, 15000000::bigint, 0::bigint, 8, 1, 0),
  ('Nouhoum Kamissoko', 'MID', 'Milieu défensif', 42, 21, 75, 1000000::bigint, 0::bigint, 4, 1, 0),
  ('Amine Gouiri', 'FWD', 'Avant-centre', 9, 26, 75, 30000000::bigint, 0::bigint, 11, 5, 2),
  ('Neal Maupay', 'FWD', 'Avant-centre', 11, 30, 75, 4000000::bigint, 0::bigint, 10, 0, 0),
  ('Igor Paixão', 'FWD', 'Ailier gauche', 14, 26, 75, 35000000::bigint, 0::bigint, 10, 2, 1),
  ('Faris Moumbagna', 'FWD', 'Avant-centre', 29, 26, 75, 3500000::bigint, 0::bigint, 6, 0, 1),
  ('Tadjidine Mmadi', 'FWD', 'Ailier gauche', 43, 19, 75, 1000000::bigint, 0::bigint, 3, 0, 0),
  ('Amine Harit', 'FWD', 'Ailier droit', 77, 29, 75, 5000000::bigint, 0::bigint, 10, 2, 1),
  ('Keyliane Abdallah', 'FWD', 'Ailier droit', 48, 20, 75, 5000000::bigint, 0::bigint, 11, 2, 0),
  ('Antoine Valero', 'FWD', 'Avant-centre', NULL::integer, 18, 75, NULL::bigint, 0::bigint, 0, 0, 0)
) AS p(name, position, position_label, jersey_number, age, rating, market_value, wage, matches_played, goals, assists)
WHERE c.name = 'Olympique de Marseille'
  AND NOT EXISTS (
    SELECT 1 FROM players pl
    WHERE pl.club_id = c.id
      AND pl.name IN (p.name, CASE WHEN p.name = 'Théo Vermot' THEN 'Theo Vermot' ELSE p.name END)
  );

-- Met à jour les joueurs déjà présents (stats, poste affiché, orthographe Vermot).
UPDATE players AS pl
SET name = v.name,
    position_label = v.position_label,
    matches_played = v.matches_played,
    goals = v.goals,
    assists = v.assists,
    updated_at = now()
FROM (VALUES
  ('Jeffrey de Lange', 'Jeffrey de Lange', 'Gardien de but', 11, 0, 0),
  ('Jelle Van Neck', 'Jelle Van Neck', 'Gardien de but', 0, 0, 0),
  ('Theo Vermot', 'Théo Vermot', 'Gardien de but', 0, 0, 0),
  ('Théo Vermot', 'Théo Vermot', 'Gardien de but', 0, 0, 0),
  ('Ibrahim Gomis', 'Ibrahim Gomis', 'Gardien de but', 0, 0, 0),
  ('Timothy Weah', 'Timothy Weah', 'Arrière droit', 10, 1, 2),
  ('CJ Egan-Riley', 'CJ Egan-Riley', 'Défenseur central', 10, 1, 0),
  ('Derek Cornelius', 'Derek Cornelius', 'Défenseur central', 4, 0, 0),
  ('Bamo Meïté', 'Bamo Meïté', 'Défenseur central', 2, 0, 0),
  ('Nayef Aguerd', 'Nayef Aguerd', 'Défenseur central', 11, 0, 0),
  ('Ulisses Garcia', 'Ulisses Garcia', 'Arrière gauche', 7, 0, 0),
  ('Emerson Palmieri', 'Emerson Palmieri', 'Arrière gauche', 10, 0, 3),
  ('Alexi Koum', 'Alexi Koum', 'Arrière gauche', 0, 0, 0),
  ('Kelyann Bezahaf', 'Kelyann Bezahaf', 'Arrière droit', 3, 0, 0),
  ('Tochukwu Nnadi', 'Tochukwu Nnadi', 'Milieu défensif', 6, 0, 1),
  ('Angel Gomes', 'Angel Gomes', 'Milieu offensif', 11, 1, 1),
  ('Himad Abdelli', 'Himad Abdelli', 'Milieu central', 11, 3, 1),
  ('Geoffrey Kondogbia', 'Geoffrey Kondogbia', 'Milieu défensif', 6, 0, 0),
  ('Pierre-Emile Højbjerg', 'Pierre-Emile Højbjerg', 'Milieu défensif', 8, 1, 0),
  ('Nouhoum Kamissoko', 'Nouhoum Kamissoko', 'Milieu défensif', 4, 1, 0),
  ('Amine Gouiri', 'Amine Gouiri', 'Avant-centre', 11, 5, 2),
  ('Neal Maupay', 'Neal Maupay', 'Avant-centre', 10, 0, 0),
  ('Igor Paixão', 'Igor Paixão', 'Ailier gauche', 10, 2, 1),
  ('Faris Moumbagna', 'Faris Moumbagna', 'Avant-centre', 6, 0, 1),
  ('Tadjidine Mmadi', 'Tadjidine Mmadi', 'Ailier gauche', 3, 0, 0),
  ('Amine Harit', 'Amine Harit', 'Ailier droit', 10, 2, 1),
  ('Keyliane Abdallah', 'Keyliane Abdallah', 'Ailier droit', 11, 2, 0),
  ('Antoine Valero', 'Antoine Valero', 'Avant-centre', 0, 0, 0)
) AS v(match_name, name, position_label, matches_played, goals, assists)
WHERE pl.name = v.match_name
  AND pl.club_id = (SELECT id FROM clubs WHERE name = 'Olympique de Marseille');

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
