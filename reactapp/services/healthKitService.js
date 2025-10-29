import { Platform, NativeModules } from 'react-native';
import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';

// Toggle verbose HealthKit logging here
const DEBUG_HEALTHKIT = __DEV__ && false;

// Debug: Check if native module is available (dev-only)
if (DEBUG_HEALTHKIT) {
  console.log('All NativeModules:', Object.keys(NativeModules));
  console.log('NativeModules.AppleHealthKit:', NativeModules.AppleHealthKit);
  console.log('NativeModules.RCTAppleHealthKit:', NativeModules.RCTAppleHealthKit);
  console.log('HealthKit Available Methods:', AppleHealthKit);
}

// Define all available HealthKit permissions
const permissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.LeanBodyMass,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.BloodType,
      AppleHealthKit.Constants.Permissions.DateOfBirth,
      AppleHealthKit.Constants.Permissions.BiologicalSex,
      AppleHealthKit.Constants.Permissions.WalkingHeartRateAverage,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilityRMSSD,
      AppleHealthKit.Constants.Permissions.VO2Max,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.DistanceCycling,
      AppleHealthKit.Constants.Permissions.DistanceSwimming,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWheelchair,
      AppleHealthKit.Constants.Permissions.BasalBodyTemperature,
      AppleHealthKit.Constants.Permissions.BloodAlcoholContent,
      AppleHealthKit.Constants.Permissions.BloodPressure,
      AppleHealthKit.Constants.Permissions.BloodType,
      AppleHealthKit.Constants.Permissions.BMI,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
      AppleHealthKit.Constants.Permissions.BoneDensity,
      AppleHealthKit.Constants.Permissions.CervicalMucusQuality,
      AppleHealthKit.Constants.Permissions.DietaryBiotin,
      AppleHealthKit.Constants.Permissions.DietaryCaffeine,
      AppleHealthKit.Constants.Permissions.DietaryCalcium,
      AppleHealthKit.Constants.Permissions.DietaryCarbohydrates,
      AppleHealthKit.Constants.Permissions.DietaryChloride,
      AppleHealthKit.Constants.Permissions.DietaryCholesterol,
      AppleHealthKit.Constants.Permissions.DietaryChromium,
      AppleHealthKit.Constants.Permissions.DietaryCopper,
      AppleHealthKit.Constants.Permissions.DietaryEnergyConsumed,
      AppleHealthKit.Constants.Permissions.DietaryFatMonounsaturated,
      AppleHealthKit.Constants.Permissions.DietaryFatPolyunsaturated,
      AppleHealthKit.Constants.Permissions.DietaryFatSaturated,
      AppleHealthKit.Constants.Permissions.DietaryFatTotal,
      AppleHealthKit.Constants.Permissions.DietaryFiber,
      AppleHealthKit.Constants.Permissions.DietaryFolate,
      AppleHealthKit.Constants.Permissions.DietaryIodine,
      AppleHealthKit.Constants.Permissions.DietaryIron,
      AppleHealthKit.Constants.Permissions.DietaryMagnesium,
      AppleHealthKit.Constants.Permissions.DietaryManganese,
      AppleHealthKit.Constants.Permissions.DietaryMolybdenum,
      AppleHealthKit.Constants.Permissions.DietaryNiacin,
      AppleHealthKit.Constants.Permissions.DietaryPantothenicAcid,
      AppleHealthKit.Constants.Permissions.DietaryPhosphorus,
      AppleHealthKit.Constants.Permissions.DietaryPotassium,
      AppleHealthKit.Constants.Permissions.DietaryProtein,
      AppleHealthKit.Constants.Permissions.DietaryRiboflavin,
      AppleHealthKit.Constants.Permissions.DietarySelenium,
      AppleHealthKit.Constants.Permissions.DietarySodium,
      AppleHealthKit.Constants.Permissions.DietarySugar,
      AppleHealthKit.Constants.Permissions.DietaryThiamin,
      AppleHealthKit.Constants.Permissions.DietaryVitaminA,
      AppleHealthKit.Constants.Permissions.DietaryVitaminB12,
      AppleHealthKit.Constants.Permissions.DietaryVitaminB6,
      AppleHealthKit.Constants.Permissions.DietaryVitaminC,
      AppleHealthKit.Constants.Permissions.DietaryVitaminD,
      AppleHealthKit.Constants.Permissions.DietaryVitaminE,
      AppleHealthKit.Constants.Permissions.DietaryVitaminK,
      AppleHealthKit.Constants.Permissions.DietaryWater,
      AppleHealthKit.Constants.Permissions.DietaryZinc,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMassIndex,
      AppleHealthKit.Constants.Permissions.BloodPressure,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
    ],
  },
};

