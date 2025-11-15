-- Fix weight_lbs conversion properly
-- The values in weight_lbs are currently in kg and need to be converted to lbs
-- If values were double-converted (too high), revert first, then convert
-- Conversion factor: 1 kg = 2.20462 lbs

-- Step 1: If values are > 500, they're likely double-converted, revert them first
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs / 2.20462 
WHERE weight_lbs IS NOT NULL 
  AND weight_lbs > 500;

-- Step 2: Convert all values from kg to lbs (values should be in kg range 0-500)
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs * 2.20462 
WHERE weight_lbs IS NOT NULL 
  AND weight_lbs < 500;

