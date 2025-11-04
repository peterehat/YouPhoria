## Apple Health (HealthKit) Integration

### Overview
This app integrates with Apple Health (HealthKit) on iOS to read and (optionally) write a variety of health metrics such as steps, heart rate, sleep, workouts, energy burned, weight, and more.

Integration is implemented in `reactapp/services/healthKitService.js` using the `@kingstinct/react-native-healthkit` native module. The service encapsulates initialization, permission handling, and data retrieval using modern promise-based APIs powered by NitroModules.

### Platforms
- **iOS only**. HealthKit is not available on Android.
- Requires running on a real iOS device or an iOS simulator with Health data support.
- **Simulator Support**: HealthKit IS available on iOS Simulator (confirmed working as of iOS 16+).

### Libraries Used
- **`@kingstinct/react-native-healthkit@^11.1.2`** — Modern, actively maintained HealthKit bridge using NitroModules for high-performance native integration.
- **`react-native-nitro-modules@^0.30.0`** — Required dependency that provides the native module infrastructure for the HealthKit package.
- **`expo@~53.0.0`**, **`expo-dev-client@~5.2.4`** — App framework and custom dev client used to run native modules while developing.
- **`expo-font`**, **`expo-splash-screen`** — Required Expo modules that must be installed for the app to function properly.

### iOS Configuration

#### Required Entitlements
The app must have HealthKit capabilities enabled in `ios/YouPhoriaWellness/YouPhoriaWellness.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.healthkit</key>
  <true/>
  <key>com.apple.developer.healthkit.access</key>
  <array/>
</dict>
</plist>
```

**Critical**: Both `com.apple.developer.healthkit` AND `com.apple.developer.healthkit.access` are required for the app to appear in iOS Settings → Health → Data Access & Devices → Sources.

#### app.json Configuration
The following must be present in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "YouPhoria needs access to your health data to provide personalized wellness insights and recommendations.",
        "NSHealthUpdateUsageDescription": "YouPhoria needs permission to write health data to help you track your wellness journey.",
        "UIRequiredDeviceCapabilities": ["healthkit"]
      },
      "entitlements": {
        "com.apple.developer.healthkit": true,
        "com.apple.developer.healthkit.access": []
      }
    }
  }
}
```

#### Xcode Project Configuration
To prevent build errors when Expo modifies entitlements, add this to both Debug and Release configurations in `ios/YouPhoriaWellness.xcodeproj/project.pbxproj`:

```
CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION = YES;
```

### How the Connection Works

#### Architecture
The Kingstinct HealthKit package uses **string literal identifiers** (not enum objects) for health data types. The identifiers follow Apple's naming convention, e.g., `'HKQuantityTypeIdentifierStepCount'`.

#### Connection Flow
1. **User clicks "Connect" button** in `components/AppsScreen.js`
2. **Platform check**: Verifies the app is running on iOS
3. **Permission request**: Calls `requestAuthorization(writePermissions, readPermissions)` with two arrays:
   - `writePermissions`: Array of data types the app can write (currently empty)
   - `readPermissions`: Array of data types the app can read (~30+ types including steps, heart rate, sleep, etc.)
4. **iOS permission dialog**: System shows native HealthKit permission sheet
5. **User grants permissions**: Selects which data types to allow
6. **App appears in Settings**: Once permissions are granted, the app appears in Settings → Health → Data Access & Devices → Sources

#### Implementation Details

**Service Layer** (`services/healthKitService.js`):
- Imports named exports from `@kingstinct/react-native-healthkit`:
  - `requestAuthorization`
  - `isHealthDataAvailable`
  - `queryQuantitySamples`
  - `queryCategorySamples`
- Defines string literal mappings for type identifiers (since they're TypeScript types, not runtime objects)
- Provides wrapper methods for common operations

**UI Layer** (`components/AppsScreen.js`):
- Removed check for `NativeModules.AppleHealthKit` (doesn't exist with Kingstinct package)
- NitroModules are loaded automatically; no manual native module checks needed
- Handles connection state and displays appropriate UI feedback

### What the Code Does

The `HealthKitService` class wraps all interaction with HealthKit:

#### `requestPermissions()`
- Verifies iOS platform
- Defines arrays of read and write permissions using string literal identifiers
- Calls `requestAuthorization(writePermissions, readPermissions)`
- Returns a promise that resolves to `true` if granted, throws error otherwise
- Sets `this.isInitialized = true` on success

#### `isAvailable()`
- Calls `isHealthDataAvailable()` (synchronous function)
- Returns a boolean indicating if HealthKit is supported on the device

#### Data Fetch Methods
All methods use promise-based APIs:
- `getSteps(startDate, endDate)` → `queryQuantitySamples('HKQuantityTypeIdentifierStepCount', { from, to })`
- `getHeartRate(startDate, endDate)` → `queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', { from, to })`
- `getSleepData(startDate, endDate)` → `queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { from, to })`
- `getWeight(startDate, endDate)` → `queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', { from, to })`

