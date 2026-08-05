-- RLS policies for the private report-pdfs storage bucket
-- Users can only read/write PDFs under their own user-scoped path.

-- Allow authenticated users to upload reports under their own folder
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-pdfs'
  AND (storage.filename(name))::text LIKE (auth.uid() || '/%')
);

-- Allow authenticated users to read their own reports
CREATE POLICY "Users can read their own reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-pdfs'
  AND (storage.filename(name))::text LIKE (auth.uid() || '/%')
);

-- Allow authenticated users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-pdfs'
  AND (storage.filename(name))::text LIKE (auth.uid() || '/%')
);

-- Allow service role full access to manage reports
CREATE POLICY "Service role can manage all reports"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'report-pdfs')
WITH CHECK (bucket_id = 'report-pdfs');
