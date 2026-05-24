
-- Update handle_new_user to also seed one demo list (2 recipients) + one demo template
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id uuid;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  -- demo recipient list
  INSERT INTO public.recipient_lists (user_id, name, description)
  VALUES (new.id, 'Demo List', 'Sample recipients to help you get started. Feel free to edit or delete.')
  RETURNING id INTO v_list_id;

  INSERT INTO public.recipients (user_id, list_id, email, name) VALUES
    (new.id, v_list_id, 'rahul@example.com', 'Rahul Sharma'),
    (new.id, v_list_id, 'john@example.com', 'John Doe');

  -- demo template
  INSERT INTO public.templates (user_id, name, subject, html) VALUES (
    new.id,
    'Welcome Email',
    'Welcome to Our Platform',
    '<p>Hi {{name}},</p><p>Welcome to our platform. We are happy to connect with you.</p><p>Regards,<br/>Team</p>'
  );

  RETURN new;
END;
$$;

-- ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
