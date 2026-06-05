ALTER TABLE staffs DROP COLUMN status;

DROP FUNCTION IF EXISTS create_staff_user(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS create_staff_user(text, text, text, text, text);

CREATE OR REPLACE FUNCTION create_staff_user(
  email text,
  password text,
  name text,
  yomigana text,
  role text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ) RETURNING id INTO new_user_id;

  -- Insert into staffs
  INSERT INTO staffs (id, name, yomigana, email, role)
  VALUES (new_user_id, name, yomigana, email, role);

  RETURN new_user_id;
END;
$$;
