# Universal Health Data Storage - Implementation Complete

## Overview

This document describes the completed implementation of a universal health data storage architecture designed for multi-source data collection and AI analysis.

## Architecture Summary

### Three-Table Strategy

1. **`health_data`** - Raw granular data points from all sources
2. **`health_metrics_daily`** - Daily aggregated summaries
3. **`health_events`** - Time-bounded activities (workouts, meals, sleep sessions)

### Key Features

- **Multi-source support**: Apple Health, MyFitnessPal, Strava, Strong, and extensible for more
- **Smart deduplication**: Always prefers native health apps (Apple Health/Google Fit) over third-party sources
- **Quality scoring**: Each data point has a quality score (1.0 for native health, 0.95 for specialized apps, 0.7 for manual entry)
- **AI-optimized**: RAG-ready exports, semantic search, time-series analysis, correlation queries
- **Metadata preservation**: JSONB fields store app-specific details without data loss

## Files Created/Modified

### Database Migrations

- **`database-migrations/001_enhance_health_data.sql`** - Adds metadata, quality scores, deduplication flags
- **`database-migrations/002_expand_daily_metrics.sql`** - Adds nutrition and workout tracking
- **`database-migrations/003_create_health_events.sql`** - Creates events table for workouts/meals
- **`database-migrations/004_add_ai_query_indexes.sql`** - Optimizes for AI queries
- **`database-migrations/README.md`** - Migration guide with rollback instructions

### Core Services

- **`services/metricTypeRegistry.js`** - Standardized metric types, unit conversions, app mappings
- **`services/dataDeduplicationService.js`** - Smart deduplication with canonical record marking
- **`services/healthDataQueryService.js`** - AI-optimized queries (time-series, correlation, semantic search, RAG export)
- **`services/historicalSyncService.js`** - Coordinates historical data sync across all apps

### Integration Services

- **`services/integrations/appleHealthService.js`** - Enhanced Apple Health integration
- **`services/integrations/myFitnessPalService.js`** - MyFitnessPal OAuth and nutrition sync
- **`services/integrations/stravaService.js`** - Strava OAuth and activity sync
- **`services/integrations/strongService.js`** - Strong CSV import and workout tracking

### Store Updates

- **`store/appStore.js`** - Updated with new query methods and historical sync support

## Database Schema Changes

### health_data Table (Enhanced)

```sql
-- New columns added:
metadata JSONB                    -- App-specific data
description TEXT                  -- For semantic search
quality_score DECIMAL(3,2)        -- 0.0 to 1.0
data_category TEXT                -- activity, nutrition, vitals, etc.
is_aggregated BOOLEAN             -- Raw vs computed
is_canonical BOOLEAN              -- True for authoritative records
```

### health_metrics_daily Table (Expanded)

```sql
-- Nutrition fields:
protein_g, carbs_g, fat_g, calories_consumed, water_ml, fiber_g, sugar_g, sodium_mg

-- Workout fields:
workout_count, total_workout_minutes, strength_sessions, cardio_sessions, 
flexibility_sessions, total_volume_kg

-- Metadata:
data_sources JSONB                -- Tracks which apps contributed
data_completeness_score DECIMAL   -- Quality indicator for AI
```

### health_events Table (New)

```sql
CREATE TABLE health_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  event_type TEXT,              -- workout, meal, sleep_session, etc.
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  title TEXT,
  description TEXT,             -- For semantic search
  metrics JSONB,                -- Event-specific data
  source_app TEXT,
  source_device TEXT,
  location JSONB,               -- GPS data for activities
  quality_score DECIMAL(3,2)
)
```

## Deduplication Strategy

### Rules (Simplified per User Request)

1. **Always prefer Apple Health (iOS) or Google Fit/Health Connect (Android)** for ANY data type they provide
2. Mark all other app data as non-canonical if native health data exists
3. Only use third-party app data when native health apps don't provide that metric type

### Examples

