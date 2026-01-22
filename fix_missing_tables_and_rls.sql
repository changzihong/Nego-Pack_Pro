-- 1. Create meeting_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.meeting_notes (
    deal_id UUID PRIMARY KEY REFERENCES public.deals(id) ON DELETE CASCADE,
    meeting_date DATE DEFAULT CURRENT_DATE,
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    discussion_points TEXT,
    decisions_made TEXT,
    next_steps TEXT,
    concessions_granted JSONB DEFAULT '{}'::jsonb,
    concessions_received JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure suppliers has an owner_id column
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 3. Enable RLS on all tables (idempotent)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Fix RLS for DEALS (Strict Ownership)
DROP POLICY IF EXISTS "Admins have full access to all deals" ON deals;
DROP POLICY IF EXISTS "Owners have full access to their deals" ON deals;
DROP POLICY IF EXISTS "Owners and Admins can view deals" ON deals;
DROP POLICY IF EXISTS "Users only see their own deals" ON deals;

CREATE POLICY "Users only see their own deals" ON deals
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 5. Fix RLS for NEGOTIATION PACKS (Dependent on Deal Ownership)
DROP POLICY IF EXISTS "Admins have full access to all packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Users can manage their own packs" ON negotiation_packs;
DROP POLICY IF EXISTS "Users only see their own packs" ON negotiation_packs;

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

-- 6. Fix RLS for SUPPLIERS (Strict Ownership)
DROP POLICY IF EXISTS "Admins have full access to all suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users only see their own suppliers" ON suppliers;

CREATE POLICY "Users only see their own suppliers" ON suppliers
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 7. Fix RLS for MEETING NOTES (Dependent on Deal Ownership)
DROP POLICY IF EXISTS "Admins can manage meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Owners and Admins can view meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users only see their own meeting notes" ON meeting_notes;

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

-- 8. Fix RLS for USERS (Privacy)
DROP POLICY IF EXISTS "Users can see their own profile and Admins can see all" ON users;
DROP POLICY IF EXISTS "Users can only see their own profile" ON users;

CREATE POLICY "Users can only see their own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);