#### `getHealthData()`
- Requires prior initialization
- Fetches a 7-day window of multiple metrics in parallel using `Promise.allSettled`
- Returns a structured object containing:
  - `steps`: Step count data or error
  - `heartRate`: Heart rate samples or error
  - `sleep`: Sleep analysis data or error
  - `weight`: Body mass data or error
  - `lastUpdated`: ISO timestamp

#### `disconnect()`
- Clears internal initialization state
- Note: HealthKit access cannot be revoked programmatically; users manage access in iOS Settings → Health → Data Access & Devices → Sources → YouPhoria Wellness

### Example Usage

Request permissions when the user wants to connect:

```javascript
import healthKitService from '../services/healthKitService';

async function connectToHealthKit() {
  try {
    await healthKitService.requestPermissions();
    console.log('Connected to HealthKit successfully');
  } catch (error) {
    console.error('Failed to connect:', error);
  }
}
```

Fetch health data after connection:

```javascript
async function loadHealthData() {
  // Fetch a consolidated payload (last 7 days)
  const data = await healthKitService.getHealthData();
  console.log('Health data', data);
}
```

Fetch a specific data type over a custom range:

```javascript
const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
const end = new Date();
const heartRate = await healthKitService.getHeartRate(start, end);
```

### Development Notes

#### Building and Running
- **Always use custom dev client**: Run `npx expo run:ios` (never use Expo Go for HealthKit)
- **After package updates**: Run `npx expo prebuild --clean` to regenerate native project files
- **After pod changes**: Run `cd ios && pod install --repo-update`
- **Clear Metro cache if needed**: Run `npx expo start --clear` or `rm -rf node_modules/.cache`
- **Kill background Metro processes**: Run `lsof -ti:8081 | xargs kill` if port conflicts occur

#### NitroModules Integration
- The Kingstinct package uses NitroModules (not traditional React Native native modules)
- You'll see logs like `[Nitro.HybridObjectRegistry] Registering HybridObject "CoreModule"...` during startup
- This is normal and indicates successful native module loading

#### Testing
- Health data access requires user consent
- Test on a device or simulator with Health data available
- Add sample data in the Health app for realistic testing
- Check Settings → Health → Data Access & Devices → Sources to verify app permissions

### Troubleshooting

#### Metro Bundler Errors (Module Resolution Issues)
**Symptoms**: Errors like "Unable to resolve module ./VectorIndexApi" or "Unable to resolve module events"

**Causes & Solutions**:
1. **Metro cache corruption**
   - Solution: Clear Metro cache: `npx expo start --clear`
   - Or: `rm -rf node_modules/.cache`
   - Then restart: `npx expo run:ios`

2. **Stale node_modules**
   - Solution: Clean reinstall:
     ```bash
     rm -rf node_modules package-lock.json
     npm install
     npx expo run:ios
     ```

3. **Package version conflicts**
   - Solution: Verify `package.json` matches last working state
   - Check git diff: `git diff HEAD -- package.json`
   - Revert if needed: `git checkout -- package.json package-lock.json`
   - Then: `npm install`

4. **Background Metro process conflicts**
   - Solution: Kill existing Metro: `lsof -ti:8081 | xargs kill`
   - Then restart build

**IMPORTANT**: If you see module resolution errors during build, **DO NOT** downgrade Supabase or add polyfills unless you've confirmed it's actually a package issue. Most often it's just a Metro cache problem that a clean restart will fix.

**What NOT to do**:
- ❌ Don't downgrade `@supabase/supabase-js` to fix module errors
- ❌ Don't add Node.js polyfills (`events`, `buffer`, `stream`, etc.) to React Native
- ❌ Don't modify `metro.config.js` to add `extraNodeModules` mappings
- ❌ Don't create custom polyfill files for `ws` or other Node packages

