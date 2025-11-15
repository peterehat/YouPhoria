-- Correct weight_lbs values: Handle double-conversion and ensure proper kg to lbs conversion
-- Values that are very high (> 500) are likely double-converted and need to be reverted first
-- Then convert all values from kg to lbs

-- Step 1: Revert any double-conversions (values > 500 lbs are suspiciously high)
-- Divide by 2.20462 to get back to kg
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs / 2.20462 
WHERE weight_lbs IS NOT NULL 
  AND weight_lbs > 500;

-- Step 2: Now convert all values from kg to lbs
-- Values should now be in kg range (typically 40-200 kg for humans)
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs * 2.20462 
WHERE weight_lbs IS NOT NULL;

