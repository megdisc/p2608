-- Add yomigana column to settings tables
ALTER TABLE staffs ADD COLUMN yomigana VARCHAR NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN yomigana VARCHAR NOT NULL DEFAULT '';
ALTER TABLE locations ADD COLUMN yomigana VARCHAR NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN yomigana VARCHAR NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN yomigana VARCHAR NOT NULL DEFAULT '';

-- Update create_staff_user RPC to accept yomigana
CREATE OR REPLACE FUNCTION create_staff_user(
  email text,
  password text,
  name text,
  yomigana text,
  role text,
  status text
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
  INSERT INTO staffs (id, name, yomigana, email, role, status)
  VALUES (new_user_id, name, yomigana, email, role, status);

  RETURN new_user_id;
END;
$$;