**What TO do instead**:
- ✅ Clear Metro cache first: `npx expo start --clear`
- ✅ Check if your `package.json` was accidentally modified
- ✅ Reinstall node_modules if needed
- ✅ Keep your working configuration in git and revert if something breaks

#### "HealthKit Not Available" Error
**Symptoms**: Alert shows "The HealthKit native module is not properly loaded"

**Causes & Solutions**:
1. **App not built with custom dev client**
   - Solution: Run `npx expo run:ios` (not `expo start`)
   
2. **Missing dependencies**
   - Solution: Ensure `@kingstinct/react-native-healthkit` and `react-native-nitro-modules` are in `package.json`
   - Run: `npm install --legacy-peer-deps`

3. **Pods not installed**
   - Solution: `cd ios && pod install --repo-update`

4. **Missing Expo modules**
   - Solution: Install `expo-font` and `expo-splash-screen`: `npm install expo-font expo-splash-screen --legacy-peer-deps`
   - Then: `npx expo prebuild --clean`

#### "Cannot read property 'stepCount' of undefined"
**Symptoms**: JavaScript error when trying to access type identifiers

**Cause**: The Kingstinct package exports TypeScript types, not runtime objects. Type identifiers must be defined as string literals in JavaScript.

**Solution**: Ensure `healthKitService.js` defines the identifier mappings:
```javascript
const HKQuantityTypeIdentifier = {
  stepCount: 'HKQuantityTypeIdentifierStepCount',
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  // ... etc
};
```

#### Permission Prompts Not Appearing
**Symptoms**: Clicking "Connect" does nothing or shows error without permission dialog

**Causes & Solutions**:
1. **Missing entitlements**
   - Check `ios/YouPhoriaWellness/YouPhoriaWellness.entitlements` has both:
     - `com.apple.developer.healthkit` = true
     - `com.apple.developer.healthkit.access` = []
   - Run: `npx expo prebuild --clean` to regenerate

2. **Missing Info.plist descriptions**
   - Check `app.json` has `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription`
   - Run: `npx expo prebuild --clean`

3. **Permissions already denied**
   - Go to Settings → Health → Data Access & Devices → Sources
   - Find YouPhoria Wellness and adjust permissions
   - Or: Reset simulator (Device → Erase All Content and Settings)

#### App Not Appearing in Health Settings
**Symptoms**: Settings → Health → Data Access & Devices → Sources doesn't show the app

**Cause**: Missing `com.apple.developer.healthkit.access` entitlement

**Solution**:
1. Add to `app.json`:
   ```json
   "entitlements": {
     "com.apple.developer.healthkit": true,
     "com.apple.developer.healthkit.access": []
   }
   ```
2. Run: `npx expo prebuild --clean`
3. Rebuild: `npx expo run:ios`

#### Build Errors with Entitlements
**Symptoms**: `error: Entitlements file was modified during the build`

**Solution**: Add to `ios/YouPhoriaWellness.xcodeproj/project.pbxproj` in both Debug and Release:
```
CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION = YES;
```

#### Build Errors with NitroModules
**Symptoms**: `Unable to find a specification for NitroModules` during pod install

**Solution**:
1. Install: `npm install react-native-nitro-modules --legacy-peer-deps`
2. Run: `cd ios && pod install --repo-update`
3. Clean build: `rm -rf ios/build && npx expo run:ios`

#### ExpoFontLoader Not Found
**Symptoms**: `Error: Cannot find native module 'ExpoFontLoader'`

**Cause**: Missing Expo core modules

**Solution**:
1. Install: `npm install expo-font expo-splash-screen --legacy-peer-deps`
2. Regenerate: `npx expo prebuild --clean`
3. Rebuild: `npx expo run:ios`

#### Empty Datasets
**Symptoms**: Queries return empty arrays

**Causes & Solutions**:
1. **No data in Health app**
   - Add sample data in Health app for testing
   
2. **Permissions not granted for specific types**
   - Check Settings → Health → Data Access & Devices → Sources → YouPhoria Wellness
   - Enable the specific data types you're querying

3. **Date range issues**
   - Verify your start/end dates are correct
   - Ensure data exists in the specified date range

### Migration from react-native-health

If migrating from the older `react-native-health` package:

