-- 1. ENABLE INSERT POLICY
-- This allows a user to "self-register" their profile row if it's missing (Self-Healing)
DROP POLICY IF EXISTS "Strict: Users can create their own profile" ON users;
CREATE POLICY "Strict: Users can create their own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. ENABLE UPDATE POLICY (Re-applying to be sure)
DROP POLICY IF EXISTS "Strict: Users can update their own profile" ON users;
CREATE POLICY "Strict: Users can update their own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. ENABLE SELECT POLICY (Re-applying to be sure)
DROP POLICY IF EXISTS "Strict: Users can view their own profile" ON users;
CREATE POLICY "Strict: Users can view their own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 4. MANUALLY REPAIR DATA (Again, just in case)
INSERT INTO public.users (id, email, full_name, role)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'), 
    'admin'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
