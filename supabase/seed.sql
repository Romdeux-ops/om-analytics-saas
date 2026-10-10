-- Seed de démonstration (équivalent de Backend/om_engine/management/commands/init_data.py)

INSERT INTO clubs (name, budget_transfert, masse_salariale_actuelle, plafond_salarial_dncg, reputation, coach)
VALUES
  ('Olympique de Marseille', 15000000, 80000000, 100000000, 85, 'Bruno Genesio'),
  ('Paris Saint-Germain', 200000000, 300000000, 500000000, 90, 'Luis Enrique'),
  ('AS Monaco', 50000000, 80000000, 120000000, 82, 'Adi Hütter'),
  ('Olympique Lyonnais', 30000000, 70000000, 100000000, 81, 'Pierre Sage'),
  ('LOSC Lille', 25000000, 60000000, 90000000, 80, 'Bruno Génésio'),
  ('RC Lens', 20000000, 50000000, 80000000, 78, 'Will Still'),
  ('OGC Nice', 20000000, 50000000, 80000000, 78, 'Franck Haise'),
  ('Stade Rennais', 25000000, 55000000, 85000000, 77, 'Julien Stéphan'),
  ('Stade Brestois', 15000000, 35000000, 60000000, 76, 'Éric Roy'),
  ('RC Strasbourg', 20000000, 45000000, 70000000, 74, 'Liam Rosenior'),
  ('Toulouse FC', 12000000, 35000000, 55000000, 73, 'Carles Martinez Novell'),
  ('AJ Auxerre', 10000000, 25000000, 45000000, 72, 'Christophe Pélissier'),
  ('ESTAC Troyes', 10000000, 25000000, 45000000, 71, 'Stéphane Dumont'),
  ('Angers SCO', 10000000, 25000000, 45000000, 71, 'Alexandre Dujeux'),
  ('Le Havre AC', 10000000, 25000000, 45000000, 71, 'Didier Digard'),
  ('FC Lorient', 10000000, 25000000, 45000000, 71, 'Olivier Pantaloni'),
  ('Paris FC', 15000000, 30000000, 50000000, 72, 'Stéphane Gilli'),
  ('Le Mans FC', 8000000, 20000000, 35000000, 68, 'Patrick Videira'),
  ('Bayer Leverkusen', 60000000, 100000000, 150000000, 86, 'Xabi Alonso'),
  ('Olympiacos FC', 20000000, 40000000, 60000000, 77, 'José Luis Mendilibar'),
  ('Beşiktaş JK', 20000000, 45000000, 65000000, 76, 'Giovanni van Bronckhorst'),
  ('Celtic FC', 25000000, 45000000, 65000000, 76, 'Brendan Rodgers'),
  ('Celta de Vigo', 18000000, 40000000, 60000000, 76, 'Claudio Giráldez'),
  ('RSC Anderlecht', 15000000, 35000000, 55000000, 75, 'David Hubert'),
  ('SK Sturm Graz', 12000000, 25000000, 40000000, 73, 'Christian Ilzer'),
  ('PFC Levski Sofia', 8000000, 18000000, 30000000, 70, 'Stanislav Genchev');

-- Effectif OM 2026-2027 (25 joueurs — mercato d'été : départs Greenwood, Timber,
-- Balerdi, Medina, Traoré, Rulli, Aubameyang, Lago ; arrivées De Lange, Vermot,
-- Koum, Bezahaf, Kamissoko, Abdallah, Mmadi)
INSERT INTO players (
  club_id, name, position, position_label, jersey_number, age,
  overall_rating, market_value, wage, matches_played, goals, assists
)
SELECT c.id, p.name, p.position::player_position, p.position_label, p.jersey_number, p.age,
       p.rating, p.market_value, p.wage, p.matches_played, p.goals, p.assists
