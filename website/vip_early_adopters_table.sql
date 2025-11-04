-- VIP Early Adopters Table
-- Run this SQL in your Supabase dashboard SQL editor

CREATE TABLE IF NOT EXISTS public.vip_early_adopters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  referral_source TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email) -- Prevent duplicate email submissions
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_vip_early_adopters_email ON public.vip_early_adopters(email);

-- Create an index on submitted_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_vip_early_adopters_submitted_at ON public.vip_early_adopters(submitted_at DESC);

-- Enable Row Level Security (optional - you may want to disable this for public form submissions)
ALTER TABLE public.vip_early_adopters ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (for form submissions)
CREATE POLICY "Allow public insert on vip_early_adopters"
  ON public.vip_early_adopters
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy to allow authenticated users to read all submissions (optional - adjust based on your needs)
CREATE POLICY "Allow authenticated users to read vip_early_adopters"
  ON public.vip_early_adopters
  FOR SELECT
  TO authenticated
  USING (true);

-- Add a comment to the table
COMMENT ON TABLE public.vip_early_adopters IS 'VIP early access signups from the marketing website';
