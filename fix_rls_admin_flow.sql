/**
 * ADMIN FLOW RLS FIX
 * This script ensures all tables are fully accessible by users with the 'admin' role,
 * and upgrades all existing users to 'admin' to support the transition.
 */

-- 1. Upgrade all existing users to admin
UPDATE public.users SET role = 'admin';

-- 2. Fix Deals RLS (Ensure ALL operations are covered for Admins)
DROP POLICY IF EXISTS "Admins have full access to all deals" ON deals;
CREATE POLICY "Admins have full access to all deals" ON deals
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 3. Fix Negotiation Packs RLS
-- Remove any old restrictive policies
DROP POLICY IF EXISTS "Users can manage their own packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Admins can manage all packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Anyone can manage packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Enable all access for admins" ON negotiation_packs;

CREATE POLICY "Admins have full access to all packs" ON negotiation_packs
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 4. Fix Suppliers RLS
DROP POLICY IF EXISTS "Admins have full access to all suppliers" ON suppliers;
CREATE POLICY "Admins have full access to all suppliers" ON suppliers
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 5. Ensure the trigger is correct for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'admin' -- Force admin for new signups
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