#### Key Differences
1. **API Style**: Callback-based → Promise-based
2. **Module System**: Traditional RN modules → NitroModules
3. **Type Identifiers**: Enum objects → String literals
4. **Authorization**: Single array → Separate read/write arrays
5. **No patches needed**: Remove any `patches/react-native-health+*.patch` files

#### Migration Steps
1. Remove old package: `npm uninstall react-native-health`
2. Install new packages: `npm install @kingstinct/react-native-healthkit react-native-nitro-modules --legacy-peer-deps`
3. Update imports in `healthKitService.js` to use named exports
4. Define type identifier string mappings
5. Update `requestAuthorization` calls to use `(writePermissions, readPermissions)` signature
6. Update all data query methods to use promise-based APIs
7. Remove any checks for `NativeModules.AppleHealthKit` or `NativeModules.RCTAppleHealthKit`
8. Run: `npx expo prebuild --clean`
9. Run: `cd ios && pod install --repo-update`
10. Rebuild: `npx expo run:ios`

### Debugging Tips

#### Enable Verbose Logging
Set `DEBUG_HEALTHKIT = true` in `healthKitService.js` and `AppsScreen.js` to see detailed logs.

#### Check Native Module Loading
Look for these logs during app startup:
```
[Nitro.HybridObjectRegistry] Registering HybridObject "CoreModule"...
[Nitro.HybridObjectRegistry] Successfully registered HybridObject "CoreModule"!
```

If you don't see these, the native module isn't loading properly.

#### Verify Entitlements
Run: `cat ios/YouPhoriaWellness/YouPhoriaWellness.entitlements`

Should show both `com.apple.developer.healthkit` and `com.apple.developer.healthkit.access`.

#### Check Installed Pods
Run: `cd ios && grep -A 5 "ReactNativeHealthkit\|NitroModules" Podfile.lock`

Should show both packages with version numbers.

#### Clean Everything
If all else fails, perform a complete clean:
```bash
cd reactapp
rm -rf node_modules ios/build ios/Pods
npm install --legacy-peer-deps
npx expo prebuild --clean
cd ios && pod install --repo-update
cd .. && npx expo run:ios
```

### Future Maintenance

#### When HealthKit Connection Breaks
If the connection stops working after changes:

1. **Check if it's a code issue**:
   - Review recent git changes to `healthKitService.js` and `AppsScreen.js`
   - Look for changes to permissions arrays or type identifiers
   - Verify imports are still correct

2. **Check if it's a native module issue**:
   - Run: `cd ios && pod install --repo-update`
   - Check for NitroModules registration logs on startup
   - Verify entitlements file hasn't been modified

3. **Check if it's a build issue**:
   - Clean build: `rm -rf ios/build`
   - Regenerate: `npx expo prebuild --clean`
   - Rebuild: `npx expo run:ios`

4. **Check if it's a permissions issue**:
   - Reset simulator or check device Settings → Health
   - Verify app appears in Data Access & Devices → Sources

#### Quick Recovery Checklist
If you encounter build errors, try these steps in order:

1. **First: Clear Metro cache** (fastest, fixes 80% of issues)
   ```bash
   npx expo start --clear
   # Then rebuild
   npx expo run:ios
   ```

2. **Second: Clean node_modules** (if cache clear didn't work)
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npx expo run:ios
   ```

3. **Third: Verify package.json** (if you suspect package changes)
   ```bash
   git diff HEAD -- package.json
   # If changes look wrong, revert:
   git checkout -- package.json package-lock.json
   npm install
   npx expo run:ios
   ```

4. **Last resort: Full clean rebuild** (nuclear option)
   ```bash
   rm -rf node_modules ios/build ios/Pods package-lock.json
   npm install
   cd ios && pod install --repo-update
   cd .. && npx expo run:ios
   ```

**Rule of thumb**: Always try the simplest solution first (Metro cache clear). Don't modify package versions or add polyfills unless you've exhausted all other options.

#### Package Updates
When updating `@kingstinct/react-native-healthkit`:
1. Update `package.json` version
2. Run: `npm install --legacy-peer-deps`
3. Check for breaking changes in package release notes
4. Update type identifier mappings if needed
5. Run: `npx expo prebuild --clean`
6. Run: `cd ios && pod install --repo-update`
7. Test connection thoroughly

### Additional Resources
- [Kingstinct React Native HealthKit GitHub](https://github.com/kingstinct/react-native-healthkit)
- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [NitroModules Documentation](https://github.com/mrousavy/nitro)
- [Expo Custom Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)
