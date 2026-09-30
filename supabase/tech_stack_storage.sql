-- Run this after creating a public bucket named 'tech-stack' in Supabase Storage.
-- This policy allows the configured admin account to upload and manage tech logos.

DROP POLICY IF EXISTS "Admin can manage tech stack files" ON storage.objects;

CREATE POLICY "Admin can manage tech stack files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'tech-stack'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
)
WITH CHECK (
  bucket_id = 'tech-stack'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
);
