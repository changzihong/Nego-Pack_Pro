-- Fix RLS policies for Suppliers table
DROP POLICY IF EXISTS "Authorized users can view suppliers" ON suppliers;

CREATE POLICY "Authenticated users can select suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert suppliers" ON suppliers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers" ON suppliers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Ensure all other tables have proper INSERT policies as well
CREATE POLICY "Authenticated users can insert deals" ON deals
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert packs" ON negotiation_packs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert comments" ON stakeholder_comments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert meeting notes" ON meeting_notes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
