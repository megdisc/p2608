-- Add email to staffs table
ALTER TABLE staffs ADD COLUMN email VARCHAR;

-- Need pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create RPC for creating staff user
CREATE OR REPLACE FUNCTION create_staff_user(
  email text,
  password text,
  name text,
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
  INSERT INTO staffs (id, name, email, role, status)
  VALUES (new_user_id, name, email, role, status);

  RETURN new_user_id;
END;
$$;

-- Create RPC for updating staff password
CREATE OR REPLACE FUNCTION update_staff_password(
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
