-- Storage policies for vehicle-images bucket
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Allow anyone to view images (public read access)
CREATE POLICY "Public read access for vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- 3. Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- 4. Allow authenticated users to delete vehicle images
CREATE POLICY "Authenticated users can delete vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

