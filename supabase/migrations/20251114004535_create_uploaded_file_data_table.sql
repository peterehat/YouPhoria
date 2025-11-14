-- Create uploaded_file_data table for AI-extracted data from user files
-- Migration: 006_create_uploaded_file_data_table
-- Created: 2025-11-14

CREATE TABLE IF NOT EXISTS public.uploaded_file_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Extracted data stored as flexible JSONB
  extracted_data JSONB NOT NULL,
  
  -- Metadata about extraction
  extraction_metadata JSONB,
  data_categories TEXT[], -- e.g., ['nutrition', 'exercise', 'medical']
  date_range_start DATE,
  date_range_end DATE,
  
  -- AI-generated summary for RAG
  summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.uploaded_file_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own uploaded file data"
  ON public.uploaded_file_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploaded file data"
  ON public.uploaded_file_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploaded file data"
  ON public.uploaded_file_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploaded file data"
  ON public.uploaded_file_data FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploaded_file_data_user_id 
  ON public.uploaded_file_data(user_id);

CREATE INDEX IF NOT EXISTS idx_uploaded_file_data_upload_date 
  ON public.uploaded_file_data(user_id, upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_uploaded_file_data_date_range 
  ON public.uploaded_file_data(user_id, date_range_start, date_range_end);

CREATE INDEX IF NOT EXISTS idx_uploaded_file_data_categories 
  ON public.uploaded_file_data USING GIN(data_categories);

-- Trigger for updated_at
CREATE TRIGGER update_uploaded_file_data_updated_at
  BEFORE UPDATE ON public.uploaded_file_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.uploaded_file_data IS 'Stores AI-extracted health data from user-uploaded files';
COMMENT ON COLUMN public.uploaded_file_data.user_id IS 'Reference to the user who owns this uploaded file data';
COMMENT ON COLUMN public.uploaded_file_data.file_url IS 'URL to the file in Supabase Storage';
COMMENT ON COLUMN public.uploaded_file_data.file_name IS 'Original filename';
COMMENT ON COLUMN public.uploaded_file_data.file_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN public.uploaded_file_data.extracted_data IS 'Flexible JSONB storage for AI-extracted health data';
COMMENT ON COLUMN public.uploaded_file_data.extraction_metadata IS 'Metadata about the extraction process (AI model, confidence, etc.)';
COMMENT ON COLUMN public.uploaded_file_data.data_categories IS 'Array of data categories for filtering (nutrition, exercise, medical, etc.)';
COMMENT ON COLUMN public.uploaded_file_data.date_range_start IS 'Start date of data in the file (if applicable)';
COMMENT ON COLUMN public.uploaded_file_data.date_range_end IS 'End date of data in the file (if applicable)';
COMMENT ON COLUMN public.uploaded_file_data.summary IS 'AI-generated summary for RAG context';

