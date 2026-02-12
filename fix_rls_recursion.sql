-- Drop the problematic policy causing recursion
DROP POLICY IF EXISTS "Users can view their partner profile" ON users;

-- Create a secure function to fetch the current user's couple_id
-- SECURITY DEFINER allows this function to run with the privileges of the creator (bypassing RLS for this specific lookup)
CREATE OR REPLACE FUNCTION get_auth_couple_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT couple_id FROM users WHERE id = auth.uid();
$$;

-- Re-create the policy using the secure function
CREATE POLICY "Users can view their partner profile" 
ON users FOR SELECT 
USING (
    -- Allow access if the target user's couple_id matches the current user's couple_id
    couple_id = get_auth_couple_id() 
    -- OR if it is the user themselves (usually covered by another policy, but safe to include)
    OR id = auth.uid()
);
