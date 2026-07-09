-- ============================================
-- SQL SCRIPT: AUTH USER ERSTELLUNG
-- Führe dieses SQL-Skript im Supabase Dashboard unter "SQL Editor" aus!
-- Es legt die Nutzer aus der public.users Tabelle auch verknüpft in auth.users an 
-- und setzt für alle das Passwort auf: password123
-- ============================================

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES 
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'barowner@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'manager@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'bouncer@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'user@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'mod@clubify.app', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub": "00000000-0000-0000-0000-000000000001", "email": "admin@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub": "00000000-0000-0000-0000-000000000002", "email": "owner@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{"sub": "00000000-0000-0000-0000-000000000003", "email": "barowner@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{"sub": "00000000-0000-0000-0000-000000000004", "email": "manager@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '{"sub": "00000000-0000-0000-0000-000000000005", "email": "bouncer@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '{"sub": "00000000-0000-0000-0000-000000000006", "email": "user@clubify.app"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '{"sub": "00000000-0000-0000-0000-000000000007", "email": "mod@clubify.app"}', 'email', now(), now(), now())
ON CONFLICT DO NOTHING;
