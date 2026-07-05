-- PostgREST requires explicit grants for anon/authenticated roles.
-- Without these, Supabase client requests return 403/42501.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.profiles TO authenticated;

GRANT SELECT ON TABLE public.rooms TO anon, authenticated;
GRANT SELECT ON TABLE public.messages TO anon, authenticated;
GRANT INSERT ON TABLE public.messages TO authenticated;

GRANT SELECT ON TABLE public.polls TO anon, authenticated;
GRANT SELECT ON TABLE public.poll_options TO anon, authenticated;
GRANT SELECT ON TABLE public.votes TO anon, authenticated;
GRANT INSERT ON TABLE public.votes TO authenticated;

GRANT SELECT ON TABLE public.clubs TO anon, authenticated;
GRANT SELECT ON TABLE public.players TO anon, authenticated;
GRANT SELECT ON TABLE public.matches TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
