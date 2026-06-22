-- Drop notes column and add email column to members table
ALTER TABLE members DROP COLUMN IF EXISTS notes;
ALTER TABLE members ADD COLUMN email VARCHAR;

-- Need pgcrypto for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create RPC for creating member user
CREATE OR REPLACE FUNCTION create_member_user(
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

  -- Insert into members
  INSERT INTO members (id, name, yomigana, email, role)
  VALUES (new_user_id, name, yomigana, email, role);

  RETURN new_user_id;
END;
$$;

-- Create RPC for updating member password
CREATE OR REPLACE FUNCTION update_member_password(
  user_id uuid,
  new_password text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = user_id;
END;
$$;
