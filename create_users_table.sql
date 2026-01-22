-- 1. Create the users table (which acts as the Profile table)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create or Replace the Policy to allow users to VIEW their own profile
DROP POLICY IF EXISTS "Strict: Users can view their own profile" ON users;
CREATE POLICY "Strict: Users can view their own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 4. Create or Replace the Policy to allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Strict: Users can update their own profile" ON users;
CREATE POLICY "Strict: Users can update their own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create or Replace the Policy to allow users to INSERT their own profile (Self-healing)
DROP POLICY IF EXISTS "Strict: Users can create their own profile" ON users;
CREATE POLICY "Strict: Users can create their own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 6. Backfill missing profiles from Auth system
-- This ensures that if you are already signed up, your profile row is created now.
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
