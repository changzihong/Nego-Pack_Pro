-- 1. Update the current user's full_name if it is null
-- Note: We can't know the exact "correct" name for all users, but we can set a better default than NULL.
-- Ideally, the user should go to Settings to update this, but this script will set a placeholder for any NULLs.

UPDATE public.users
SET full_name = 'Admin User'
WHERE full_name IS NULL OR full_name = '';

-- 2. Ensure all users are set to 'admin' role in the database (even though UI is now hardcoded to show ADMIN)
UPDATE public.users
SET role = 'admin'
WHERE role IS DISTINCT FROM 'admin';

-- 3. Just to be safe, make sure the metadata trigger continues to set 'admin' for new users (which it does in previous scripts)
-- Nothing extra needed here if the previous scripts were run.
