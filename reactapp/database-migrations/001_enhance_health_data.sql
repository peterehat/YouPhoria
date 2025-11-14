-- Migration 001: Enhance health_data table for universal health data storage
-- This migration adds fields to support multi-source data, AI analysis, and deduplication
-- Created: 2025-11-13

-- Add new columns to health_data table
ALTER TABLE public.health_data 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS data_category TEXT,
  ADD COLUMN IF NOT EXISTS is_aggregated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.health_data.metadata IS 'App-specific data stored as JSON (workout details, meal info, route maps, etc.)';
COMMENT ON COLUMN public.health_data.description IS 'Human-readable description for semantic search (workout notes, meal descriptions, user annotations)';
COMMENT ON COLUMN public.health_data.quality_score IS 'Data quality score: 1.0 = Apple/Android Health, 0.95 = specialized apps, 0.7 = manual entry, 0.5 = estimates';
COMMENT ON COLUMN public.health_data.data_category IS 'High-level category: activity, nutrition, vitals, workout, sleep, body_measurement, etc.';
COMMENT ON COLUMN public.health_data.is_aggregated IS 'Flag to distinguish raw measurements from computed/aggregated values';
COMMENT ON COLUMN public.health_data.is_canonical IS 'True if this is the authoritative record for this metric (used for deduplication)';

-- Create index for canonical data queries (AI will primarily query canonical data)
CREATE INDEX IF NOT EXISTS idx_health_data_canonical 
  ON public.health_data(user_id, data_type, recorded_at DESC) 
  WHERE is_canonical = true;

-- Create index for category-based queries
CREATE INDEX IF NOT EXISTS idx_health_data_category 
  ON public.health_data(user_id, data_category, recorded_at DESC);

-- Create index for quality score filtering
CREATE INDEX IF NOT EXISTS idx_health_data_quality 
  ON public.health_data(user_id, quality_score DESC, recorded_at DESC);

-- Create GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_health_data_metadata 
  ON public.health_data USING GIN (metadata);

-- Create full-text search index for descriptions
CREATE INDEX IF NOT EXISTS idx_health_data_description_fts 
  ON public.health_data USING GIN (to_tsvector('english', COALESCE(description, '')));

-- Add constraint to ensure quality_score is between 0 and 1
ALTER TABLE public.health_data 
  ADD CONSTRAINT chk_quality_score CHECK (quality_score >= 0 AND quality_score <= 1);

