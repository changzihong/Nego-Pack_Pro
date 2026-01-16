-- Add missing columns to meeting_notes table
DO $$ 
BEGIN
    -- Add discussion_points
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'discussion_points') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN discussion_points TEXT;
    END IF;

    -- Add decisions_made
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'decisions_made') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN decisions_made TEXT;
    END IF;

    -- Add next_steps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'next_steps') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN next_steps TEXT;
    END IF;

    -- Add concessions_granted (using JSONB to match the app's export)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'concessions_granted') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN concessions_granted JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add concessions_received (using JSONB to match the app's export)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meeting_notes' AND column_name = 'concessions_received') THEN
        ALTER TABLE public.meeting_notes ADD COLUMN concessions_received JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
