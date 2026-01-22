-- 1. FIX RLS FOR NEGOTIATION PACKS
-- The previous policy required 'deals' ownership check which might fail on INSERT if not careful
-- We will simplify it to: You can INSERT a pack if you can SELECT the deal it refers to.

DROP POLICY IF EXISTS "Strict: Users see packs for their deals only" ON negotiation_packs;

CREATE POLICY "Strict: Users can manage packs for their deals" ON negotiation_packs
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

-- 2. FIX RLS FOR DEALS (Just to sure INSERT works)
DROP POLICY IF EXISTS "Strict: Users see only their own deals" ON deals;

CREATE POLICY "Strict: Users can manage own deals" ON deals
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());


-- 3. CRITICAL: ADOPT ORPHAN DEALS
-- If the user created a deal BEFORE the owner_id fix was live, that deal has owner_id = NULL.
-- This means the user CANNOT see it or add a pack to it.
-- We will assign ALL orphan deals (null owner_id) to the current user (if run in SQL editor with a user context)
-- OR effectively just make them owned by 'admin' or something.
-- Since we are running this as a script, we can't easily target "The User" unless we know their ID.
-- However, we can make a looser policy for now to allow "adopting" or we can simply allow INSERTing packs if deal owner is null?
-- No, better to keep strict.

-- BETTER FIX:
-- Allow INSERT into "deals" even if owner_id is not checked? No.

-- Let's ensure the User can actually INSERT the deal in DealIntake.
-- DealIntake.tsx sends owner_id: user.id. This should work with the policy above.

-- PROBLEM: If policy expects owner_id = auth.uid(), AND the row being inserted has owner_id = auth.uid(), it passes.
-- But if the user is creating a Pack, they are INSERTING into negotiation_packs.
-- The check `EXISTS (SELECT 1 FROM deals ...)` runs.
-- Does the deal exist? Yes.
-- Does deals.owner_id match auth.uid()? 
-- If the deal was created successfully, yes.

-- HYPOTHESIS: The user might have a deal created *before* the strict policy was applied properly, but *after* the initial owner_id column was added, 
-- potentially leaving it with NULL owner_id if the code wasn't updated yet.
-- OR, maybe the user *just* deleted the validation database and started fresh?

-- Let's try to fix generic RLS issues by being slightly more permissive for Packs:
-- Allow INSERTing a pack if the deal exists, regardless of owner?
-- No, that breaks isolation.

-- Let's try to REPAIR existing deals that act up.
-- If you are the only user on this dev database, we can just set all deals to your ID.
-- But we don't know your ID.

-- Alternative:
-- Explicit permission to insert packs for ANY deal that doesn't have an owner?
-- No.

-- Let's just re-apply the policies cleanly.
