-- Run this after creating a public bucket named 'projects' in Supabase Storage.
-- This policy allows the configured admin account to upload and manage project images.

DROP POLICY IF EXISTS "Admin can manage project files" ON storage.objects;

CREATE POLICY "Admin can manage project files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'projects'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
)
WITH CHECK (
  bucket_id = 'projects'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
);
