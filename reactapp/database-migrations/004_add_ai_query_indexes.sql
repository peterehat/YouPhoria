-- Migration 004: Add specialized indexes for AI query optimization
-- Optimizes for time-series analysis, correlation queries, and RAG retrieval
-- Created: 2025-11-13

-- Composite index for time-series queries on health_data
-- Optimized for: "Get all steps data for user X between dates Y and Z"
CREATE INDEX IF NOT EXISTS idx_health_data_timeseries 
  ON public.health_data(user_id, data_type, recorded_at DESC, value)
  WHERE is_canonical = true;

-- Composite index for multi-metric correlation queries
-- Optimized for: "Get steps, heart_rate, and sleep for correlation analysis"
CREATE INDEX IF NOT EXISTS idx_health_data_correlation 
  ON public.health_data(user_id, recorded_at DESC, data_type, value)
  WHERE is_canonical = true;

-- Index for category-based aggregations
-- Optimized for: "Get all activity metrics for the last 30 days"
CREATE INDEX IF NOT EXISTS idx_health_data_category_agg 
  ON public.health_data(user_id, data_category, recorded_at DESC)
  WHERE is_canonical = true AND is_aggregated = false;

-- Composite index for daily metrics time-series
-- Optimized for: "Get daily summaries for user X in date range"
CREATE INDEX IF NOT EXISTS idx_daily_metrics_timeseries 
  ON public.health_metrics_daily(user_id, date DESC);

-- Partial index for incomplete data detection
-- Optimized for: "Find days with missing or incomplete data"
CREATE INDEX IF NOT EXISTS idx_daily_metrics_incomplete 
  ON public.health_metrics_daily(user_id, date DESC, data_completeness_score)
  WHERE data_completeness_score < 0.8;

-- Composite index for event-based queries
-- Optimized for: "Get all workouts in the last week"
CREATE INDEX IF NOT EXISTS idx_health_events_recent 
  ON public.health_events(user_id, event_type, start_time DESC)
  WHERE start_time > NOW() - INTERVAL '90 days';

-- Index for workout analysis
-- Optimized for: "Get all strength training sessions with metrics"
CREATE INDEX IF NOT EXISTS idx_health_events_workouts 
  ON public.health_events(user_id, start_time DESC)
  WHERE event_type IN ('workout', 'strength_training', 'cardio', 'run', 'bike_ride', 'swim');

-- Index for meal/nutrition analysis
-- Optimized for: "Get all meals with nutrition data"
CREATE INDEX IF NOT EXISTS idx_health_events_meals 
  ON public.health_events(user_id, start_time DESC)
  WHERE event_type IN ('meal', 'breakfast', 'lunch', 'dinner', 'snack');

-- Composite index for source-based queries
-- Optimized for: "Compare data from Apple Health vs Strava"
CREATE INDEX IF NOT EXISTS idx_health_data_by_source 
  ON public.health_data(user_id, source_app, data_type, recorded_at DESC);

-- Index for data quality analysis
-- Optimized for: "Find low-quality data points that need review"
CREATE INDEX IF NOT EXISTS idx_health_data_quality_review 
  ON public.health_data(user_id, quality_score, recorded_at DESC)
  WHERE quality_score < 0.8;

-- Covering index for common AI queries (includes value in index)
-- Optimized for: "Get metric values without table lookup"
CREATE INDEX IF NOT EXISTS idx_health_data_covering 
  ON public.health_data(user_id, data_type, recorded_at DESC)
  INCLUDE (value, unit, quality_score, source_app)
  WHERE is_canonical = true;

-- Statistics update for query planner
-- Ensures PostgreSQL has accurate statistics for optimal query planning
ANALYZE public.health_data;
ANALYZE public.health_metrics_daily;
ANALYZE public.health_events;

-- Add helpful comments
COMMENT ON INDEX idx_health_data_timeseries IS 'Optimized for time-series queries on canonical data';
COMMENT ON INDEX idx_health_data_correlation IS 'Optimized for multi-metric correlation analysis';
COMMENT ON INDEX idx_daily_metrics_timeseries IS 'Optimized for daily summary queries';
COMMENT ON INDEX idx_health_events_workouts IS 'Optimized for workout history and analysis';
COMMENT ON INDEX idx_health_events_meals IS 'Optimized for nutrition tracking and meal analysis';

