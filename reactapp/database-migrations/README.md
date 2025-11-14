# Database Migrations Guide

This directory contains SQL migration files for the YouPhoria health data schema.

## Migration Files

### 001_enhance_health_data.sql
Enhances the `health_data` table with fields for:
- Metadata storage (JSONB)
- Semantic search descriptions
- Quality scoring
- Data categorization
- Aggregation flags
- Canonical record marking for deduplication

### 002_expand_daily_metrics.sql
Expands the `health_metrics_daily` table with:
- Nutrition tracking (protein, carbs, fat, calories, water, etc.)
- Workout tracking (session counts, duration, volume)
- Data source metadata
- Completeness scoring

### 003_create_health_events.sql
Creates the new `health_events` table for discrete time-bounded activities:
- Workouts, meals, sleep sessions, meditation
- Start/end times and duration
- Flexible metrics storage (JSONB)
- Location data support
- Full-text search on titles and descriptions

### 004_add_ai_query_indexes.sql
Adds specialized indexes optimized for:
- Time-series queries
- Correlation analysis
- Category-based aggregations
- Source comparison
- Quality filtering

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Click "New query"
4. Copy and paste the contents of each migration file **in order**
5. Run each migration

### Option 2: Supabase CLI
```bash
# If you have the Supabase CLI installed
supabase db push
```

### Option 3: Direct PostgreSQL Connection
```bash
# Connect to your database
psql -h <your-host> -U <your-user> -d <your-database>

# Run each migration
\i 001_enhance_health_data.sql
\i 002_expand_daily_metrics.sql
\i 003_create_health_events.sql
\i 004_add_ai_query_indexes.sql
```

## Migration Order

**IMPORTANT**: Run migrations in numerical order (001, 002, 003, 004) to ensure proper dependencies.

## Rollback

If you need to rollback changes, you can:

### Rollback 004 (Indexes only)
```sql
-- Drop AI query indexes
DROP INDEX IF EXISTS idx_health_data_timeseries;
DROP INDEX IF EXISTS idx_health_data_correlation;
DROP INDEX IF EXISTS idx_health_data_category_agg;
DROP INDEX IF EXISTS idx_daily_metrics_timeseries;
DROP INDEX IF EXISTS idx_daily_metrics_incomplete;
DROP INDEX IF EXISTS idx_health_events_recent;
DROP INDEX IF EXISTS idx_health_events_workouts;
DROP INDEX IF EXISTS idx_health_events_meals;
DROP INDEX IF EXISTS idx_health_data_by_source;
DROP INDEX IF EXISTS idx_health_data_quality_review;
DROP INDEX IF EXISTS idx_health_data_covering;
```

### Rollback 003 (health_events table)
```sql
DROP TABLE IF EXISTS public.health_events CASCADE;
DROP FUNCTION IF EXISTS update_health_events_updated_at() CASCADE;
```

### Rollback 002 (health_metrics_daily columns)
```sql
ALTER TABLE public.health_metrics_daily
  DROP COLUMN IF EXISTS protein_g,
  DROP COLUMN IF EXISTS carbs_g,
  DROP COLUMN IF EXISTS fat_g,
  DROP COLUMN IF EXISTS calories_consumed,
  DROP COLUMN IF EXISTS water_ml,
  DROP COLUMN IF EXISTS fiber_g,
  DROP COLUMN IF EXISTS sugar_g,
  DROP COLUMN IF EXISTS sodium_mg,
  DROP COLUMN IF EXISTS workout_count,
  DROP COLUMN IF EXISTS total_workout_minutes,
  DROP COLUMN IF EXISTS strength_sessions,
  DROP COLUMN IF EXISTS cardio_sessions,
  DROP COLUMN IF EXISTS flexibility_sessions,
  DROP COLUMN IF EXISTS total_volume_kg,
  DROP COLUMN IF EXISTS data_sources,
  DROP COLUMN IF EXISTS data_completeness_score;

DROP INDEX IF EXISTS idx_health_metrics_daily_sources;
```

### Rollback 001 (health_data columns)
```sql
ALTER TABLE public.health_data
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS quality_score,
  DROP COLUMN IF EXISTS data_category,
  DROP COLUMN IF EXISTS is_aggregated,
  DROP COLUMN IF EXISTS is_canonical;

DROP INDEX IF EXISTS idx_health_data_canonical;
DROP INDEX IF EXISTS idx_health_data_category;
DROP INDEX IF EXISTS idx_health_data_quality;
DROP INDEX IF EXISTS idx_health_data_metadata;
DROP INDEX IF EXISTS idx_health_data_description_fts;
```

## Verification

After running migrations, verify the schema:

```sql
-- Check health_data columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'health_data' 
ORDER BY ordinal_position;

-- Check health_metrics_daily columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'health_metrics_daily' 
ORDER BY ordinal_position;

-- Check health_events table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'health_events';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('health_data', 'health_metrics_daily', 'health_events')
ORDER BY tablename, indexname;
```

## Notes

- All migrations use `IF NOT EXISTS` / `IF EXISTS` clauses for idempotency
- Migrations are safe to run multiple times
- Existing data is preserved
- Row Level Security (RLS) policies are maintained
- Indexes are created with appropriate names for easy identification

