-- Fan Zone hardening : validation parent_id, emoji constraint

CREATE OR REPLACE FUNCTION validate_message_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parent_room INTEGER;
  parent_parent INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'parent_id cannot equal id';
  END IF;

  SELECT room_id, parent_id INTO parent_room, parent_parent
  FROM messages WHERE id = NEW.parent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'parent not found';
  END IF;

  IF parent_parent IS NOT NULL THEN
    RAISE EXCEPTION 'nested replies not allowed';
  END IF;

  IF parent_room IS DISTINCT FROM NEW.room_id THEN
    RAISE EXCEPTION 'parent room mismatch';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_validate_parent
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_parent();

ALTER TABLE message_reactions
  ADD CONSTRAINT message_reactions_no_heart CHECK (emoji <> '❤️');
