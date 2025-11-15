-- Restore original weight values by undoing all the bad conversions
-- The original migration (20251115000000) converted from weight_kg to weight_lbs correctly
-- But then we applied multiple bad conversions on top
-- We need to divide by 2.20462 multiple times to get back to the original kg values

-- Undo all the conversions (divide by 2.20462 for each time we multiplied)
-- Based on the migrations applied:
-- 1. Original migration: kg * 2.20462 = lbs (correct)
-- 2. Bad migration 1: lbs * 2.20462 (wrong - doubled)
-- 3. Bad migration 2: value / 2.20462 then * 2.20462 (neutral for high values, but doubled low values)
-- 4. Bad migration 3: value / 2.20462 then * 2.20462 (doubled again)

-- To restore: divide by (2.20462^3) to undo the 3 extra multiplications
UPDATE public.health_metrics_daily 
SET weight_lbs = weight_lbs / (2.20462 * 2.20462 * 2.20462)
WHERE weight_lbs IS NOT NULL;

