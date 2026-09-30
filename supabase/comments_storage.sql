-- Run this after creating a public bucket named 'comments' in Supabase Storage.
-- This policy allows the configured admin account to upload and manage comment images.

DROP POLICY IF EXISTS "Admin can manage comment files" ON storage.objects;

CREATE POLICY "Admin can manage comment files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'comments'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
)
WITH CHECK (
  bucket_id = 'comments'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
);