class HealthKitService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize HealthKit
  async initialize() {
    if (Platform.OS !== 'ios') {
      throw new Error('HealthKit is only available on iOS devices');
    }

    // Check if native module is loaded
    if (!AppleHealthKit || !AppleHealthKit.initHealthKit) {
      throw new Error('HealthKit native module is not available. Please ensure react-native-health is properly linked.');
    }

    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.log('HealthKit initialization error:', error);
          this.isInitialized = false;
          reject(new Error(`HealthKit initialization failed: ${error}`));
        } else {
          if (DEBUG_HEALTHKIT) {
            console.log('HealthKit initialized successfully');
          }
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  // Check if HealthKit is available on the device
  isAvailable() {
    return new Promise((resolve) => {
      // Check if native module is loaded
      if (!AppleHealthKit || !AppleHealthKit.isAvailable) {
        console.log('HealthKit native module is not loaded');
        resolve(false);
        return;
      }

      AppleHealthKit.isAvailable((error, results) => {
        if (error) {
          console.log('HealthKit availability check error:', error);
          resolve(false);
        } else {
          if (DEBUG_HEALTHKIT) {
            console.log('HealthKit availability:', results);
          }
          resolve(results);
        }
      });
    });
  }

  // Request permissions
  async requestPermissions() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('HealthKit is only available on iOS devices');
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('HealthKit is not available on this device');
      }

      await this.initialize();
      return true;
    } catch (error) {
      console.log('Failed to request HealthKit permissions:', error);
      throw error;
    }
  }

  // Check authorization status for specific permissions
  async checkAuthorizationStatus(permission) {
    return new Promise((resolve) => {
      AppleHealthKit.getAuthorizationStatusForType(permission, (error, results) => {
        if (error) {
          console.log('Authorization status check error:', error);
          resolve(false);
        } else {
          resolve(results === AppleHealthKit.Constants.Permissions.Authorized);
        }
      });
    });
  }

  // Get steps data
  async getSteps(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getStepCount(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get heart rate data
  async getHeartRate(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getHeartRateSamples(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get sleep data
  async getSleepData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get workout data
  async getWorkouts(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSamples(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get weight data
  async getWeight(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getWeightSamples(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get blood pressure data
  async getBloodPressure(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getBloodPressureSamples(options, (callbackError, results) => {
        if (callbackError) {
          reject(callbackError);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get comprehensive health data for display
  async getHealthData() {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const [steps, heartRate, sleep, workouts, weight, bloodPressure] = await Promise.allSettled([
        this.getSteps(oneWeekAgo, now),
        this.getHeartRate(oneWeekAgo, now),
        this.getSleepData(oneWeekAgo, now),
        this.getWorkouts(oneWeekAgo, now),
        this.getWeight(oneWeekAgo, now),
        this.getBloodPressure(oneWeekAgo, now),
      ]);

      return {
        steps: steps.status === 'fulfilled' ? steps.value : { error: 'Failed to fetch' },
        heartRate: heartRate.status === 'fulfilled' ? heartRate.value : { error: 'Failed to fetch' },
        sleep: sleep.status === 'fulfilled' ? sleep.value : { error: 'Failed to fetch' },
        workouts: workouts.status === 'fulfilled' ? workouts.value : { error: 'Failed to fetch' },
        weight: weight.status === 'fulfilled' ? weight.value : { error: 'Failed to fetch' },
        bloodPressure: bloodPressure.status === 'fulfilled' ? bloodPressure.value : { error: 'Failed to fetch' },
        permissions: {
          read: permissions.permissions.read,
          write: permissions.permissions.write,
        },
        lastUpdated: now.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  }

  // Disconnect/revoke access (not directly possible with HealthKit, but we can clear our local state)
  disconnect() {
    this.isInitialized = false;
    return true;
  }
}

export default new HealthKitService();
