-- Add service role policy for uploaded_file_data table
-- This allows the backend (using service role key) to insert data

-- Drop existing policies if needed and recreate with service_role support
DROP POLICY IF EXISTS "Service role can manage all uploaded file data" ON public.uploaded_file_data;

CREATE POLICY "Service role can manage all uploaded file data"
  ON public.uploaded_file_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

