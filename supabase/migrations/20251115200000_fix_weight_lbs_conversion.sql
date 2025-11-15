-- Fix weight_lbs conversion: Convert ALL values from kg to lbs
-- The weight_lbs column currently contains values in kg that need to be converted to lbs
-- Conversion factor: 1 kg = 2.20462 lbs

-- Update ALL weight_lbs values to convert from kg to lbs
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs * 2.20462 
WHERE weight_lbs IS NOT NULL;

