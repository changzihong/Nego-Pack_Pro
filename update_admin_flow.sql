-- Add new statuses to deal_status enum
-- Note: PostgreSQL doesn't allow direct ALTER TYPE for enums easily if used in tables. 
-- We'll add them if they don't exist or use a workaround.
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'changes_requested';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'rejected';

-- Add feedback column to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- Update RLS for Admin visibility
DROP POLICY IF EXISTS "Owners have full access to their deals" ON deals;
DROP POLICY IF EXISTS "Stakeholders can view assigned deals" ON deals;

-- Policy: Owners can do everything
CREATE POLICY "Owners have full access to their deals" ON deals
FOR ALL USING (auth.uid() = owner_id);

-- Policy: Admins can see and update everything
CREATE POLICY "Admins have full access to all deals" ON deals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Ensure Admins can see the profiles of owners
DROP POLICY IF EXISTS "Users can only see their own profile" ON users;
CREATE POLICY "Users can see their own profile and Admins can see all" ON users
FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
