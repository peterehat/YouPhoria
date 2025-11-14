# Persistent Apple Health Connection - Implementation Guide

## Overview

The Apple Health connection is now persistent across app restarts and navigation. Users no longer need to click "Connect" every time they visit the Apps screen. The implementation uses a hybrid data storage strategy with local caching (AsyncStorage) and cloud sync (Supabase).

## What Was Implemented

### 1. Database Schema (`database-migrations/health_metrics_daily.sql`)

Created a new table `health_metrics_daily` to store aggregated daily health metrics:

- **Activity metrics**: steps, distance, calories, exercise minutes, flights climbed
- **Heart metrics**: average heart rate, resting heart rate, HRV
- **Sleep metrics**: total sleep hours
- **Body metrics**: weight
- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic timestamps**: created_at and updated_at

**To apply the schema**: Run this SQL in your Supabase SQL Editor.

### 2. HealthKit Service Enhancements (`services/healthKitService.js`)

Added new methods for persistent connection and data management:

#### Authorization & Connection State
- `getAuthorizationStatus()` - Check if user has granted HealthKit permissions
- `saveConnectionState(isConnected)` - Save connection state to AsyncStorage
- `loadConnectionState()` - Load cached connection state
- `saveLastSyncTime()` - Save last sync timestamp
- `getLastSyncTime()` - Get last sync timestamp

#### Local Data Storage
- `saveRawHealthData(dataType, data)` - Cache raw health data locally
- `loadRawHealthData(dataType)` - Load cached health data
- `clearOldLocalData(daysToKeep)` - Remove data older than N days (default 30)

#### Data Aggregation & Cloud Sync
- `aggregateDailyMetrics(date)` - Aggregate raw HealthKit data by day
- `syncDailyMetricsToCloud(dailyMetrics)` - Upload aggregated metrics to Supabase
- `fetchCloudMetrics(startDate, endDate)` - Fetch metrics from Supabase
- `syncHealthData(days)` - Main sync method (aggregates and uploads last N days)

### 3. Apps Screen Updates (`components/AppsScreen.js`)

#### Auto-Connection on Mount
- Checks authorization status when screen loads
- Restores connection state if user has already granted permissions
- Shows last sync time below connection status
- No more manual "Connect" clicks needed!

#### Enhanced Connection Flow
- Saves connection state to AsyncStorage on successful connection
- Syncs connection to Supabase for multi-device support
- Triggers initial 7-day data sync on first connection
- Shows sync progress and results to user

#### Disconnect Flow
- Clears local connection state
- Removes from Supabase database
- Provides clear feedback to user

### 4. App Store Updates (`store/appStore.js`)

Added health metrics management methods:

- `syncHealthMetrics(metricsArray)` - Batch upload metrics to Supabase
- `fetchHealthMetrics(startDate, endDate)` - Fetch metrics from Supabase
- `getAppleHealthConnection()` - Get Apple Health connection status
- `updateLastSync(appId)` - Update last sync timestamp for an app

### 5. App Launch Sync (`App.js`)

Automatic health data sync on app launch:

- Checks if Apple Health is connected
- Verifies authorization status
- Syncs data if last sync was > 1 hour ago
- Syncs last 7 days of health data
- Runs silently in background

## Data Flow

```
User Opens App
    ↓
Check AsyncStorage (cached connection state)
    ↓
Verify HealthKit Authorization (source of truth)
    ↓
If Authorized → Restore Connection State
    ↓
Check Last Sync Time
    ↓
If > 1 hour ago → Sync Health Data
    ↓
Fetch Raw Data from HealthKit
    ↓
Aggregate by Day (steps, calories, heart rate, etc.)
    ↓
Store Locally (AsyncStorage) + Upload to Supabase
    ↓
Update Last Sync Timestamp
    ↓
Clean Up Old Local Data (> 30 days)
```

## Storage Strategy

