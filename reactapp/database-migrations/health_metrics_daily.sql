-- Health Metrics Daily Table
-- Stores aggregated daily health metrics from Apple Health
-- Created: 2025-11-04

-- Table: health_metrics_daily
CREATE TABLE IF NOT EXISTS health_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Activity metrics
  steps INTEGER,
  distance_km DECIMAL(10,2),
  active_calories INTEGER,
  resting_calories INTEGER,
  exercise_minutes INTEGER,
  flights_climbed INTEGER,
  
  -- Heart metrics
  avg_heart_rate INTEGER,
  resting_heart_rate INTEGER,
  heart_rate_variability DECIMAL(10,2),
  
  -- Sleep metrics
  sleep_hours DECIMAL(4,2),
  
  -- Body metrics
  weight_kg DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE health_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own health metrics
CREATE POLICY "Users can view own health metrics"
  ON health_metrics_daily FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own health metrics
CREATE POLICY "Users can insert own health metrics"
  ON health_metrics_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own health metrics
CREATE POLICY "Users can update own health metrics"
  ON health_metrics_daily FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own health metrics
CREATE POLICY "Users can delete own health metrics"
  ON health_metrics_daily FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date 
  ON health_metrics_daily(user_id, date DESC);

-- Update existing connected_apps table to track sync status
ALTER TABLE connected_apps ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE connected_apps ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_health_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER update_health_metrics_daily_updated_at
  BEFORE UPDATE ON health_metrics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_health_metrics_updated_at();

-- Comments for documentation
COMMENT ON TABLE health_metrics_daily IS 'Stores aggregated daily health metrics from Apple Health and other sources';
COMMENT ON COLUMN health_metrics_daily.user_id IS 'Reference to the user who owns this health data';
COMMENT ON COLUMN health_metrics_daily.date IS 'The date for which these metrics are aggregated';
COMMENT ON COLUMN health_metrics_daily.steps IS 'Total steps taken on this date';
COMMENT ON COLUMN health_metrics_daily.distance_km IS 'Total distance walked/run in kilometers';
COMMENT ON COLUMN health_metrics_daily.active_calories IS 'Active energy burned in calories';
COMMENT ON COLUMN health_metrics_daily.resting_calories IS 'Resting/basal energy burned in calories';
COMMENT ON COLUMN health_metrics_daily.exercise_minutes IS 'Total exercise minutes';
COMMENT ON COLUMN health_metrics_daily.flights_climbed IS 'Number of flights of stairs climbed';
COMMENT ON COLUMN health_metrics_daily.avg_heart_rate IS 'Average heart rate in bpm';
COMMENT ON COLUMN health_metrics_daily.resting_heart_rate IS 'Resting heart rate in bpm';
COMMENT ON COLUMN health_metrics_daily.heart_rate_variability IS 'Heart rate variability (HRV) in milliseconds';
COMMENT ON COLUMN health_metrics_daily.sleep_hours IS 'Total sleep hours';
COMMENT ON COLUMN health_metrics_daily.weight_kg IS 'Body weight in kilograms';

