-- 1. Ensure suppliers has an owner_id column
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 2. Update existing suppliers to be owned by the first admin found (or leave null if not known)
-- For a better experience, we can assign them to the current user if we were running this interactively, 
-- but here we just ensure the column exists.

-- 3. Fix RLS for DEALS
DROP POLICY IF EXISTS "Admins have full access to all deals" ON deals;
DROP POLICY IF EXISTS "Owners have full access to their deals" ON deals;
DROP POLICY IF EXISTS "Owners and Admins can view deals" ON deals;

CREATE POLICY "Users only see their own deals" ON deals
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 4. Fix RLS for NEGOTIATION PACKS
DROP POLICY IF EXISTS "Admins have full access to all packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Users can manage their own packs" ON negotiation_packs;

CREATE POLICY "Users only see their own packs" ON negotiation_packs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = negotiation_packs.deal_id AND deals.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = negotiation_packs.deal_id AND deals.owner_id = auth.uid()
  )
);

-- 5. Fix RLS for SUPPLIERS
DROP POLICY IF EXISTS "Admins have full access to all suppliers" ON suppliers;

CREATE POLICY "Users only see their own suppliers" ON suppliers
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 6. Fix RLS for MEETING NOTES
DROP POLICY IF EXISTS "Admins can manage meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Owners and Admins can view meeting notes" ON meeting_notes;

CREATE POLICY "Users only see their own meeting notes" ON meeting_notes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = meeting_notes.deal_id AND deals.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = meeting_notes.deal_id AND deals.owner_id = auth.uid()
  )
);

-- 7. Fix RLS for USERS (Profiles)
DROP POLICY IF EXISTS "Users can see their own profile and Admins can see all" ON users;
CREATE POLICY "Users can only see their own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);
