## Apple Health (HealthKit) Integration

### Overview
This app integrates with Apple Health (HealthKit) on iOS to read and (optionally) write a variety of health metrics such as steps, heart rate, sleep, workouts, energy burned, weight, and more.

Integration is implemented in `reactapp/services/healthKitService.js` using the `react-native-health` native module. The service encapsulates initialization, permission handling, and data retrieval.

### Platforms
- iOS only. HealthKit is not available on Android.
- Requires running on a real iOS device or an iOS simulator with Health data support.

### Libraries Used
- `react-native-health@^1.19.0` — HealthKit bridge used to request permissions and query Health data.
- `expo`, `expo-dev-client` — the app framework and custom dev client used to run native modules while developing.

There is a patch applied to the HealthKit native module to ensure the Objective‑C module name is exported as `AppleHealthKit`:
- `reactapp/patches/react-native-health+1.19.0.patch` adjusts `RCT_EXPORT_MODULE()` to `RCT_EXPORT_MODULE(AppleHealthKit)` for stable native module resolution.

### iOS Configuration
- Entitlements: HealthKit capability is enabled in `ios/YouPhoriaWellness/YouPhoriaWellness.entitlements`:
  - `com.apple.developer.healthkit` = true
- Usage descriptions (Info.plist): Required user-facing strings are present in `ios/YouPhoriaWellness/Info.plist`:
  - `NSHealthShareUsageDescription`
  - `NSHealthUpdateUsageDescription`

No additional URL schemes or background modes are required for basic read/write queries.

### How the Connection Is Created
1. The app imports the native module and defines a comprehensive set of read/write permissions:
   - File: `services/healthKitService.js`
   - Object: `permissions.permissions.read` and `permissions.permissions.write`
2. Initialization calls `AppleHealthKit.initHealthKit(permissions, callback)`:
   - Prompts the user to allow access to each requested data type.
   - Sets `this.isInitialized = true` on success.
3. Availability check uses `AppleHealthKit.isAvailable` before requesting permissions.
4. Optional per‑type authorization status can be checked using `getAuthorizationStatusForType`.

### What the Code Does
The `HealthKitService` class wraps all interaction with HealthKit:

- `initialize()`
  - Ensures iOS platform, verifies the native module is loaded, then calls `initHealthKit` with the configured permissions. Resolves when the user grants permissions or rejects on error.

- `isAvailable()`
  - Returns a boolean indicating if HealthKit is available on the current device.

- `requestPermissions()`
  - Calls `isAvailable()` then `initialize()` to trigger the permissions flow.

- Data fetch methods (examples):
  - `getSteps(startDate, endDate)` → `AppleHealthKit.getStepCount`
  - `getHeartRate(startDate, endDate)` → `AppleHealthKit.getHeartRateSamples`
  - `getSleepData(startDate, endDate)` → `AppleHealthKit.getSleepSamples`
  - `getWorkouts(startDate, endDate)` → `AppleHealthKit.getSamples`
  - `getWeight(startDate, endDate)` → `AppleHealthKit.getWeightSamples`
  - `getBloodPressure(startDate, endDate)` → `AppleHealthKit.getBloodPressureSamples`

- `getHealthData()`
  - Requires prior initialization; fetches a 7‑day window of several metrics in parallel with `Promise.allSettled` and returns a single structured object containing data, the requested permissions, and a `lastUpdated` timestamp.

- `disconnect()`
  - Clears internal initialization state (HealthKit access cannot be revoked programmatically; users manage access in iOS Settings → Health → Apps).

### Example Usage
Request permissions early (e.g., on first entry into a health‑related screen), then query data.

```javascript
import healthKitService from '../services/healthKitService';

async function loadHealthData() {
  // Ensure we are on iOS and HealthKit is available, then request permissions
  await healthKitService.requestPermissions();

  // Fetch a consolidated payload (last 7 days)
  const data = await healthKitService.getHealthData();
  console.log('Health data', data);
}
```

To fetch a specific data type over a custom range:

```javascript
const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
const end = new Date();
const heartRate = await healthKitService.getHeartRate(start, end);
```

### Current UI Wiring
The UI screens `components/DataScreen.js` and `components/DevicesScreen.js` are present as placeholders and do not yet invoke `HealthKitService`. Integrations can be added by triggering `requestPermissions()` and rendering results from `getHealthData()`.

### Development Notes
- The native module name is expected to be `AppleHealthKit`. The included patch ensures consistent export naming on iOS.
- When developing with Expo, build and run the custom dev client (`expo run:ios`) so the native HealthKit module is available.
- Health data access requires user consent; run flows on a device with Health data available for realistic testing.

### Troubleshooting
- "HealthKit native module is not available" → Ensure the app is built with native modules (custom dev client), and the patch is applied. Reinstall pods if needed.
- Permission prompts not appearing → Confirm HealthKit entitlement is enabled and the app has not previously denied permissions in iOS Settings → Privacy & Security → Health → YouPhoria Wellness.
- Empty datasets → Verify Health contains data for the requested date range and data types.