### Local Storage (AsyncStorage)
**Purpose**: Fast access, privacy, offline support

**What's Stored**:
- Connection state
- Last sync timestamp
- Raw health samples (last 30 days)
- Detailed metrics for quick UI rendering

**Keys**:
- `@youphoria:apple_health_connected` - Connection state
- `@youphoria:apple_health_last_sync` - Last sync timestamp
- `@youphoria:health_data:{dataType}` - Raw health data by type

### Cloud Storage (Supabase)
**Purpose**: Multi-device sync, historical trends, insights

**What's Stored**:
- Daily aggregated metrics only (not raw samples)
- Steps, distance, calories, exercise minutes
- Average heart rate, resting heart rate
- Sleep hours, weight
- Connection metadata

**What's NOT Stored**:
- Raw minute-by-minute data
- Sensitive medical data (blood pressure, glucose)
- Personally identifiable health information beyond aggregates

## User Experience

### First Time Connection
1. User clicks "Connect" on Apple Health
2. iOS shows HealthKit permission dialog
3. User grants permissions
4. App saves connection state locally
5. App syncs to Supabase (if authenticated)
6. App fetches and syncs last 7 days of data
7. Shows success message with sync count

### Subsequent App Opens
1. User opens app
2. App checks AsyncStorage (instant)
3. App verifies HealthKit authorization
4. Connection state restored automatically
5. Shows "Connected" with last sync time
6. Syncs data if > 1 hour since last sync

### Navigating to Apps Screen
1. User navigates to Apps screen
2. Connection state already restored
3. Shows "Connected" immediately
4. Displays last sync time (e.g., "2h ago")
5. No loading state or "Connect" button needed

## Security & Privacy

### Row Level Security (RLS)
- Users can only access their own health data
- Enforced at database level
- Policies for SELECT, INSERT, UPDATE, DELETE

### Data Minimization
- Only aggregated metrics stored in cloud
- Raw data stays on device
- Automatic cleanup after 30 days

### User Control
- Can disconnect anytime
- Disconnecting clears local state
- Removes from Supabase database
- Can revoke permissions in iOS Settings

## Sync Behavior

### Automatic Sync Triggers
1. **App Launch**: If last sync > 1 hour ago
2. **First Connection**: Syncs last 7 days immediately
3. **Manual Trigger**: User clicks "View Data"

### Sync Frequency
- **Minimum interval**: 1 hour (prevents excessive syncing)
- **Data range**: Last 7 days (configurable)
- **Background**: Not implemented (per user request)

### Sync Process
1. Check if connected and authorized
2. Fetch raw data from HealthKit for each day
3. Aggregate metrics by day
4. Upload to Supabase (upsert - insert or update)
5. Update last sync timestamp
6. Clean up old local data

## Testing

### Manual Testing Checklist

1. **First Connection**
   - [ ] Click "Connect" on Apple Health
   - [ ] Grant permissions in iOS dialog
   - [ ] Verify "Connected" status appears
   - [ ] Verify sync count shown in success message
   - [ ] Check last sync time displays

2. **Persistence Across Navigation**
   - [ ] Connect Apple Health
   - [ ] Navigate to another screen
   - [ ] Navigate back to Apps screen
   - [ ] Verify still shows "Connected"
   - [ ] Verify last sync time persists

3. **Persistence Across App Restarts**
   - [ ] Connect Apple Health
   - [ ] Close app completely
   - [ ] Reopen app
   - [ ] Navigate to Apps screen
   - [ ] Verify auto-connected (no "Connect" button)
   - [ ] Verify last sync time shown

4. **Disconnection**
   - [ ] Click "Disconnect" on Apple Health
   - [ ] Verify shows "Not Connected"
   - [ ] Verify last sync time cleared
   - [ ] Close and reopen app
   - [ ] Verify stays disconnected

