-- Run this once in Supabase Dashboard > SQL Editor.
-- The "certificates" bucket must already exist and be marked Public.

DROP POLICY IF EXISTS "Admin can manage certificate files" ON storage.objects;

CREATE POLICY "Admin can manage certificate files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
)
WITH CHECK (
  bucket_id = 'certificates'
  AND (auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com'
);
