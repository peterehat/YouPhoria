-- Migration 003: Create health_events table for discrete time-bounded activities
-- Stores workouts, meals, sleep sessions, and other events that don't fit the value/unit model
-- Created: 2025-11-13

-- Create health_events table
CREATE TABLE IF NOT EXISTS public.health_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'workout', 'meal', 'sleep_session', 'meditation', 'run', 'bike_ride', etc.
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  title TEXT,
  description TEXT,
  metrics JSONB DEFAULT '{}', -- Event-specific metrics (workout: sets/reps/weight, meal: ingredients/macros, etc.)
  source_app TEXT,
  source_device TEXT,
  location JSONB, -- Optional: {lat, lng, city, country} for location-based activities
  quality_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health events" 
  ON public.health_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health events" 
  ON public.health_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health events" 
  ON public.health_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health events" 
  ON public.health_events FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_health_events_user_id 
  ON public.health_events(user_id);

CREATE INDEX IF NOT EXISTS idx_health_events_type 
  ON public.health_events(user_id, event_type, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_health_events_time_range 
  ON public.health_events(user_id, start_time DESC, end_time DESC);

CREATE INDEX IF NOT EXISTS idx_health_events_source 
  ON public.health_events(user_id, source_app, start_time DESC);

-- GIN index for metrics JSONB queries
CREATE INDEX IF NOT EXISTS idx_health_events_metrics 
  ON public.health_events USING GIN (metrics);

-- GIN index for location JSONB queries
CREATE INDEX IF NOT EXISTS idx_health_events_location 
  ON public.health_events USING GIN (location);

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_health_events_text_search 
  ON public.health_events USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
  );

-- Add constraint for quality score
ALTER TABLE public.health_events
  ADD CONSTRAINT chk_event_quality_score CHECK (quality_score >= 0 AND quality_score <= 1);

-- Add constraint to ensure end_time is after start_time
ALTER TABLE public.health_events
  ADD CONSTRAINT chk_event_time_order CHECK (end_time IS NULL OR end_time >= start_time);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER update_health_events_updated_at
  BEFORE UPDATE ON public.health_events
  FOR EACH ROW
  EXECUTE FUNCTION update_health_events_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.health_events IS 'Stores discrete time-bounded health events like workouts, meals, sleep sessions';
COMMENT ON COLUMN public.health_events.event_type IS 'Type of event: workout, meal, sleep_session, meditation, run, bike_ride, strength_training, etc.';
COMMENT ON COLUMN public.health_events.start_time IS 'When the event started';
COMMENT ON COLUMN public.health_events.end_time IS 'When the event ended (null for instantaneous events)';
COMMENT ON COLUMN public.health_events.duration_seconds IS 'Duration in seconds (can be calculated or stored)';
COMMENT ON COLUMN public.health_events.title IS 'Event title (e.g., "Morning Run", "Chest Day", "Breakfast")';
COMMENT ON COLUMN public.health_events.description IS 'Detailed description for semantic search (workout notes, meal details, feelings, etc.)';
COMMENT ON COLUMN public.health_events.metrics IS 'Event-specific metrics as JSON. Examples: workout: {exercises: [{name, sets, reps, weight}]}, meal: {ingredients: [], macros: {}}';
COMMENT ON COLUMN public.health_events.location IS 'Location data as JSON: {lat, lng, city, country, elevation_gain, route_polyline}';
COMMENT ON COLUMN public.health_events.quality_score IS 'Data quality score: 1.0 = device-measured, 0.95 = app-tracked, 0.7 = manual entry';