FROM clubs c
CROSS JOIN (VALUES
  -- Gardiens — Ligue 1 2026-2027 après J5
  ('Jeffrey de Lange', 'GK', 'Gardien de but', 1, 28, 75, 2500000::bigint, 0::bigint, 5, 0, 0),
  ('Jelle Van Neck', 'GK', 'Gardien de but', 40, 22, 75, NULL::bigint, 0::bigint, 0, 0, 0),
  ('Theo Vermot', 'GK', 'Gardien de but', 92, 29, 75, 300000::bigint, 0::bigint, 0, 0, 0),
  -- Défenseurs
  ('Timothy Weah', 'DEF', 'Arrière droit', 22, 26, 75, 20000000::bigint, 0::bigint, 5, 0, 0),
  ('CJ Egan-Riley', 'DEF', 'Défenseur central', 4, 23, 75, 9000000::bigint, 0::bigint, 5, 0, 0),
  ('Derek Cornelius', 'DEF', 'Défenseur central', 13, 28, 75, 2500000::bigint, 0::bigint, 3, 0, 0),
  ('Bamo Meïté', 'DEF', 'Défenseur central', 18, 24, 75, 7000000::bigint, 0::bigint, 0, 0, 0),
  ('Nayef Aguerd', 'DEF', 'Défenseur central', 21, 30, 75, 15000000::bigint, 0::bigint, 5, 0, 0),
  ('Ulisses Garcia', 'DEF', 'Arrière gauche', 25, 30, 75, 3000000::bigint, 0::bigint, 2, 0, 0),
  ('Emerson Palmieri', 'DEF', 'Arrière gauche', 33, 32, 75, 9000000::bigint, 0::bigint, 5, 0, 0),
  ('Alexi Koum', 'DEF', 'Défenseur central', 46, 20, 75, 1500000::bigint, 0::bigint, 0, 0, 0),
  ('Kelyann Bezahaf', 'DEF', 'Arrière droit', 74, 20, 75, 300000::bigint, 0::bigint, 1, 0, 0),
  -- Milieux
  ('Tochukwu Nnadi', 'MID', 'Milieu défensif', 6, 23, 75, 4500000::bigint, 0::bigint, 2, 0, 0),
  ('Angel Gomes', 'MID', 'Milieu offensif', 7, 26, 75, 10000000::bigint, 0::bigint, 5, 1, 1),
  ('Himad Abdelli', 'MID', 'Milieu central', 8, 26, 75, 5000000::bigint, 0::bigint, 5, 0, 0),
  ('Geoffrey Kondogbia', 'MID', 'Milieu défensif', 19, 33, 75, 2500000::bigint, 0::bigint, 2, 0, 0),
  ('Pierre-Emile Højbjerg', 'MID', 'Milieu défensif', 23, 31, 75, 15000000::bigint, 0::bigint, 5, 1, 0),
  ('Nouhoum Kamissoko', 'MID', 'Milieu central', 42, 21, 75, 1000000::bigint, 0::bigint, 0, 0, 0),
  -- Attaquants
  ('Amine Gouiri', 'FWD', 'Avant-centre', 9, 26, 75, 30000000::bigint, 0::bigint, 5, 4, 1),
  ('Neal Maupay', 'FWD', 'Avant-centre', 11, 30, 75, 4000000::bigint, 0::bigint, 4, 0, 0),
  ('Igor Paixão', 'FWD', 'Ailier gauche', 14, 26, 75, 35000000::bigint, 0::bigint, 4, 0, 0),
  ('Faris Moumbagna', 'FWD', 'Avant-centre', 29, 26, 75, 3500000::bigint, 0::bigint, 4, 0, 0),
  ('Tadjidine Mmadi', 'FWD', 'Ailier gauche', 43, 19, 75, 1000000::bigint, 0::bigint, 2, 0, 0),
  ('Amine Harit', 'FWD', 'Ailier droit', 77, 29, 75, 5000000::bigint, 0::bigint, 5, 0, 1),
  ('Keyliane Abdallah', 'FWD', 'Ailier droit', 48, 20, 75, 5000000::bigint, 0::bigint, 5, 1, 0)
) AS p(name, position, position_label, jersey_number, age, rating, market_value, wage, matches_played, goals, assists)
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

