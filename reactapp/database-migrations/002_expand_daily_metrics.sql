-- Migration 002: Expand health_metrics_daily table for multi-source data
-- Adds nutrition, workout tracking, and data source metadata
-- Created: 2025-11-13

-- Add nutrition fields
ALTER TABLE public.health_metrics_daily
  ADD COLUMN IF NOT EXISTS protein_g DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS fat_g DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS calories_consumed INTEGER,
  ADD COLUMN IF NOT EXISTS water_ml INTEGER,
  ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS sugar_g DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS sodium_mg INTEGER;

-- Add workout tracking fields
ALTER TABLE public.health_metrics_daily
  ADD COLUMN IF NOT EXISTS workout_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_workout_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_sessions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cardio_sessions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS flexibility_sessions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_volume_kg DECIMAL(10,2);

-- Add metadata fields
ALTER TABLE public.health_metrics_daily
  ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_completeness_score DECIMAL(3,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.health_metrics_daily.protein_g IS 'Total protein consumed in grams';
COMMENT ON COLUMN public.health_metrics_daily.carbs_g IS 'Total carbohydrates consumed in grams';
COMMENT ON COLUMN public.health_metrics_daily.fat_g IS 'Total fat consumed in grams';
COMMENT ON COLUMN public.health_metrics_daily.calories_consumed IS 'Total calories consumed (from food/drinks)';
COMMENT ON COLUMN public.health_metrics_daily.water_ml IS 'Total water intake in milliliters';
COMMENT ON COLUMN public.health_metrics_daily.fiber_g IS 'Total dietary fiber in grams';
COMMENT ON COLUMN public.health_metrics_daily.sugar_g IS 'Total sugar consumed in grams';
COMMENT ON COLUMN public.health_metrics_daily.sodium_mg IS 'Total sodium consumed in milligrams';
COMMENT ON COLUMN public.health_metrics_daily.workout_count IS 'Total number of workouts/exercise sessions';
COMMENT ON COLUMN public.health_metrics_daily.total_workout_minutes IS 'Total workout duration in minutes';
COMMENT ON COLUMN public.health_metrics_daily.strength_sessions IS 'Number of strength/resistance training sessions';
COMMENT ON COLUMN public.health_metrics_daily.cardio_sessions IS 'Number of cardio/aerobic sessions';
COMMENT ON COLUMN public.health_metrics_daily.flexibility_sessions IS 'Number of flexibility/stretching sessions';
COMMENT ON COLUMN public.health_metrics_daily.total_volume_kg IS 'Total weight lifted (sets × reps × weight) in kg';
COMMENT ON COLUMN public.health_metrics_daily.data_sources IS 'JSON object tracking which apps contributed to each metric, e.g., {"steps": "Apple Health", "calories_consumed": "MyFitnessPal"}';
COMMENT ON COLUMN public.health_metrics_daily.data_completeness_score IS 'Score from 0-1 indicating data completeness for AI analysis (1.0 = all expected metrics present)';

-- Add constraint for completeness score
ALTER TABLE public.health_metrics_daily
  ADD CONSTRAINT chk_completeness_score CHECK (data_completeness_score >= 0 AND data_completeness_score <= 1);

-- Create GIN index for data_sources JSONB queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_daily_sources 
  ON public.health_metrics_daily USING GIN (data_sources);