5. **Data Sync**
   - [ ] Connect Apple Health
   - [ ] Wait for initial sync
   - [ ] Close app
   - [ ] Wait 1+ hours
   - [ ] Reopen app
   - [ ] Check console logs for sync activity
   - [ ] Verify last sync time updated

6. **Supabase Integration**
   - [ ] Connect Apple Health while authenticated
   - [ ] Check Supabase `connected_apps` table
   - [ ] Verify Apple Health entry exists
   - [ ] Check `health_metrics_daily` table
   - [ ] Verify daily metrics uploaded
   - [ ] Verify user_id matches authenticated user

## Troubleshooting

### Connection State Not Persisting
- Check AsyncStorage is working: `npx react-native log-ios`
- Look for `[HealthKit] Connection state saved` logs
- Verify `getAuthorizationStatus()` returns true

### Data Not Syncing
- Check console for sync errors
- Verify user is authenticated (Supabase requires auth)
- Check `health_metrics_daily` table exists
- Verify RLS policies are correct
- Check network connectivity

### Authorization Check Fails
- Verify app is built with `npx expo run:ios` (not Expo Go)
- Check HealthKit entitlements in Xcode
- Verify permissions granted in iOS Settings → Health
- Try revoking and re-granting permissions

### Supabase Errors
- Check user is authenticated
- Verify `health_metrics_daily` table exists
- Run the SQL migration script
- Check RLS policies allow user access
- Verify `connected_apps` table has required columns

## Configuration

### Sync Interval
Change in `App.js`:
```javascript
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour
```

### Sync Data Range
Change in `App.js` and `AppsScreen.js`:
```javascript
await HealthKitService.syncHealthData(7); // 7 days
```

### Local Data Retention
Change in `healthKitService.js`:
```javascript
await this.clearOldLocalData(30); // 30 days
```

### Debug Logging
Enable in `healthKitService.js` and `AppsScreen.js`:
```javascript
const DEBUG_HEALTHKIT = __DEV__ && true; // Set to true
```

## Next Steps

### Recommended Enhancements
1. **Data Visualization**: Create charts showing trends over time
2. **Insights Generation**: Analyze patterns and provide recommendations
3. **Manual Sync Button**: Let users trigger sync on demand
4. **Sync Status Indicator**: Show when sync is in progress
5. **Offline Queue**: Queue syncs when offline, upload when online
6. **Selective Sync**: Let users choose which metrics to sync
7. **Export Data**: Allow users to export their health data
8. **Delete Cloud Data**: Add button to delete all cloud data

### Optional Features (Not Implemented)
- **Background Fetch**: Daily background sync (requires additional setup)
- **Push Notifications**: Notify when sync completes
- **Conflict Resolution**: Handle data conflicts across devices
- **Data Compression**: Compress large datasets before upload

## Files Modified

1. `reactapp/database-migrations/health_metrics_daily.sql` - NEW
2. `reactapp/services/healthKitService.js` - MODIFIED
3. `reactapp/components/AppsScreen.js` - MODIFIED
4. `reactapp/store/appStore.js` - MODIFIED
5. `reactapp/App.js` - MODIFIED

## Dependencies

All required dependencies are already installed:
- `@react-native-async-storage/async-storage` - Local storage
- `@supabase/supabase-js` - Cloud database
- `@kingstinct/react-native-healthkit` - HealthKit access

No additional packages needed!

## Summary

The Apple Health connection is now fully persistent. Users connect once, and the app remembers their choice across app restarts and navigation. Health data syncs automatically when the app opens, with aggregated metrics stored in Supabase for insights and multi-device access. Raw data stays local for privacy and fast access.

**Key Benefits**:
- ✅ No more repeated "Connect" clicks
- ✅ Automatic data sync on app launch
- ✅ Multi-device sync via Supabase
- ✅ Privacy-first (raw data stays local)
- ✅ Fast access (local cache)
- ✅ Offline support (works without internet)
- ✅ Automatic cleanup (old data removed)

The implementation is complete and ready for testing!