INSERT INTO matches (home_team_id, away_team_id, date, played, home_score, away_score)
SELECT
  h.id AS home_team_id,
  a.id AS away_team_id,
  v.match_date::timestamptz,
  v.played,
  v.home_score,
  v.away_score
FROM (VALUES
  ('Olympique de Marseille', 'RC Strasbourg', '2026-08-21T20:45:00+02:00', true, 4, 0),
  ('AS Monaco', 'Olympique de Marseille', '2026-08-30T20:45:00+02:00', true, 2, 0),
  ('Olympique de Marseille', 'Paris FC', '2026-09-06T20:45:00+02:00', true, 2, 3),
  ('Stade Rennais', 'Olympique de Marseille', '2026-09-11T20:45:00+02:00', true, 1, 0),
  ('Olympique de Marseille', 'Paris Saint-Germain', '2026-09-20T20:45:00+02:00', true, 1, 2),
  ('ESTAC Troyes', 'Olympique de Marseille', '2026-10-11T20:45:00+02:00', false, 0, 0),
  ('Angers SCO', 'Olympique de Marseille', '2026-10-18T15:00:00+02:00', false, 0, 0),
  ('Olympique de Marseille', 'Le Havre AC', '2026-10-25T17:15:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Toulouse FC', '2026-11-01T20:45:00+01:00', false, 0, 0),
  ('RC Lens', 'Olympique de Marseille', '2026-11-08T20:45:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Le Mans FC', '2026-11-22T20:45:00+01:00', false, 0, 0),
  ('AJ Auxerre', 'Olympique de Marseille', '2026-11-29T15:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'OGC Nice', '2026-12-05T12:00:00+01:00', false, 0, 0),
  ('Olympique Lyonnais', 'Olympique de Marseille', '2026-12-13T20:45:00+01:00', false, 0, 0),
  ('Stade Brestois', 'Olympique de Marseille', '2027-01-02T12:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'LOSC Lille', '2027-01-16T12:00:00+01:00', false, 0, 0),
  ('FC Lorient', 'Olympique de Marseille', '2027-01-23T12:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'ESTAC Troyes', '2027-01-30T12:00:00+01:00', false, 0, 0),
  ('Paris Saint-Germain', 'Olympique de Marseille', '2027-02-07T20:45:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Angers SCO', '2027-02-13T12:00:00+01:00', false, 0, 0),
  ('RC Strasbourg', 'Olympique de Marseille', '2027-02-20T12:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Stade Rennais', '2027-02-27T12:00:00+01:00', false, 0, 0),
  ('LOSC Lille', 'Olympique de Marseille', '2027-03-06T12:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'AS Monaco', '2027-03-13T12:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Olympique Lyonnais', '2027-03-21T20:45:00+01:00', false, 0, 0),
  ('Le Mans FC', 'Olympique de Marseille', '2027-04-03T12:00:00+02:00', false, 0, 0),
  ('Olympique de Marseille', 'Stade Brestois', '2027-04-10T12:00:00+02:00', false, 0, 0),
  ('Le Havre AC', 'Olympique de Marseille', '2027-04-17T12:00:00+02:00', false, 0, 0),
  ('Olympique de Marseille', 'AJ Auxerre', '2027-04-24T12:00:00+02:00', false, 0, 0),
  ('Toulouse FC', 'Olympique de Marseille', '2027-05-01T12:00:00+02:00', false, 0, 0),
  ('OGC Nice', 'Olympique de Marseille', '2027-05-08T12:00:00+02:00', false, 0, 0),
  ('Olympique de Marseille', 'RC Lens', '2027-05-16T12:00:00+02:00', false, 0, 0),
  ('Paris FC', 'Olympique de Marseille', '2027-05-22T12:00:00+02:00', false, 0, 0),
  ('Olympique de Marseille', 'FC Lorient', '2027-05-29T12:00:00+02:00', false, 0, 0),
  -- Europa League
  ('Beşiktaş JK', 'Olympique de Marseille', '2026-09-17T21:00:00+02:00', true, 4, 1),
  ('Olympique de Marseille', 'Olympiacos FC', '2026-10-15T21:00:00+02:00', false, 0, 0),
  ('SK Sturm Graz', 'Olympique de Marseille', '2026-10-22T18:45:00+02:00', false, 0, 0),
  ('Bayer Leverkusen', 'Olympique de Marseille', '2026-11-05T21:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'PFC Levski Sofia', '2026-11-26T18:45:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'Celta de Vigo', '2026-12-10T18:45:00+01:00', false, 0, 0),
  ('Celtic FC', 'Olympique de Marseille', '2027-01-21T21:00:00+01:00', false, 0, 0),
  ('Olympique de Marseille', 'RSC Anderlecht', '2027-01-28T21:00:00+01:00', false, 0, 0)
) AS v(home_club, away_club, match_date, played, home_score, away_score)
JOIN clubs h ON h.name = v.home_club
JOIN clubs a ON a.name = v.away_club;

-- Salons Fan Zone de démonstration
INSERT INTO rooms (name, slug, description)
VALUES
  ('Tribune Principale', 'tribune-principale', 'Débats généraux autour de l''OM'),
  ('Analyse Tactique', 'analyse-tactique', 'Discussions sur les compositions et le jeu');

-- Fan Zone demo data (users, messages, polls, votes)
-- Mot de passe test pour tous : password123

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'supporter@test.om',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"SupporterOM"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'tacticien@test.om',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"TacticienOM"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a3333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'veloce@test.om',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"VeloceOM"}',
    NOW(), NOW(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@test.om',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"AdminOM"}',
    NOW(), NOW(), '', '', '', ''
  );

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    '{"sub":"a1111111-1111-1111-1111-111111111111","email":"supporter@test.om"}'::jsonb,
    'email', 'a1111111-1111-1111-1111-111111111111', NOW(), NOW(), NOW()
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    '{"sub":"a2222222-2222-2222-2222-222222222222","email":"tacticien@test.om"}'::jsonb,
    'email', 'a2222222-2222-2222-2222-222222222222', NOW(), NOW(), NOW()
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    '{"sub":"a3333333-3333-3333-3333-333333333333","email":"veloce@test.om"}'::jsonb,
    'email', 'a3333333-3333-3333-3333-333333333333', NOW(), NOW(), NOW()
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@test.om"}'::jsonb,
    'email', 'a0000000-0000-0000-0000-000000000001', NOW(), NOW(), NOW()
  );

UPDATE profiles SET role = 'admin' WHERE id = 'a0000000-0000-0000-0000-000000000001';

INSERT INTO messages (room_id, user_id, content, created_at)
SELECT r.id, u.user_id, u.content, u.created_at
FROM rooms r
CROSS JOIN (VALUES
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Allez l''OM ! On va chercher les 3 points contre le PSG.', NOW() - interval '2 hours'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Greenwood en forme, il faut le titulariser absolument.', NOW() - interval '90 minutes'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'Droit au but ce soir, le Vélodrome va trembler !', NOW() - interval '1 hour'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Paixão à gauche et Greenwood à droite, combo gagnant.', NOW() - interval '45 minutes'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Højbjerg doit être titulaire au milieu, on a besoin de son expérience.', NOW() - interval '30 minutes')
) AS u(user_id, content, created_at)
WHERE r.slug = 'tribune-principale';

INSERT INTO messages (room_id, user_id, content, created_at)
SELECT r.id, u.user_id, u.content, u.created_at
FROM rooms r
CROSS JOIN (VALUES
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Un 4-2-3-1 avec Timber et Højbjerg devant la défense me semble optimal.', NOW() - interval '3 hours'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Medina et Balerdi en charnière, solide sur les corners.', NOW() - interval '2 hours'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'Gouiri en faux 9 pour fixer les défenseurs parisiens ?', NOW() - interval '1 hour')
) AS u(user_id, content, created_at)
WHERE r.slug = 'analyse-tactique';

