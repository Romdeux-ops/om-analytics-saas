-- Admin role, message pinning, RLS policies and grants

ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

ALTER TABLE messages
  ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_messages_room_pinned ON messages(room_id, is_pinned DESC, created_at DESC);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Prevent non-admins from changing their own role
CREATE OR REPLACE FUNCTION prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL AND NOT is_admin() THEN
    RAISE EXCEPTION 'insufficient privileges to change role';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_role_escalation();

-- Admin read inactive rooms/polls
CREATE POLICY "rooms_admin_read_all" ON rooms FOR SELECT
  USING (is_admin());

CREATE POLICY "polls_admin_read_all" ON polls FOR SELECT
  USING (is_admin());

-- Admin CRUD on structured content
CREATE POLICY "rooms_admin_all" ON rooms FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "polls_admin_all" ON polls FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "poll_options_admin_all" ON poll_options FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "messages_admin_delete" ON messages FOR DELETE
  USING (is_admin());

CREATE POLICY "messages_admin_update" ON messages FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grants for admin write paths (RLS still applies)
GRANT INSERT, UPDATE, DELETE ON rooms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON polls TO authenticated;
GRANT INSERT, UPDATE, DELETE ON poll_options TO authenticated;
GRANT UPDATE, DELETE ON messages TO authenticated;
