-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Service role policy (allows backend to manage all data)
DROP POLICY IF EXISTS "Service role can manage all uploaded file data" ON public.uploaded_file_data;

CREATE POLICY "Service role can manage all uploaded file data"
  ON public.uploaded_file_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