- **Steps, heart rate, sleep, weight** → Apple/Android Health is canonical
- **Meal details with ingredients** → MyFitnessPal is canonical (Apple Health doesn't track this)
- **Workout sets/reps details** → Strong is canonical (Apple Health doesn't have this detail)
- **Route maps and segment analysis** → Strava is canonical (Apple Health doesn't have detailed routes)

## AI Query Capabilities

### Available Query Methods

1. **Time-Series Queries**
   ```javascript
   getTimeSeriesData(userId, metricType, startDate, endDate, options)
   // Returns: chronological data points with optional aggregation
   ```

2. **Correlation Analysis**
   ```javascript
   getCorrelationData(userId, metricTypes, startDate, endDate, options)
   // Returns: multi-metric data organized by date for correlation
   ```

3. **Daily Metrics**
   ```javascript
   getDailyMetrics(userId, startDate, endDate, options)
   // Returns: aggregated daily summaries
   ```

4. **Health Events**
   ```javascript
   getHealthEvents(userId, startDate, endDate, options)
   // Returns: workouts, meals, sleep sessions with full details
   ```

5. **Semantic Search**
   ```javascript
   semanticSearch(userId, searchQuery, options)
   // Returns: full-text search results from descriptions
   ```

6. **Data Summary**
   ```javascript
   getDataSummary(userId, startDate, endDate)
   // Returns: statistical summary for AI context
   ```

7. **RAG Export**
   ```javascript
   exportForRAG(userId, startDate, endDate, options)
   // Returns: formatted chunks ready for embedding and retrieval
   ```

## Integration Setup

### Apple Health

Already integrated. Enhanced version writes to new schema:

```javascript
import appleHealthService from './services/integrations/appleHealthService';

// Sync all historical data (365 days)
await appleHealthService.syncHistoricalData();

// Sync recent data (30 days)
await appleHealthService.syncAllHealthData(30);
```

### MyFitnessPal

Requires OAuth setup:

```javascript
import myFitnessPalService from './services/integrations/myFitnessPalService';

// 1. Initiate OAuth
const { authUrl } = await myFitnessPalService.initiateOAuth();
// Open authUrl in browser

// 2. Exchange code for token
const tokens = await myFitnessPalService.exchangeCodeForToken(code);

// 3. Save credentials
await myFitnessPalService.saveCredentials(userId, tokens);

// 4. Sync data
await myFitnessPalService.syncHistoricalData(userId);
```

### Strava

Requires OAuth setup:

```javascript
import stravaService from './services/integrations/stravaService';

// 1. Initiate OAuth
const { authUrl } = await stravaService.initiateOAuth();

// 2. Exchange code and save
const tokens = await stravaService.exchangeCodeForToken(code);
await stravaService.saveCredentials(userId, tokens);

// 3. Sync activities
await stravaService.syncHistoricalData(userId);
```

### Strong

Uses CSV import (no public API):

```javascript
import strongService from './services/integrations/strongService';

// User exports CSV from Strong app
// Then import it:
await strongService.importFromCSV(userId, csvData);
```

## Historical Data Sync

### Sync All Connected Apps

```javascript
import historicalSyncService from './services/historicalSyncService';

// Sync all apps
const result = await historicalSyncService.syncAllHistoricalData(userId, {
  parallel: false,  // Sequential sync (safer)
  appsToSync: null, // null = all apps
});

// Check sync status
const status = await historicalSyncService.getSyncStatus(userId);

// Estimate time
const estimate = await historicalSyncService.estimateSyncTime(userId);
```

### Background Sync (Incremental)

```javascript
// Sync last 7 days for all apps (for keeping data up to date)
await historicalSyncService.scheduleBackgroundSync(userId);
```

## Using the Store

### Query Examples

```javascript
import useAppStore from './store/appStore';

const store = useAppStore();

// Get time-series data
const stepsData = await store.getTimeSeriesData(
  'steps',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  { aggregation: 'daily' }
);

// Get correlation data
const correlationData = await store.getCorrelationData(
  ['steps', 'sleep_duration_hours', 'heart_rate_bpm'],
  startDate,
  endDate,
  { aggregation: 'daily' }
);

// Get workouts
const workouts = await store.getHealthEvents(
  startDate,
  endDate,
  { eventTypes: ['workout', 'strength_training', 'run'] }
);

// Search health data
const results = await store.searchHealthData('morning run');

// Export for AI
const ragData = await store.exportForRAG(
  startDate,
  endDate,
  { includeDailyMetrics: true, includeEvents: true }
);
```

## Next Steps

### 1. Apply Database Migrations

Run the SQL migrations in your Supabase dashboard:

```bash
# In order:
001_enhance_health_data.sql
002_expand_daily_metrics.sql
003_create_health_events.sql
004_add_ai_query_indexes.sql
```

See `database-migrations/README.md` for detailed instructions.

### 2. Configure API Credentials

Add to your environment variables:

```env
# MyFitnessPal
MFP_CLIENT_ID=your_client_id
MFP_CLIENT_SECRET=your_client_secret

# Strava
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
```

### 3. Update UI Components

Integrate the new query methods into your data visualization components:

```javascript
// Example: DataScreen.js
import useAppStore from '../store/appStore';

function DataScreen() {
  const { getDailyMetrics, getHealthEvents } = useAppStore();
  
  useEffect(() => {
    const loadData = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const metrics = await getDailyMetrics(startDate, endDate);
      const events = await getHealthEvents(startDate, endDate);
      
      // Display data...
    };
    
    loadData();
  }, []);
  
  // ...
}
```

### 4. Implement OAuth Flows

Add OAuth callback handling for MyFitnessPal and Strava in your app navigation.

### 5. Add CSV Import UI

Create a file picker for Strong CSV imports.

### 6. Set Up Background Sync

Schedule periodic background syncs to keep data fresh:

```javascript
// Run daily or when app opens
await store.scheduleBackgroundSync();
```

## Benefits for AI Analysis

1. **Multi-resolution data**: Raw samples for detailed analysis, daily aggregates for trends
2. **Semantic search**: Natural language queries on workout notes, meal descriptions
3. **Context preservation**: JSONB metadata keeps all app-specific details
4. **Quality indicators**: AI can weight data sources appropriately
5. **Efficient querying**: Optimized indexes reduce query time
6. **Correlation analysis**: Unified schema enables cross-metric insights
7. **RAG-optimized**: Structured format with text descriptions perfect for embedding

## Troubleshooting

### Data Not Syncing

1. Check connected_apps table for active connections
2. Verify credentials haven't expired
3. Check sync_status column for errors
4. Review logs for specific error messages

### Duplicate Data

Run deduplication manually:

```javascript
import { markNonCanonicalRecords } from './services/dataDeduplicationService';

await markNonCanonicalRecords(userId);
```

### Missing Metrics

Check if the metric type is mapped in `metricTypeRegistry.js`. Add new mappings as needed.

## Support

For questions or issues:
1. Check the service-specific documentation in each file
2. Review the database migration README
3. Examine console logs for detailed error messages
4. Verify database schema matches migration files

## Summary

The universal health data architecture is now complete and ready for use. All integrations support historical data sync, smart deduplication ensures data quality, and AI-optimized queries enable powerful analysis capabilities. The system is extensible for future app integrations following the same patterns established here.

