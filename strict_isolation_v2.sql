-- DYNAMICALLY DROP ALL EXISTING POLICIES on relevant tables to ensure no "Admin View All" rules remain.
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('deals', 'suppliers', 'negotiation_packs', 'meeting_notes', 'users')
    ) LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename); 
    END LOOP; 
END $$;

-- Enable RLS just in case
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. DEALS: Strict Ownership Only
CREATE POLICY "Strict: Users see only their own deals" ON deals
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. SUPPLIERS: Strict Ownership Only
CREATE POLICY "Strict: Users see only their own suppliers" ON suppliers
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 3. NEGOTIATION PACKS: Derived Ownership (via Deal)
CREATE POLICY "Strict: Users see packs for their deals only" ON negotiation_packs
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

-- 4. MEETING NOTES: Derived Ownership (via Deal)
CREATE POLICY "Strict: Users see notes for their deals only" ON meeting_notes
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

-- 5. USERS: Privacy (Self only)
CREATE POLICY "Strict: Users see only their own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- 6. (Optional) Update existing Suppliers/Deals to belong to the CURRENT USER running the query? 
-- WARNING: This logic works in Supabase SQL editor if you are logged in, but not via generic service role.
-- We will leave existing data with NULL owner_id (invisible) effectively forcing a fresh start for strict isolation.
