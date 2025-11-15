-- Final conversion: Convert weight_lbs from kg to lbs
-- Current values are in kg (e.g., 82.55 kg)
-- Need to convert to lbs (e.g., 82.55 * 2.20462 = 182.00 lbs)
-- Conversion factor: 1 kg = 2.20462 lbs

UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs * 2.20462 
WHERE weight_lbs IS NOT NULL;

