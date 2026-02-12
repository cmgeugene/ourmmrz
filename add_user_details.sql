-- Add nickname and profile_image_url columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to read other users in the same couple
-- This policy might already exist or overlap, but ensuring partners can see each other
CREATE POLICY "Users can view their partner profile" 
ON users FOR SELECT 
USING (
    couple_id IN (
        SELECT couple_id FROM users WHERE id = auth.uid()
    )
);
