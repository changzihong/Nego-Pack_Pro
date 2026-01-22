-- 1. FIX RLS: Allow Users to UPDATE their own profile
-- (Strict Isolation V2 only added SELECT, we need UPDATE too)
DROP POLICY IF EXISTS "Strict: Users can update their own profile" ON users;
CREATE POLICY "Strict: Users can update their own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. DATA REPAIR: Insert missing profiles for existing auth users
-- This handles the case where a user signed up but the public.users row is missing
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 3. DATA REPAIR: Ensure existing users have emails synced if they are null
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id
AND (pu.email IS NULL OR pu.email = '');