INSERT INTO polls (room_id, question, is_active, closes_at)
SELECT id, 'Qui sera homme du match OM-PSG ?', true, NOW() + interval '7 days'
FROM rooms WHERE slug = 'tribune-principale';

INSERT INTO poll_options (poll_id, label, vote_count)
SELECT p.id, o.label, 0
FROM polls p
CROSS JOIN (VALUES
  ('Mason Greenwood'),
  ('Igor Paixão'),
  ('Pierre-Emile Højbjerg'),
  ('Amine Gouiri')
) AS o(label)
WHERE p.question = 'Qui sera homme du match OM-PSG ?';

INSERT INTO polls (room_id, question, is_active, closes_at)
SELECT id, 'Formation préférée pour le Classique ?', true, NOW() + interval '7 days'
FROM rooms WHERE slug = 'analyse-tactique';

INSERT INTO poll_options (poll_id, label, vote_count)
SELECT p.id, o.label, 0
FROM polls p
CROSS JOIN (VALUES
  ('4-2-3-1 classique'),
  ('3-5-2 avec ailiers montants'),
  ('4-3-3 pressing haut')
) AS o(label)
WHERE p.question = 'Formation préférée pour le Classique ?';

INSERT INTO votes (poll_id, option_id, user_id)
SELECT p.id, po.id, 'a1111111-1111-1111-1111-111111111111'::uuid
FROM polls p
JOIN poll_options po ON po.poll_id = p.id AND po.label = 'Mason Greenwood'
WHERE p.question = 'Qui sera homme du match OM-PSG ?';

