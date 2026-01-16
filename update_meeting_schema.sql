-- Fix for type mismatch: converting 'attendees' from TEXT to JSONB
DO $$ 
BEGIN
    -- 1. Convert attendees column to JSONB if it exists as TEXT
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'meeting_notes' 
        AND column_name = 'attendees' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.meeting_notes 
        ALTER COLUMN attendees TYPE JSONB USING (
            CASE 
                WHEN attendees IS NULL OR attendees = '' THEN '[]'::jsonb 
                ELSE attendees::jsonb 
            END
        );
    END IF;

    -- 2. Add location column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'location'
    ) THEN
        ALTER TABLE public.meeting_notes ADD COLUMN location TEXT;
    END IF;
    
    -- 3. In case attendees doesn't exist at all
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'attendees'
    ) THEN
        ALTER TABLE public.meeting_notes ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 4. Add missing outcome columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'discussion_points') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN discussion_points TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'decisions_made') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN decisions_made TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'next_steps') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN next_steps TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'concessions_granted') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN concessions_granted JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'concessions_received') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN concessions_received JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 4. Update security rules (RLS)
DROP POLICY IF EXISTS "Owners and Admins can view meeting notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Admins can manage meeting notes" ON public.meeting_notes;

CREATE POLICY "Owners and Admins can view meeting notes" ON public.meeting_notes
FOR SELECT USING (
  EXISTS (SELECT 1 FROM deals WHERE id = deal_id AND (owner_id = auth.uid() OR public.is_admin()))
  OR 
  (attendees @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)))
);

CREATE POLICY "Admins can manage meeting notes" ON public.meeting_notes
FOR ALL USING (public.is_admin());
