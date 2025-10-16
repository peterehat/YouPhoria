import AppleHealthKit, { HealthValue, HealthKitPermissions } from 'react-native-health';

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
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.log('HealthKit initialization error:', error);
          this.isInitialized = false;
          reject(error);
        } else {
          console.log('HealthKit initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  // Check if HealthKit is available on the device
  isAvailable() {
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error, results) => {
        if (error) {
          console.log('HealthKit availability check error:', error);
          resolve(false);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Request permissions
  async requestPermissions() {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.log('Failed to request HealthKit permissions:', error);
      return false;
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

  // Disconnect/revoke access (not directly possible with HealthKit, but we can clear our local state)
  disconnect() {
    this.isInitialized = false;
    return true;
  }
}

export default new HealthKitService();
