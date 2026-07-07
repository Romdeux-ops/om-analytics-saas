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
