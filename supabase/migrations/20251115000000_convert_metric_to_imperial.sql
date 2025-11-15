-- Migration: Convert metric columns to imperial units
-- This migration renames columns and converts existing data from metric to imperial
-- Created: 2025-11-15

-- health_metrics_daily table conversions
-- 1. Rename distance_km to distance_mi and convert data
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS distance_mi DECIMAL(10,2);

UPDATE public.health_metrics_daily 
  SET distance_mi = distance_km * 0.621371 
  WHERE distance_km IS NOT NULL;

ALTER TABLE public.health_metrics_daily 
  DROP COLUMN IF EXISTS distance_km;

-- 2. Rename weight_kg to weight_lbs and convert data
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL(6,2);

UPDATE public.health_metrics_daily 
  SET weight_lbs = weight_kg * 2.20462 
  WHERE weight_kg IS NOT NULL;

ALTER TABLE public.health_metrics_daily 
  DROP COLUMN IF EXISTS weight_kg;

-- 3. Rename water_ml to water_oz and convert data (if column exists)
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS water_oz DECIMAL(7,2);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'health_metrics_daily' 
    AND column_name = 'water_ml'
  ) THEN
    UPDATE public.health_metrics_daily 
    SET water_oz = water_ml * 0.033814 
    WHERE water_ml IS NOT NULL;
    
    ALTER TABLE public.health_metrics_daily 
    DROP COLUMN IF EXISTS water_ml;
  END IF;
END $$;

-- 4. Rename total_volume_kg to total_volume_lbs and convert data (if column exists)
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS total_volume_lbs DECIMAL(12,2);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'health_metrics_daily' 
    AND column_name = 'total_volume_kg'
  ) THEN
    UPDATE public.health_metrics_daily 
    SET total_volume_lbs = total_volume_kg * 2.20462 
    WHERE total_volume_kg IS NOT NULL;
    
    ALTER TABLE public.health_metrics_daily 
    DROP COLUMN IF EXISTS total_volume_kg;
  END IF;
END $$;

-- Update comments
COMMENT ON COLUMN public.health_metrics_daily.distance_mi IS 'Total distance walked/run in miles';
COMMENT ON COLUMN public.health_metrics_daily.weight_lbs IS 'Body weight in pounds';
COMMENT ON COLUMN public.health_metrics_daily.water_oz IS 'Total water intake in fluid ounces';
COMMENT ON COLUMN public.health_metrics_daily.total_volume_lbs IS 'Total weight lifted (sets × reps × weight) in pounds';

-- Note: health_data table stores raw data with units, so no changes needed there
-- The unit field already indicates whether data is in kg, lbs, km, mi, etc.

