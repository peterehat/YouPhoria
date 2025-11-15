# Run Imperial Units Migration

## Problem
The Supabase CLI is experiencing network connectivity issues and cannot connect to the database.

## Solution: Use SQL Editor

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/empmaiqjpyhanrpuabou/sql
2. Click "New query"

### Step 2: Copy the Migration SQL

Copy the entire contents from: `supabase/migrations/20251115000000_convert_metric_to_imperial.sql`

Or copy this SQL directly:

```sql
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

-- 3. Rename water_ml to water_oz and convert data
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS water_oz DECIMAL(7,2);

UPDATE public.health_metrics_daily 
  SET water_oz = water_ml * 0.033814 
  WHERE water_ml IS NOT NULL;

ALTER TABLE public.health_metrics_daily 
  DROP COLUMN IF EXISTS water_ml;

-- 4. Rename total_volume_kg to total_volume_lbs and convert data
ALTER TABLE public.health_metrics_daily 
  ADD COLUMN IF NOT EXISTS total_volume_lbs DECIMAL(12,2);

UPDATE public.health_metrics_daily 
  SET total_volume_lbs = total_volume_kg * 2.20462 
  WHERE total_volume_kg IS NOT NULL;

ALTER TABLE public.health_metrics_daily 
  DROP COLUMN IF EXISTS total_volume_kg;

-- Update comments
COMMENT ON COLUMN public.health_metrics_daily.distance_mi IS 'Total distance walked/run in miles';
COMMENT ON COLUMN public.health_metrics_daily.weight_lbs IS 'Body weight in pounds';
COMMENT ON COLUMN public.health_metrics_daily.water_oz IS 'Total water intake in fluid ounces';
COMMENT ON COLUMN public.health_metrics_daily.total_volume_lbs IS 'Total weight lifted (sets × reps × weight) in pounds';

-- Note: health_data table stores raw data with units, so no changes needed there
-- The unit field already indicates whether data is in kg, lbs, km, mi, etc.
```

### Step 3: Run the Migration
1. Paste the SQL into the editor
2. Click "Run" (or press Cmd+Enter)
3. Wait for success message

### Step 4: Verify
Check the Table Editor to confirm:
- `distance_mi` column exists (distance_km removed)
- `weight_lbs` column exists (weight_kg removed)
- `water_oz` column exists (water_ml removed)
- `total_volume_lbs` column exists (total_volume_kg removed)

## What This Does
Converts the database columns from metric to imperial units:
- Distance: kilometers → miles
- Weight: kilograms → pounds
- Water: milliliters → fluid ounces
- Volume: kilograms → pounds

All existing data is automatically converted using the proper conversion factors.

## Why SQL Editor Instead of CLI?
The Supabase CLI is experiencing network connectivity issues:
- IPv6 routing problems
- Connection pooler issues
- Direct connection blocked

The SQL Editor works through the web interface and doesn't have these issues.

## After Migration
Once the migration is complete, your app will display:
- Weight in lbs (e.g., "182.0 lbs" instead of "82.6 kg")
- Distance in miles
- Water in fluid ounces

The backend code has already been updated to expect these imperial units.

