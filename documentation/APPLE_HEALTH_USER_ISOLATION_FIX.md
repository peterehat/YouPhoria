# Apple Health User Isolation Fix

## Problem

When switching between user accounts on the same device, Apple Health data was bleeding across accounts:

1. **User A** signs in and connects Apple Health
2. **User A** signs out
3. **User B** creates a new account on the same device
4. **User B** sees Apple Health as "connected" and can view User A's health data

## Root Causes

### 1. Global AsyncStorage Keys (FIXED)
All Apple Health data was stored in device-global AsyncStorage keys:
- `@youphoria:apple_health_connected`
- `@youphoria:apple_health_last_sync`
- `@youphoria:health_data:<dataType>`

These keys were **not** scoped to individual users, so all accounts on the device shared the same cache.

### 2. Device-Wide HealthKit Authorization (FIXED)
iOS HealthKit permissions are **device-wide**, not per-user. Once User A grants permissions, the device remembers this authorization. The app was incorrectly treating device authorization as equivalent to "user connected."

## Solutions Implemented

### Solution 1: User-Scoped Storage Keys

**File**: `reactapp/services/healthKitService.js`

Added user ID namespacing to all AsyncStorage keys:

```javascript
// Before (global)
@youphoria:apple_health_connected
@youphoria:health_data:steps

// After (user-scoped)
@youphoria:apple_health_connected:abc123
@youphoria:health_data:abc123:steps
```

**Key Changes**:
- Added `currentUserId` property to track active user
- Added `setCurrentUser(userId)` method to set the active user
- Added `getSanitizedUserId(userId)` to create safe storage keys
- Added `getUserScopedKey(baseKey)` to namespace all keys by user ID
- Added `getRawDataKey(dataType)` to create user-scoped raw data keys
- Added `migrateLegacyKeys(userId)` to migrate old global keys to user-scoped keys
- Added `clearAllLocalData()` to remove all cached data for current user

**Methods Updated**:
- `saveConnectionState()` - now saves to user-scoped key
- `loadConnectionState()` - now loads from user-scoped key
- `saveLastSyncTime()` - now saves to user-scoped key
- `getLastSyncTime()` - now loads from user-scoped key
- `saveRawHealthData()` - now saves to user-scoped key
- `loadRawHealthData()` - now loads from user-scoped key
- `disconnect()` - now calls `clearAllLocalData()` to remove all cached data

### Solution 2: Clear Cache on Sign Out

**File**: `reactapp/store/authStore.js`

Updated `signOut()` to clear all Apple Health data:

```javascript
signOut: async () => {
  set({ loading: true });
  try {
    // Set user context and clear their health data
    const currentUser = get().user;
    HealthKitService.setCurrentUser(currentUser?.id || null);
    await HealthKitService.disconnect();
    HealthKitService.setCurrentUser(null);

    const { error } = await supabase.auth.signOut();
    // ... rest of sign out logic
  }
}
```

### Solution 3: Set User Context on Sign In

**File**: `reactapp/store/authStore.js`

Updated all sign-in methods to set the user context:

```javascript
// Email sign in
signIn: async (email, password) => {
  // ... authentication logic
  HealthKitService.setCurrentUser(data.session.user.id);
  set({ session: data.session, user: data.user, isAuthenticated: true });
}

// Google sign in
signInWithGoogle: async () => {
  // ... OAuth logic
  HealthKitService.setCurrentUser(sessionData.session.user.id);
  set({ session: sessionData.session, user: sessionData.session.user });
}

// Apple sign in
signInWithApple: async () => {
  // ... OAuth logic
  HealthKitService.setCurrentUser(sessionData.session.user.id);
  set({ session: sessionData.session, user: sessionData.session.user });
}
```

### Solution 4: Require Both User Cache AND Device Authorization

**File**: `reactapp/components/AppsScreen.js`

Fixed the connection check to require **both** conditions:

```javascript
// Before (WRONG - auto-connects if device has permissions)
if (isAuthorized) {
  setConnections(prev => ({ ...prev, appleHealth: true }));
  setHealthKitAuthorized(true);
}

// After (CORRECT - requires user to have explicitly connected)
if (cachedState && isAuthorized) {
  setConnections(prev => ({ ...prev, appleHealth: true }));
  setHealthKitAuthorized(true);
} else {
  // Either no cached state or not authorized - ensure disconnected
  setConnections(prev => ({ ...prev, appleHealth: false }));
  setHealthKitAuthorized(false);
}
```

**Key Logic**:
- `cachedState` = user-scoped cache (did THIS user connect?)
- `isAuthorized` = device-wide permissions (does the device have HealthKit access?)
- Only show "connected" if **BOTH** are true

