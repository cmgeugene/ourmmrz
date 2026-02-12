-- Create a new bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Policy to allow public read access to profile images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

-- Policy to allow authenticated users to upload their own profile images
-- Path convention: {user_id}/{filename}
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own images
CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profiles' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
