# HealthKit Imperial Units Fix

## Problem
HealthKit was failing to sync with error:
```
Could not find the 'distance_km' column of 'health_metrics_daily' in the schema cache
```

## Root Cause
The database was migrated to use imperial units (miles, pounds) via migration `20251115000000_convert_metric_to_imperial.sql`, which:
- Renamed `distance_km` → `distance_mi`
- Renamed `weight_kg` → `weight_lbs`
- Renamed `water_ml` → `water_oz`
- Renamed `total_volume_kg` → `total_volume_lbs`

However, the React Native app services were still trying to write to the old metric column names.

## Solution Applied

### 1. Updated HealthKit Service
**File:** `reactapp/services/healthKitService.js`

Changed metric data aggregation to use imperial units:
```javascript
// Before
distance_km: (sumQuantities(distance) / 1000) || null, // Convert meters to km
weight_kg: getLatest(weight),

// After
distance_mi: (sumQuantities(distance) / 1609.34) || null, // Convert meters to miles
weight_lbs: getLatest(weight) ? getLatest(weight) * 2.20462 : null, // Convert kg to lbs
```

### 2. Updated Health Data Query Service
**File:** `reactapp/services/healthDataQueryService.js`

Updated all references to use imperial column names:
- `distance_km` → `distance_mi`
- `weight_kg` → `weight_lbs`
- `water_ml` → `water_oz`

Changed display units:
- `Distance: ${day.distance_km} km` → `Distance: ${day.distance_mi} mi`

## Database Schema (Current)
The `health_metrics_daily` table now uses:
- `distance_mi` DECIMAL(10,2) - Distance in miles
- `weight_lbs` DECIMAL(6,2) - Weight in pounds
- `water_oz` DECIMAL(7,2) - Water intake in fluid ounces
- `total_volume_lbs` DECIMAL(12,2) - Workout volume in pounds

## Testing
After this fix, HealthKit sync should work without errors. The app will:
1. Collect health data from Apple Health (in metric)
2. Convert to imperial units
3. Store in Supabase using imperial column names
4. Display data correctly in the app

## Notes
- Apple Health stores data in metric units (kg, meters)
- Our app now converts to imperial for database storage
- This aligns with US user expectations (miles, pounds)
- Conversion factors used:
  - 1 meter = 0.000621371 miles (1609.34 meters = 1 mile)
  - 1 kg = 2.20462 pounds
  - 1 ml = 0.033814 fluid ounces

## Date
November 15, 2025