## Migration Strategy

The fix includes automatic migration of legacy data:

1. **First sign-in after update**: `migrateLegacyKeys()` runs automatically
2. **Legacy keys** (global) are copied to user-scoped keys
3. **Legacy keys** are then deleted to prevent future conflicts
4. **Subsequent users** start with clean, isolated storage

## Testing Scenarios

### Scenario 1: Existing User (Migration)
1. User A has Apple Health connected (old global keys)
2. User A signs in after update
3. ✅ Legacy keys are migrated to user-scoped keys
4. ✅ Apple Health remains connected
5. ✅ Data is preserved

### Scenario 2: New User on Same Device
1. User A has Apple Health connected
2. User A signs out
3. User B creates new account on same device
4. ✅ User B sees Apple Health as "disconnected"
5. ✅ User B cannot view User A's data
6. ✅ User B must explicitly connect Apple Health

### Scenario 3: Switching Between Users
1. User A connects Apple Health
2. User A signs out (cache cleared)
3. User B signs in (different user ID)
4. ✅ User B sees Apple Health as "disconnected"
5. User B connects Apple Health
6. User A signs back in
7. ✅ User A sees Apple Health as "disconnected" (cache was cleared)
8. ✅ User A must reconnect (will use existing device permissions)

### Scenario 4: Multiple Accounts, Same Device
1. User A connects Apple Health, syncs data
2. User B connects Apple Health, syncs data
3. User C connects Apple Health, syncs data
4. ✅ Each user has isolated cache
5. ✅ Each user sees only their own data
6. ✅ Switching between accounts works correctly

## Important Notes

### Device-Wide HealthKit Permissions
- iOS HealthKit permissions are **device-wide** and **cannot be revoked programmatically**
- Once granted, permissions persist until user manually revokes in iOS Settings
- This is by design—Apple doesn't allow apps to revoke HealthKit access
- Our fix ensures that even though permissions persist, the **connection state** and **cached data** are user-isolated

### User Must Reconnect After Sign Out
- When a user signs out, their Apple Health cache is cleared
- When they sign back in, they'll need to reconnect Apple Health
- This is intentional for security—we don't want to auto-connect without user consent
- Reconnecting is fast since device permissions are already granted (no permission dialog)

### Legacy Data Migration
- Only happens once per user on first sign-in after update
- Safe to run multiple times (checks for existing scoped keys)
- Doesn't affect users who never connected Apple Health

## Files Changed

1. **`reactapp/services/healthKitService.js`**
   - Added user ID namespacing
   - Added migration logic
   - Added clear all data method
   - Updated all storage methods

2. **`reactapp/store/authStore.js`**
   - Set user context on all sign-in methods
   - Clear health data on sign out
   - Clear user context on sign out

3. **`reactapp/components/AppsScreen.js`**
   - Fixed connection check logic
   - Require both user cache AND device authorization

## Verification

To verify the fix works:

1. **Sign in as User A**
2. **Connect Apple Health** (grant permissions if first time)
3. **View health data** (should see User A's data)
4. **Sign out**
5. **Create new account (User B)**
6. **Navigate to Apps screen**
7. ✅ **Apple Health should show as "disconnected"**
8. ✅ **"View Data" should not be available**
9. **Connect Apple Health as User B** (no permission dialog, already granted)
10. **View health data** (should see User B's data, not User A's)
11. **Sign out as User B**
12. **Sign in as User A**
13. ✅ **Apple Health should show as "disconnected"** (cache was cleared)
14. **Reconnect Apple Health as User A**
15. ✅ **Should see User A's data again**

## Security Implications

### Before Fix
- ❌ User B could view User A's health data
- ❌ Health data leaked across accounts
- ❌ No user isolation

### After Fix
- ✅ Each user has isolated health data cache
- ✅ Users must explicitly connect Apple Health
- ✅ Sign out clears all cached health data
- ✅ No data leakage between accounts

## Performance Implications

- **Minimal impact**: AsyncStorage operations are fast
- **Migration**: One-time cost on first sign-in after update
- **Storage**: Slightly more storage used (keys include user ID)
- **Sync**: No change—syncing logic unchanged

## Future Improvements

1. **Background sync**: Consider syncing health data in background
2. **Selective clear**: Allow users to keep connection but clear cached data
3. **Multi-device sync**: Sync connection state across user's devices via Supabase
4. **Connection history**: Track when user connected/disconnected for audit

## Related Documentation

- `PERSISTENT_APPLE_HEALTH.md` - Original Apple Health implementation
- `APPLE_HEALTH_INTEGRATION.md` - HealthKit integration guide
- `DATABASE_MIGRATION_GUIDE.md` - Database schema for health metrics

