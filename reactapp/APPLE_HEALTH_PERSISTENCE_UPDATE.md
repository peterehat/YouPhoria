# Apple Health Connection Persistence Update

## Summary

Updated the Apple Health integration to persist user connections across sign-outs, matching industry-standard behavior from apps like Instagram, Spotify, and MyFitnessPal.

## Changes Made

### 1. Modified Sign-Out Flow (`reactapp/store/authStore.js`)

**Before:**
```javascript
signOut: async () => {
  const currentUser = get().user;
  HealthKitService.setCurrentUser(currentUser?.id || null);
  await HealthKitService.disconnect();  // ← Cleared user's data
  HealthKitService.setCurrentUser(null);
  // ...
}
```

**After:**
```javascript
signOut: async () => {
  // Just clear the current user context, don't delete their stored data
  // This allows users to log back in and have their connections restored
  HealthKitService.setCurrentUser(null);
  // ...
}
```

**Impact:** Users' Apple Health connection state now persists in AsyncStorage when they sign out.

### 2. Updated disconnect() Method (`reactapp/services/healthKitService.js`)

**Before:**
```javascript
async disconnect() {
  this.isInitialized = false;
  await this.clearAllLocalData({ includeLegacy: true });  // ← Deleted everything
  return true;
}
```

**After:**
```javascript
async disconnect() {
  this.isInitialized = false;
  // Don't clear stored data - just reset in-memory state
  // User's connection state persists in AsyncStorage for when they log back in
  return true;
}
```

**Impact:** The disconnect() method now only resets in-memory state, preserving user data in AsyncStorage.

### 3. Added clearUserData() Method (`reactapp/services/healthKitService.js`)

**New Method:**
```javascript
async clearUserData(userId = null) {
  try {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) {
      console.warn('[HealthKit] clearUserData called without a user ID');
      return;
    }
    
    // Temporarily set the user context to clear their data
    const previousUserId = this.currentUserId;
    this.setCurrentUser(targetUserId);
    await this.clearAllLocalData({ includeLegacy: false });
    this.setCurrentUser(previousUserId);
    
    console.log('[HealthKit] Cleared all data for user:', targetUserId);
  } catch (error) {
    console.error('[HealthKit] Error clearing user data:', error);
  }
}
```

**Purpose:** Provides an explicit method to delete a user's health data, useful for features like "Delete Account" or "Clear Data".

### 4. Verified AppsScreen Logic (No Changes Needed)

The connection restoration logic in `AppsScreen.js` was already correct:

```javascript
const cachedState = await HealthKitService.loadConnectionState();  // User-scoped
const isAuthorized = await HealthKitService.getAuthorizationStatus();  // Device-wide

if (cachedState && isAuthorized) {
  // Restore connection - requires BOTH conditions
  setConnections(prev => ({ ...prev, appleHealth: true }));
}
```

This ensures that:
- User A's connection persists when they log back in
- User B doesn't see User A's connection (different user-scoped cache)

## Behavior Changes

### Before This Update

1. User A connects Apple Health
2. User A signs out → **connection cleared**
3. User A signs back in → **must reconnect manually**

### After This Update

1. User A connects Apple Health
2. User A signs out → **connection preserved**
3. User A signs back in → **connection automatically restored**

## Multi-User Scenarios

### Scenario 1: Same User Re-Login
1. User A connects Apple Health
2. User A signs out
3. User A signs back in
4. ✅ Apple Health is still connected
5. ✅ Data is immediately available

### Scenario 2: Different Users on Same Device
1. User A connects Apple Health
2. User A signs out
3. User B signs in (different account)
4. ✅ User B sees Apple Health as disconnected (their own state)
5. User B connects Apple Health
6. User B signs out
7. User A signs back in
8. ✅ User A sees Apple Health as connected (their preserved state)

### Scenario 3: Shared Device (Family iPad)
1. User A connects Apple Health → state saved under User A's ID
2. User B connects Apple Health → state saved under User B's ID
3. User C never connects → no state saved
4. ✅ Each user has independent, persistent connection state
5. ✅ Switching between users preserves each user's preferences

## Storage Architecture

### User-Scoped Keys
All Apple Health data is stored with user ID namespacing:

```
@youphoria:apple_health_connected:user123
@youphoria:apple_health_last_sync:user123
@youphoria:health_data:user123:steps
@youphoria:health_data:user123:heartRate
```

### Persistence Strategy
- Keys remain in AsyncStorage indefinitely
- Each user's data is isolated by their user ID
- No automatic cleanup on sign-out
- Explicit cleanup available via `clearUserData()` method

## Data Privacy

### User Isolation
- ✅ Each user's health data is completely isolated
- ✅ User B cannot access User A's cached data
- ✅ Connection state is per-user, not device-wide

### Device Permissions
- iOS HealthKit permissions are device-wide (Apple's design)
- Once granted, permissions persist across all users
- Our app correctly distinguishes between:
  - Device has permissions (device-wide)
  - User has connected (user-specific)

## Future Enhancements

### Delete Account Feature
When implementing account deletion, use the new `clearUserData()` method:

```javascript
// In account deletion flow
await HealthKitService.clearUserData(userId);
```

### Clear Cache Feature
If adding a "Clear Cache" or "Reset" feature:

```javascript
// Clear current user's health data
await HealthKitService.clearUserData();
```

### Storage Cleanup
Consider adding a cleanup utility to remove data for users who haven't logged in for X months:

```javascript
// Future implementation idea
async cleanupInactiveUsers(inactiveDays = 180) {
  // Get all user IDs from AsyncStorage keys
  // Check last login date from Supabase
  // Clear data for users inactive > inactiveDays
}
```

## Testing Checklist

- [x] User A connects Apple Health
- [x] User A signs out
- [x] User A signs back in
- [x] Verify Apple Health is still connected
- [x] User B signs in on same device
- [x] Verify User B sees Apple Health as disconnected
- [x] User B connects Apple Health
- [x] User A signs back in
- [x] Verify User A still sees their connection
- [x] Verify no data leakage between users

## Migration Notes

- No migration required
- User-scoped keys already exist from previous update
- Existing users will see their connections preserved automatically
- New users will have clean, isolated storage

## Related Documentation

- `APPLE_HEALTH_USER_ISOLATION_FIX.md` - Previous fix for user isolation
- `PERSISTENT_APPLE_HEALTH.md` - Original Apple Health implementation
- `APPLE_HEALTH_INTEGRATION.md` - HealthKit integration guide

## Files Modified

1. `reactapp/store/authStore.js` - Removed data clearing from sign-out
2. `reactapp/services/healthKitService.js` - Updated disconnect() and added clearUserData()
3. `reactapp/components/AppsScreen.js` - No changes (already correct)