INSERT INTO votes (poll_id, option_id, user_id)
SELECT p.id, po.id, 'a2222222-2222-2222-2222-222222222222'::uuid
FROM polls p
JOIN poll_options po ON po.poll_id = p.id AND po.label = 'Igor Paixão'
WHERE p.question = 'Qui sera homme du match OM-PSG ?';

INSERT INTO votes (poll_id, option_id, user_id)
SELECT p.id, po.id, 'a2222222-2222-2222-2222-222222222222'::uuid
FROM polls p
JOIN poll_options po ON po.poll_id = p.id AND po.label = '4-2-3-1 classique'
WHERE p.question = 'Formation préférée pour le Classique ?';

-- Réactions seedées (emoji, pas le cœur — likes séparés)
INSERT INTO message_likes (message_id, user_id)
SELECT m.id, 'a2222222-2222-2222-2222-222222222222'::uuid
FROM messages m
JOIN rooms r ON r.id = m.room_id
WHERE r.slug = 'tribune-principale'
  AND m.content LIKE 'Allez l''OM%'
LIMIT 1;

INSERT INTO message_reactions (message_id, user_id, emoji)
SELECT m.id, 'a3333333-3333-3333-3333-333333333333'::uuid, '🔥'
FROM messages m
JOIN rooms r ON r.id = m.room_id
WHERE r.slug = 'tribune-principale'
  AND m.content LIKE 'Greenwood en forme%'
LIMIT 1;

INSERT INTO message_reactions (message_id, user_id, emoji)
SELECT m.id, 'a1111111-1111-1111-1111-111111111111'::uuid, '💙'
FROM messages m
JOIN rooms r ON r.id = m.room_id
WHERE r.slug = 'tribune-principale'
  AND m.content LIKE 'Droit au but%'
LIMIT 1;

-- Réponse seedée (+ réponses supplémentaires pour tester pagination)
INSERT INTO messages (room_id, parent_id, user_id, content, created_at)
SELECT r.id, m.id, u.user_id, u.content, u.created_at
FROM rooms r
JOIN messages m ON m.room_id = r.id AND m.content LIKE 'Allez l''OM%'
CROSS JOIN (VALUES
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Tellement d''accord, on va les envahir !', NOW() - interval '20 minutes'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Allez l''OM à vie !', NOW() - interval '18 minutes'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'Le Vélodrome va exploser ce soir', NOW() - interval '16 minutes'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Droit au but les gars', NOW() - interval '14 minutes'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Greenwood va marquer, j''en mets ma main à couper', NOW() - interval '12 minutes'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'Paixão en feu aussi', NOW() - interval '10 minutes'),
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'On croit en vous !', NOW() - interval '8 minutes')
) AS u(user_id, content, created_at)
WHERE r.slug = 'tribune-principale';
