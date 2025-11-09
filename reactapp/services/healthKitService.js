import { Platform } from 'react-native';
import {
  requestAuthorization,
  isHealthDataAvailable,
  queryQuantitySamples,
  queryCategorySamples,
  getRequestStatusForAuthorization,
} from '@kingstinct/react-native-healthkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Toggle verbose HealthKit logging here
const DEBUG_HEALTHKIT = __DEV__ && false;

// AsyncStorage keys
const STORAGE_KEYS = {
  CONNECTION_STATE: '@youphoria:apple_health_connected',
  LAST_SYNC: '@youphoria:apple_health_last_sync',
  RAW_DATA_PREFIX: '@youphoria:health_data:',
};

const USER_ID_SANITIZE_REGEX = /[^a-zA-Z0-9_-]/g;

// HealthKit Type Identifiers (string literals as per Kingstinct API)
// Comprehensive set for maximum data access
const HKQuantityTypeIdentifier = {
  // Activity & Fitness
  stepCount: 'HKQuantityTypeIdentifierStepCount',
  distanceWalkingRunning: 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  distanceCycling: 'HKQuantityTypeIdentifierDistanceCycling',
  distanceSwimming: 'HKQuantityTypeIdentifierDistanceSwimming',
  distanceWheelchair: 'HKQuantityTypeIdentifierDistanceWheelchair',
  pushCount: 'HKQuantityTypeIdentifierPushCount',
  flightsClimbed: 'HKQuantityTypeIdentifierFlightsClimbed',
  swimmingStrokeCount: 'HKQuantityTypeIdentifierSwimmingStrokeCount',
  activeEnergyBurned: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  basalEnergyBurned: 'HKQuantityTypeIdentifierBasalEnergyBurned',
  nikeFuel: 'HKQuantityTypeIdentifierNikeFuel',
  appleExerciseTime: 'HKQuantityTypeIdentifierAppleExerciseTime',
  appleStandTime: 'HKQuantityTypeIdentifierAppleStandTime',
  
  // Heart
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  restingHeartRate: 'HKQuantityTypeIdentifierRestingHeartRate',
  walkingHeartRateAverage: 'HKQuantityTypeIdentifierWalkingHeartRateAverage',
  heartRateVariabilitySDNN: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  heartRateRecoveryOneMinute: 'HKQuantityTypeIdentifierHeartRateRecoveryOneMinute',
  atrialFibrillationBurden: 'HKQuantityTypeIdentifierAtrialFibrillationBurden',
  vo2Max: 'HKQuantityTypeIdentifierVO2Max',
  
  // Body Measurements
  height: 'HKQuantityTypeIdentifierHeight',
  bodyMass: 'HKQuantityTypeIdentifierBodyMass',
  bodyMassIndex: 'HKQuantityTypeIdentifierBodyMassIndex',
  bodyFatPercentage: 'HKQuantityTypeIdentifierBodyFatPercentage',
  leanBodyMass: 'HKQuantityTypeIdentifierLeanBodyMass',
  waistCircumference: 'HKQuantityTypeIdentifierWaistCircumference',
  
  // Vitals
  bloodPressureSystolic: 'HKQuantityTypeIdentifierBloodPressureSystolic',
  bloodPressureDiastolic: 'HKQuantityTypeIdentifierBloodPressureDiastolic',
  bloodGlucose: 'HKQuantityTypeIdentifierBloodGlucose',
  oxygenSaturation: 'HKQuantityTypeIdentifierOxygenSaturation',
  respiratoryRate: 'HKQuantityTypeIdentifierRespiratoryRate',
  bodyTemperature: 'HKQuantityTypeIdentifierBodyTemperature',
  basalBodyTemperature: 'HKQuantityTypeIdentifierBasalBodyTemperature',
  bloodAlcoholContent: 'HKQuantityTypeIdentifierBloodAlcoholContent',
  peripheralPerfusionIndex: 'HKQuantityTypeIdentifierPeripheralPerfusionIndex',
  
  // Nutrition
  dietaryFatTotal: 'HKQuantityTypeIdentifierDietaryFatTotal',
  dietaryFatPolyunsaturated: 'HKQuantityTypeIdentifierDietaryFatPolyunsaturated',
  dietaryFatMonounsaturated: 'HKQuantityTypeIdentifierDietaryFatMonounsaturated',
  dietaryFatSaturated: 'HKQuantityTypeIdentifierDietaryFatSaturated',
  dietaryCholesterol: 'HKQuantityTypeIdentifierDietaryCholesterol',
  dietarySodium: 'HKQuantityTypeIdentifierDietarySodium',
  dietaryCarbohydrates: 'HKQuantityTypeIdentifierDietaryCarbohydrates',
  dietaryFiber: 'HKQuantityTypeIdentifierDietaryFiber',
  dietarySugar: 'HKQuantityTypeIdentifierDietarySugar',
  dietaryEnergyConsumed: 'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  dietaryProtein: 'HKQuantityTypeIdentifierDietaryProtein',
  dietaryVitaminA: 'HKQuantityTypeIdentifierDietaryVitaminA',
  dietaryVitaminB6: 'HKQuantityTypeIdentifierDietaryVitaminB6',
  dietaryVitaminB12: 'HKQuantityTypeIdentifierDietaryVitaminB12',
  dietaryVitaminC: 'HKQuantityTypeIdentifierDietaryVitaminC',
  dietaryVitaminD: 'HKQuantityTypeIdentifierDietaryVitaminD',
  dietaryVitaminE: 'HKQuantityTypeIdentifierDietaryVitaminE',
  dietaryVitaminK: 'HKQuantityTypeIdentifierDietaryVitaminK',
  dietaryCalcium: 'HKQuantityTypeIdentifierDietaryCalcium',
  dietaryIron: 'HKQuantityTypeIdentifierDietaryIron',
  dietaryThiamin: 'HKQuantityTypeIdentifierDietaryThiamin',
  dietaryRiboflavin: 'HKQuantityTypeIdentifierDietaryRiboflavin',
  dietaryNiacin: 'HKQuantityTypeIdentifierDietaryNiacin',
  dietaryFolate: 'HKQuantityTypeIdentifierDietaryFolate',
  dietaryBiotin: 'HKQuantityTypeIdentifierDietaryBiotin',
  dietaryPantothenicAcid: 'HKQuantityTypeIdentifierDietaryPantothenicAcid',
  dietaryPhosphorus: 'HKQuantityTypeIdentifierDietaryPhosphorus',
  dietaryIodine: 'HKQuantityTypeIdentifierDietaryIodine',
  dietaryMagnesium: 'HKQuantityTypeIdentifierDietaryMagnesium',
  dietaryZinc: 'HKQuantityTypeIdentifierDietaryZinc',
  dietarySelenium: 'HKQuantityTypeIdentifierDietarySelenium',
  dietaryCopper: 'HKQuantityTypeIdentifierDietaryCopper',
  dietaryManganese: 'HKQuantityTypeIdentifierDietaryManganese',
  dietaryChromium: 'HKQuantityTypeIdentifierDietaryChromium',
  dietaryMolybdenum: 'HKQuantityTypeIdentifierDietaryMolybdenum',
  dietaryChloride: 'HKQuantityTypeIdentifierDietaryChloride',
  dietaryPotassium: 'HKQuantityTypeIdentifierDietaryPotassium',
  dietaryCaffeine: 'HKQuantityTypeIdentifierDietaryCaffeine',
  dietaryWater: 'HKQuantityTypeIdentifierDietaryWater',
  
  // UV Exposure
  uvExposure: 'HKQuantityTypeIdentifierUVExposure',
  
  // Hearing
  environmentalAudioExposure: 'HKQuantityTypeIdentifierEnvironmentalAudioExposure',
  headphoneAudioExposure: 'HKQuantityTypeIdentifierHeadphoneAudioExposure',
  
  // Mobility
  walkingSpeed: 'HKQuantityTypeIdentifierWalkingSpeed',
  walkingStepLength: 'HKQuantityTypeIdentifierWalkingStepLength',
  walkingAsymmetryPercentage: 'HKQuantityTypeIdentifierWalkingAsymmetryPercentage',
  walkingDoubleSupportPercentage: 'HKQuantityTypeIdentifierWalkingDoubleSupportPercentage',
  sixMinuteWalkTestDistance: 'HKQuantityTypeIdentifierSixMinuteWalkTestDistance',
  stairAscentSpeed: 'HKQuantityTypeIdentifierStairAscentSpeed',
  stairDescentSpeed: 'HKQuantityTypeIdentifierStairDescentSpeed',
  
  // Respiratory
  forcedVitalCapacity: 'HKQuantityTypeIdentifierForcedVitalCapacity',
  forcedExpiratoryVolume1: 'HKQuantityTypeIdentifierForcedExpiratoryVolume1',
  peakExpiratoryFlowRate: 'HKQuantityTypeIdentifierPeakExpiratoryFlowRate',
  numberOfTimesFallen: 'HKQuantityTypeIdentifierNumberOfTimesFallen',
  inhalerUsage: 'HKQuantityTypeIdentifierInhalerUsage',
  
  // Reproductive Health
  numberOfAlcoholicBeverages: 'HKQuantityTypeIdentifierNumberOfAlcoholicBeverages',
};

const HKCategoryTypeIdentifier = {
  sleepAnalysis: 'HKCategoryTypeIdentifierSleepAnalysis',
  appleStandHour: 'HKCategoryTypeIdentifierAppleStandHour',
  cervicalMucusQuality: 'HKCategoryTypeIdentifierCervicalMucusQuality',
  ovulationTestResult: 'HKCategoryTypeIdentifierOvulationTestResult',
  menstrualFlow: 'HKCategoryTypeIdentifierMenstrualFlow',
  intermenstrualBleeding: 'HKCategoryTypeIdentifierIntermenstrualBleeding',
  sexualActivity: 'HKCategoryTypeIdentifierSexualActivity',
  mindfulSession: 'HKCategoryTypeIdentifierMindfulSession',
  highHeartRateEvent: 'HKCategoryTypeIdentifierHighHeartRateEvent',
  lowHeartRateEvent: 'HKCategoryTypeIdentifierLowHeartRateEvent',
  irregularHeartRhythmEvent: 'HKCategoryTypeIdentifierIrregularHeartRhythmEvent',
  audioExposureEvent: 'HKCategoryTypeIdentifierAudioExposureEvent',
  toothbrushingEvent: 'HKCategoryTypeIdentifierToothbrushingEvent',
  lowCardioFitnessEvent: 'HKCategoryTypeIdentifierLowCardioFitnessEvent',
  contraceptive: 'HKCategoryTypeIdentifierContraceptive',
  lactation: 'HKCategoryTypeIdentifierLactation',
  pregnancy: 'HKCategoryTypeIdentifierPregnancy',
  pregnancyTestResult: 'HKCategoryTypeIdentifierPregnancyTestResult',
  progesteroneTestResult: 'HKCategoryTypeIdentifierProgesteroneTestResult',
  environmentalAudioExposureEvent: 'HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent',
  headphoneAudioExposureEvent: 'HKCategoryTypeIdentifierHeadphoneAudioExposureEvent',
  handwashingEvent: 'HKCategoryTypeIdentifierHandwashingEvent',
  appleWalkingSteadinessEvent: 'HKCategoryTypeIdentifierAppleWalkingSteadinessEvent',
};

const HKCharacteristicTypeIdentifier = {
  biologicalSex: 'HKCharacteristicTypeIdentifierBiologicalSex',
  dateOfBirth: 'HKCharacteristicTypeIdentifierDateOfBirth',
  bloodType: 'HKCharacteristicTypeIdentifierBloodType',
  fitzpatrickSkinType: 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
  wheelchairUse: 'HKCharacteristicTypeIdentifierWheelchairUse',
  activityMoveMode: 'HKCharacteristicTypeIdentifierActivityMoveMode',
};

class HealthKitService {
  constructor() {
    this.isInitialized = false;
    this.currentUserId = null;
  }

  setCurrentUser(userId) {
    const normalizedId = typeof userId === 'string' && userId.length > 0 ? userId : null;
    this.currentUserId = normalizedId;

    if (this.currentUserId) {
      this.migrateLegacyKeys(this.currentUserId).catch((error) => {
        console.error('[HealthKit] Error migrating legacy keys:', error);
      });
    }
  }

  getSanitizedUserId(userId = this.currentUserId) {
    if (!userId) {
      return null;
    }
    return userId.replace(USER_ID_SANITIZE_REGEX, '_');
  }

  getUserScopedKey(baseKey) {
    const sanitizedId = this.getSanitizedUserId();
    if (!sanitizedId) {
      return baseKey;
    }

    if (baseKey.endsWith(':')) {
      return `${baseKey}${sanitizedId}:`;
    }

    return `${baseKey}:${sanitizedId}`;
  }

  getRawDataKey(dataType) {
    const prefix = this.getUserScopedKey(STORAGE_KEYS.RAW_DATA_PREFIX);
    return `${prefix}${dataType}`;
  }

  async migrateLegacyKeys(userId) {
    try {
      const sanitizedId = this.getSanitizedUserId(userId);
      if (!sanitizedId) {
        return;
      }

      // Migrate connection state
      const legacyConnection = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_STATE);
      if (legacyConnection) {
        const namespacedKey = `${STORAGE_KEYS.CONNECTION_STATE}:${sanitizedId}`;
        const existingScoped = await AsyncStorage.getItem(namespacedKey);
        if (!existingScoped) {
          await AsyncStorage.setItem(namespacedKey, legacyConnection);
        }
        await AsyncStorage.removeItem(STORAGE_KEYS.CONNECTION_STATE);
      }

      // Migrate last sync time
      const legacyLastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (legacyLastSync) {
        const namespacedKey = `${STORAGE_KEYS.LAST_SYNC}:${sanitizedId}`;
        const existingScoped = await AsyncStorage.getItem(namespacedKey);
        if (!existingScoped) {
          await AsyncStorage.setItem(namespacedKey, legacyLastSync);
        }
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      }

      // Migrate raw data keys
      const allKeys = await AsyncStorage.getAllKeys();
      const legacyPrefix = STORAGE_KEYS.RAW_DATA_PREFIX;
      const targetPrefix = `${legacyPrefix}${sanitizedId}:`;

      const legacyKeys = allKeys.filter((key) => key.startsWith(legacyPrefix) && !key.startsWith(targetPrefix));
      if (legacyKeys.length === 0) {
        return;
      }

      const operations = legacyKeys.map(async (legacyKey) => {
        const data = await AsyncStorage.getItem(legacyKey);
        if (data) {
          const suffix = legacyKey.substring(legacyPrefix.length);
          const scopedKey = `${targetPrefix}${suffix}`;
          const existingScoped = await AsyncStorage.getItem(scopedKey);
          if (!existingScoped) {
            await AsyncStorage.setItem(scopedKey, data);
          }
        }
        await AsyncStorage.removeItem(legacyKey);
      });

      await Promise.all(operations);
    } catch (error) {
      console.error('[HealthKit] Failed to migrate legacy keys:', error);
    }
  }

  async clearAllLocalData({ includeLegacy = true } = {}) {
    try {
      const keysToRemove = new Set();

      const scopedConnectionKey = this.getUserScopedKey(STORAGE_KEYS.CONNECTION_STATE);
      const scopedLastSyncKey = this.getUserScopedKey(STORAGE_KEYS.LAST_SYNC);

      keysToRemove.add(scopedConnectionKey);
      keysToRemove.add(scopedLastSyncKey);

      const allKeys = await AsyncStorage.getAllKeys();
      const scopedRawPrefix = this.getUserScopedKey(STORAGE_KEYS.RAW_DATA_PREFIX);
      allKeys.forEach((key) => {
        if (key.startsWith(scopedRawPrefix)) {
          keysToRemove.add(key);
        }
      });

      if (includeLegacy) {
        keysToRemove.add(STORAGE_KEYS.CONNECTION_STATE);
        keysToRemove.add(STORAGE_KEYS.LAST_SYNC);

        allKeys.forEach((key) => {
          if (key.startsWith(STORAGE_KEYS.RAW_DATA_PREFIX)) {
            keysToRemove.add(key);
          }
        });
      }

      const keysArray = Array.from(keysToRemove).filter(Boolean);
      if (keysArray.length > 0) {
        await AsyncStorage.multiRemove(keysArray);
      }
    } catch (error) {
      console.error('[HealthKit] Error clearing local data:', error);
    }
  }

  // Initialize HealthKit and request permissions
  async requestPermissions() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('HealthKit is only available on iOS devices');
      }

      if (DEBUG_HEALTHKIT) {
        console.log('[HealthKit] Requesting permissions...');
      }

      // Define read permissions (comprehensive set for maximum data access)
      const readPermissions = [
        // Activity & Fitness
        HKQuantityTypeIdentifier.stepCount,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        HKQuantityTypeIdentifier.distanceCycling,
        HKQuantityTypeIdentifier.distanceSwimming,
        HKQuantityTypeIdentifier.distanceWheelchair,
        HKQuantityTypeIdentifier.pushCount,
        HKQuantityTypeIdentifier.flightsClimbed,
        HKQuantityTypeIdentifier.swimmingStrokeCount,
        HKQuantityTypeIdentifier.activeEnergyBurned,
        HKQuantityTypeIdentifier.basalEnergyBurned,
        HKQuantityTypeIdentifier.nikeFuel,
        HKQuantityTypeIdentifier.appleExerciseTime,
        HKQuantityTypeIdentifier.appleStandTime,
        
        // Heart
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.restingHeartRate,
        HKQuantityTypeIdentifier.walkingHeartRateAverage,
        HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
        HKQuantityTypeIdentifier.heartRateRecoveryOneMinute,
        HKQuantityTypeIdentifier.atrialFibrillationBurden,
        HKQuantityTypeIdentifier.vo2Max,
        
        // Body Measurements
        HKQuantityTypeIdentifier.height,
        HKQuantityTypeIdentifier.bodyMass,
        HKQuantityTypeIdentifier.bodyMassIndex,
        HKQuantityTypeIdentifier.bodyFatPercentage,
        HKQuantityTypeIdentifier.leanBodyMass,
        HKQuantityTypeIdentifier.waistCircumference,
        
        // Vitals
        HKQuantityTypeIdentifier.bloodPressureSystolic,
        HKQuantityTypeIdentifier.bloodPressureDiastolic,
        HKQuantityTypeIdentifier.bloodGlucose,
        HKQuantityTypeIdentifier.oxygenSaturation,
        HKQuantityTypeIdentifier.respiratoryRate,
        HKQuantityTypeIdentifier.bodyTemperature,
        HKQuantityTypeIdentifier.basalBodyTemperature,
        HKQuantityTypeIdentifier.bloodAlcoholContent,
        HKQuantityTypeIdentifier.peripheralPerfusionIndex,
        
        // Nutrition
        HKQuantityTypeIdentifier.dietaryFatTotal,
        HKQuantityTypeIdentifier.dietaryFatPolyunsaturated,
        HKQuantityTypeIdentifier.dietaryFatMonounsaturated,
        HKQuantityTypeIdentifier.dietaryFatSaturated,
        HKQuantityTypeIdentifier.dietaryCholesterol,
        HKQuantityTypeIdentifier.dietarySodium,
        HKQuantityTypeIdentifier.dietaryCarbohydrates,
        HKQuantityTypeIdentifier.dietaryFiber,
        HKQuantityTypeIdentifier.dietarySugar,
        HKQuantityTypeIdentifier.dietaryEnergyConsumed,
        HKQuantityTypeIdentifier.dietaryProtein,
        HKQuantityTypeIdentifier.dietaryVitaminA,
        HKQuantityTypeIdentifier.dietaryVitaminB6,
        HKQuantityTypeIdentifier.dietaryVitaminB12,
        HKQuantityTypeIdentifier.dietaryVitaminC,
        HKQuantityTypeIdentifier.dietaryVitaminD,
        HKQuantityTypeIdentifier.dietaryVitaminE,
        HKQuantityTypeIdentifier.dietaryVitaminK,
        HKQuantityTypeIdentifier.dietaryCalcium,
        HKQuantityTypeIdentifier.dietaryIron,
        HKQuantityTypeIdentifier.dietaryThiamin,
        HKQuantityTypeIdentifier.dietaryRiboflavin,
        HKQuantityTypeIdentifier.dietaryNiacin,
        HKQuantityTypeIdentifier.dietaryFolate,
        HKQuantityTypeIdentifier.dietaryBiotin,
        HKQuantityTypeIdentifier.dietaryPantothenicAcid,
        HKQuantityTypeIdentifier.dietaryPhosphorus,
        HKQuantityTypeIdentifier.dietaryIodine,
        HKQuantityTypeIdentifier.dietaryMagnesium,
        HKQuantityTypeIdentifier.dietaryZinc,
        HKQuantityTypeIdentifier.dietarySelenium,
        HKQuantityTypeIdentifier.dietaryCopper,
        HKQuantityTypeIdentifier.dietaryManganese,
        HKQuantityTypeIdentifier.dietaryChromium,
        HKQuantityTypeIdentifier.dietaryMolybdenum,
        HKQuantityTypeIdentifier.dietaryChloride,
        HKQuantityTypeIdentifier.dietaryPotassium,
        HKQuantityTypeIdentifier.dietaryCaffeine,
        HKQuantityTypeIdentifier.dietaryWater,
        
        // UV Exposure
        HKQuantityTypeIdentifier.uvExposure,
        
        // Hearing
        HKQuantityTypeIdentifier.environmentalAudioExposure,
        HKQuantityTypeIdentifier.headphoneAudioExposure,
        
        // Mobility
        HKQuantityTypeIdentifier.walkingSpeed,
        HKQuantityTypeIdentifier.walkingStepLength,
        HKQuantityTypeIdentifier.walkingAsymmetryPercentage,
        HKQuantityTypeIdentifier.walkingDoubleSupportPercentage,
        HKQuantityTypeIdentifier.sixMinuteWalkTestDistance,
        HKQuantityTypeIdentifier.stairAscentSpeed,
        HKQuantityTypeIdentifier.stairDescentSpeed,
        
        // Respiratory
        HKQuantityTypeIdentifier.forcedVitalCapacity,
        HKQuantityTypeIdentifier.forcedExpiratoryVolume1,
        HKQuantityTypeIdentifier.peakExpiratoryFlowRate,
        HKQuantityTypeIdentifier.numberOfTimesFallen,
        HKQuantityTypeIdentifier.inhalerUsage,
        
        // Reproductive Health
        HKQuantityTypeIdentifier.numberOfAlcoholicBeverages,
        
        // Sleep & Categories
        HKCategoryTypeIdentifier.sleepAnalysis,
        HKCategoryTypeIdentifier.appleStandHour,
        HKCategoryTypeIdentifier.cervicalMucusQuality,
        HKCategoryTypeIdentifier.ovulationTestResult,
        HKCategoryTypeIdentifier.menstrualFlow,
        HKCategoryTypeIdentifier.intermenstrualBleeding,
        HKCategoryTypeIdentifier.sexualActivity,
        HKCategoryTypeIdentifier.mindfulSession,
        HKCategoryTypeIdentifier.highHeartRateEvent,
        HKCategoryTypeIdentifier.lowHeartRateEvent,
        HKCategoryTypeIdentifier.irregularHeartRhythmEvent,
        HKCategoryTypeIdentifier.audioExposureEvent,
        HKCategoryTypeIdentifier.toothbrushingEvent,
        HKCategoryTypeIdentifier.lowCardioFitnessEvent,
        HKCategoryTypeIdentifier.contraceptive,
        HKCategoryTypeIdentifier.lactation,
        HKCategoryTypeIdentifier.pregnancy,
        HKCategoryTypeIdentifier.pregnancyTestResult,
        HKCategoryTypeIdentifier.progesteroneTestResult,
        HKCategoryTypeIdentifier.environmentalAudioExposureEvent,
        HKCategoryTypeIdentifier.headphoneAudioExposureEvent,
        HKCategoryTypeIdentifier.handwashingEvent,
        HKCategoryTypeIdentifier.appleWalkingSteadinessEvent,
        
        // Characteristics
        HKCharacteristicTypeIdentifier.biologicalSex,
        HKCharacteristicTypeIdentifier.dateOfBirth,
        HKCharacteristicTypeIdentifier.bloodType,
        HKCharacteristicTypeIdentifier.fitzpatrickSkinType,
        HKCharacteristicTypeIdentifier.wheelchairUse,
        HKCharacteristicTypeIdentifier.activityMoveMode,
      ];

      // Define write permissions (empty for now, we're only reading)
      const writePermissions = [];

      // Request authorization (toShare, toRead)
      const granted = await requestAuthorization(writePermissions, readPermissions);

      if (granted) {
        this.isInitialized = true;
        
        if (DEBUG_HEALTHKIT) {
          console.log('[HealthKit] Permissions granted successfully');
        }
        
        return true;
      } else {
        throw new Error('HealthKit permissions were denied');
      }
    } catch (error) {
      console.error('[HealthKit] Failed to request permissions:', error);
      throw error;
    }
  }

  // Check if HealthKit is available on the device
  async isAvailable() {
    try {
      const available = isHealthDataAvailable();
      if (DEBUG_HEALTHKIT) {
        console.log('[HealthKit] isAvailable:', available);
      }
      return available;
    } catch (error) {
      console.error('[HealthKit] Error checking availability:', error);
      return false;
    }
  }

  // Get steps data
  async getSteps(startDate, endDate) {
    try {
      const result = await queryQuantitySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: startDate,
          to: endDate,
        }
      );
      return result;
    } catch (error) {
      console.error('[HealthKit] Error fetching steps:', error);
      throw error;
    }
  }

  // Get heart rate data
  async getHeartRate(startDate, endDate) {
    try {
      const result = await queryQuantitySamples(
        HKQuantityTypeIdentifier.heartRate,
        {
          from: startDate,
          to: endDate,
        }
      );
      return result;
    } catch (error) {
      console.error('[HealthKit] Error fetching heart rate:', error);
      throw error;
    }
  }

  // Get sleep data
  async getSleepData(startDate, endDate) {
    try {
      const result = await queryCategorySamples(
        HKCategoryTypeIdentifier.sleepAnalysis,
        {
          from: startDate,
          to: endDate,
        }
      );
      return result;
    } catch (error) {
      console.error('[HealthKit] Error fetching sleep data:', error);
      throw error;
    }
  }

  // Get weight data
  async getWeight(startDate, endDate) {
    try {
      const result = await queryQuantitySamples(
        HKQuantityTypeIdentifier.bodyMass,
        {
          from: startDate,
          to: endDate,
        }
      );
      return result;
    } catch (error) {
      console.error('[HealthKit] Error fetching weight:', error);
      throw error;
    }
  }

  // Helper method to fetch quantity data with error handling
  async fetchQuantityData(identifier, label, startDate, endDate) {
    try {
      const result = await queryQuantitySamples(identifier, {
        from: startDate,
        to: endDate,
      });
      console.log(`[HealthKit] ${label}: ${result?.length || 0} samples`);
      return { label, data: result, count: result?.length || 0 };
    } catch (error) {
      console.log(`[HealthKit] Error fetching ${label}:`, error.message);
      return { label, data: [], count: 0, error: error.message };
    }
  }

  // Helper method to fetch category data with error handling
  async fetchCategoryData(identifier, label, startDate, endDate) {
    try {
      const result = await queryCategorySamples(identifier, {
        from: startDate,
        to: endDate,
      });
      console.log(`[HealthKit] ${label}: ${result?.length || 0} samples`);
      return { label, data: result, count: result?.length || 0 };
    } catch (error) {
      console.log(`[HealthKit] Error fetching ${label}:`, error.message);
      return { label, data: [], count: 0, error: error.message };
    }
  }

  // Get comprehensive health data for display
  async getHealthData() {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (DEBUG_HEALTHKIT) {
      console.log('[HealthKit] Fetching comprehensive health data...');
    }

    try {
      // Fetch all quantity types in parallel
      const quantityPromises = [
        // Activity & Fitness
        this.fetchQuantityData(HKQuantityTypeIdentifier.stepCount, 'Steps', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.distanceWalkingRunning, 'Distance Walking/Running', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.distanceCycling, 'Distance Cycling', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.distanceSwimming, 'Distance Swimming', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.flightsClimbed, 'Flights Climbed', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.activeEnergyBurned, 'Active Energy', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.basalEnergyBurned, 'Resting Energy', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.appleExerciseTime, 'Exercise Time', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.appleStandTime, 'Stand Time', oneWeekAgo, now),
        
        // Heart
        this.fetchQuantityData(HKQuantityTypeIdentifier.heartRate, 'Heart Rate', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.restingHeartRate, 'Resting Heart Rate', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.walkingHeartRateAverage, 'Walking Heart Rate', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.heartRateVariabilitySDNN, 'Heart Rate Variability', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.vo2Max, 'VO2 Max', oneWeekAgo, now),
        
        // Body Measurements
        this.fetchQuantityData(HKQuantityTypeIdentifier.height, 'Height', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bodyMass, 'Weight', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bodyMassIndex, 'BMI', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bodyFatPercentage, 'Body Fat %', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.leanBodyMass, 'Lean Body Mass', oneWeekAgo, now),
        
        // Vitals
        this.fetchQuantityData(HKQuantityTypeIdentifier.bloodPressureSystolic, 'Blood Pressure (Systolic)', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bloodPressureDiastolic, 'Blood Pressure (Diastolic)', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bloodGlucose, 'Blood Glucose', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.oxygenSaturation, 'Oxygen Saturation', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.respiratoryRate, 'Respiratory Rate', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bodyTemperature, 'Body Temperature', oneWeekAgo, now),
        
        // Nutrition (key metrics)
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryEnergyConsumed, 'Calories Consumed', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryProtein, 'Protein', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryCarbohydrates, 'Carbohydrates', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryFatTotal, 'Total Fat', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryWater, 'Water', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.dietaryCaffeine, 'Caffeine', oneWeekAgo, now),
        
        // Mobility
        this.fetchQuantityData(HKQuantityTypeIdentifier.walkingSpeed, 'Walking Speed', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.walkingStepLength, 'Step Length', oneWeekAgo, now),
        
        // Hearing
        this.fetchQuantityData(HKQuantityTypeIdentifier.environmentalAudioExposure, 'Environmental Audio Exposure', oneWeekAgo, now),
        this.fetchQuantityData(HKQuantityTypeIdentifier.headphoneAudioExposure, 'Headphone Audio Exposure', oneWeekAgo, now),
      ];

      // Fetch all category types in parallel
      const categoryPromises = [
        this.fetchCategoryData(HKCategoryTypeIdentifier.sleepAnalysis, 'Sleep', oneWeekAgo, now),
        this.fetchCategoryData(HKCategoryTypeIdentifier.mindfulSession, 'Mindful Minutes', oneWeekAgo, now),
        this.fetchCategoryData(HKCategoryTypeIdentifier.appleStandHour, 'Stand Hours', oneWeekAgo, now),
      ];

      // Wait for all data to be fetched
      const [quantityResults, categoryResults] = await Promise.all([
        Promise.allSettled(quantityPromises),
        Promise.allSettled(categoryPromises),
      ]);

      // Process results and organize by category
      const processResults = (results) => {
        return results
          .map(result => result.status === 'fulfilled' ? result.value : null)
          .filter(item => item && item.count > 0); // Only include items with data
      };

      const quantityData = processResults(quantityResults);
      const categoryData = processResults(categoryResults);

      // Organize data by category
      const organizedData = {
        activity: quantityData.filter(item => 
          ['Steps', 'Distance Walking/Running', 'Distance Cycling', 'Distance Swimming', 
           'Flights Climbed', 'Active Energy', 'Resting Energy', 'Exercise Time', 'Stand Time'].includes(item.label)
        ),
        heart: quantityData.filter(item => 
          ['Heart Rate', 'Resting Heart Rate', 'Walking Heart Rate', 'Heart Rate Variability', 'VO2 Max'].includes(item.label)
        ),
        body: quantityData.filter(item => 
          ['Height', 'Weight', 'BMI', 'Body Fat %', 'Lean Body Mass'].includes(item.label)
        ),
        vitals: quantityData.filter(item => 
          ['Blood Pressure (Systolic)', 'Blood Pressure (Diastolic)', 'Blood Glucose', 
           'Oxygen Saturation', 'Respiratory Rate', 'Body Temperature'].includes(item.label)
        ),
        nutrition: quantityData.filter(item => 
          ['Calories Consumed', 'Protein', 'Carbohydrates', 'Total Fat', 'Water', 'Caffeine'].includes(item.label)
        ),
        mobility: quantityData.filter(item => 
          ['Walking Speed', 'Step Length'].includes(item.label)
        ),
        hearing: quantityData.filter(item => 
          ['Environmental Audio Exposure', 'Headphone Audio Exposure'].includes(item.label)
        ),
        sleep: categoryData.filter(item => 
          ['Sleep', 'Mindful Minutes', 'Stand Hours'].includes(item.label)
        ),
      };

      // Create summary
      const summary = {
        totalMetrics: quantityData.length + categoryData.length,
        totalDataPoints: [...quantityData, ...categoryData].reduce((sum, item) => sum + item.count, 0),
        categories: Object.keys(organizedData).filter(key => organizedData[key].length > 0),
      };

      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Fetched ${summary.totalMetrics} metrics with ${summary.totalDataPoints} data points`);
      }

      return {
        ...organizedData,
        summary,
        lastUpdated: now.toISOString(),
      };
    } catch (error) {
      console.error('[HealthKit] Error fetching health data:', error);
      throw error;
    }
  }

  // Disconnect/revoke access (not directly possible with HealthKit, but we can clear our local state)
  // Note: This only resets in-memory state. User's connection state persists in AsyncStorage
  // for when they log back in. Use clearUserData() to explicitly delete a user's data.
  async disconnect() {
    this.isInitialized = false;
    // Don't clear stored data - just reset in-memory state
    // User's connection state persists in AsyncStorage for when they log back in
    return true;
  }

  // Explicitly clear a user's health data from AsyncStorage
  // This is separate from disconnect() and should be used for "Delete Account" or similar features
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

  // ===== NEW METHODS FOR PERSISTENT CONNECTION =====

  // Check if user has already authorized HealthKit access
  async getAuthorizationStatus() {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      // Check a few key permissions to determine if user has granted access
      const keyPermissions = [
        HKQuantityTypeIdentifier.stepCount,
        HKQuantityTypeIdentifier.heartRate,
        HKQuantityTypeIdentifier.activeEnergyBurned,
      ];

      // Note: HealthKit doesn't provide a direct way to check authorization status
      // We'll try to query a small amount of data and see if it succeeds
      try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Try to query steps - if this succeeds, we have authorization
        await queryQuantitySamples(HKQuantityTypeIdentifier.stepCount, {
          from: oneDayAgo,
          to: now,
          limit: 1,
        });
        
        if (DEBUG_HEALTHKIT) {
          console.log('[HealthKit] Authorization status: authorized');
        }
        
        return true;
      } catch (error) {
        if (DEBUG_HEALTHKIT) {
          console.log('[HealthKit] Authorization status: not authorized or error:', error.message);
        }
        return false;
      }
    } catch (error) {
      console.error('[HealthKit] Error checking authorization status:', error);
      return false;
    }
  }

  // Save connection state to AsyncStorage
  async saveConnectionState(isConnected) {
    try {
      const key = this.getUserScopedKey(STORAGE_KEYS.CONNECTION_STATE);
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          connected: isConnected,
          timestamp: new Date().toISOString(),
        })
      );
      
      if (DEBUG_HEALTHKIT) {
        console.log('[HealthKit] Connection state saved:', isConnected);
      }
    } catch (error) {
      console.error('[HealthKit] Error saving connection state:', error);
    }
  }

  // Load connection state from AsyncStorage
  async loadConnectionState() {
    try {
      const key = this.getUserScopedKey(STORAGE_KEYS.CONNECTION_STATE);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (DEBUG_HEALTHKIT) {
          console.log('[HealthKit] Connection state loaded:', parsed);
        }
        return parsed.connected;
      }
      return false;
    } catch (error) {
      console.error('[HealthKit] Error loading connection state:', error);
      return false;
    }
  }

  // Save last sync timestamp
  async saveLastSyncTime() {
    try {
      const key = this.getUserScopedKey(STORAGE_KEYS.LAST_SYNC);
      await AsyncStorage.setItem(
        key,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[HealthKit] Error saving last sync time:', error);
    }
  }

  // Get last sync timestamp
  async getLastSyncTime() {
    try {
      const key = this.getUserScopedKey(STORAGE_KEYS.LAST_SYNC);
      const timestamp = await AsyncStorage.getItem(key);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('[HealthKit] Error getting last sync time:', error);
      return null;
    }
  }

  // Save raw health data to AsyncStorage
  async saveRawHealthData(dataType, data) {
    try {
      const key = this.getRawDataKey(dataType);
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      
      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Saved ${data.length} samples for ${dataType}`);
      }
    } catch (error) {
      console.error(`[HealthKit] Error saving raw data for ${dataType}:`, error);
    }
  }

  // Load raw health data from AsyncStorage
  async loadRawHealthData(dataType) {
    try {
      const key = this.getRawDataKey(dataType);
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (DEBUG_HEALTHKIT) {
          console.log(`[HealthKit] Loaded ${parsed.data?.length || 0} samples for ${dataType}`);
        }
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error(`[HealthKit] Error loading raw data for ${dataType}:`, error);
      return null;
    }
  }

  // Clear old local data (older than specified days)
  async clearOldLocalData(daysToKeep = 30) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const scopedPrefix = this.getUserScopedKey(STORAGE_KEYS.RAW_DATA_PREFIX);
      const prefixes = new Set([scopedPrefix]);
      prefixes.add(STORAGE_KEYS.RAW_DATA_PREFIX);

      const healthDataKeys = keys.filter((key) => {
        for (const prefix of prefixes) {
          if (key.startsWith(prefix)) {
            return true;
          }
        }
        return false;
      });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const key of healthDataKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const dataDate = new Date(parsed.timestamp);
          
          if (dataDate < cutoffDate) {
            await AsyncStorage.removeItem(key);
            if (DEBUG_HEALTHKIT) {
              console.log(`[HealthKit] Removed old data: ${key}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[HealthKit] Error clearing old local data:', error);
    }
  }

  // Aggregate daily metrics from raw HealthKit data
  async aggregateDailyMetrics(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Aggregating metrics for ${date.toDateString()}`);
      }

      // Fetch all metrics for the day
      const [
        steps,
        distance,
        activeCalories,
        restingCalories,
        exerciseTime,
        flightsClimbed,
        heartRate,
        restingHeartRate,
        hrv,
        sleep,
        weight,
      ] = await Promise.allSettled([
        this.fetchQuantityData(HKQuantityTypeIdentifier.stepCount, 'Steps', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.distanceWalkingRunning, 'Distance', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.activeEnergyBurned, 'Active Calories', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.basalEnergyBurned, 'Resting Calories', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.appleExerciseTime, 'Exercise Time', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.flightsClimbed, 'Flights Climbed', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.heartRate, 'Heart Rate', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.restingHeartRate, 'Resting Heart Rate', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.heartRateVariabilitySDNN, 'HRV', startOfDay, endOfDay),
        this.fetchCategoryData(HKCategoryTypeIdentifier.sleepAnalysis, 'Sleep', startOfDay, endOfDay),
        this.fetchQuantityData(HKQuantityTypeIdentifier.bodyMass, 'Weight', startOfDay, endOfDay),
      ]);

      // Helper to sum quantities
      const sumQuantities = (result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          return result.value.data.reduce((sum, sample) => sum + (sample.quantity || 0), 0);
        }
        return null;
      };

      // Helper to average quantities
      const avgQuantities = (result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          const sum = result.value.data.reduce((sum, sample) => sum + (sample.quantity || 0), 0);
          return Math.round(sum / result.value.data.length);
        }
        return null;
      };

      // Helper to get latest value
      const getLatest = (result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          return result.value.data[0].quantity;
        }
        return null;
      };

      // Calculate sleep hours from sleep analysis
      const calculateSleepHours = (result) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.length > 0) {
          // Sleep samples have startDate and endDate
          const totalSeconds = result.value.data.reduce((sum, sample) => {
            const start = new Date(sample.startDate);
            const end = new Date(sample.endDate);
            return sum + ((end - start) / 1000);
          }, 0);
          return totalSeconds / 3600; // Convert to hours
        }
        return null;
      };

      const metrics = {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        steps: Math.round(sumQuantities(steps) || 0),
        distance_km: (sumQuantities(distance) / 1000) || null, // Convert meters to km
        active_calories: Math.round(sumQuantities(activeCalories) || 0),
        resting_calories: Math.round(sumQuantities(restingCalories) || 0),
        exercise_minutes: Math.round((sumQuantities(exerciseTime) || 0) / 60), // Convert seconds to minutes
        flights_climbed: Math.round(sumQuantities(flightsClimbed) || 0),
        avg_heart_rate: avgQuantities(heartRate),
        resting_heart_rate: getLatest(restingHeartRate),
        heart_rate_variability: getLatest(hrv),
        sleep_hours: calculateSleepHours(sleep),
        weight_kg: getLatest(weight),
      };

      if (DEBUG_HEALTHKIT) {
        console.log('[HealthKit] Aggregated metrics:', metrics);
      }

      return metrics;
    } catch (error) {
      console.error('[HealthKit] Error aggregating daily metrics:', error);
      throw error;
    }
  }

  // Sync daily metrics to Supabase
  async syncDailyMetricsToCloud(dailyMetrics) {
    try {
      if (!dailyMetrics || !dailyMetrics.date) {
        throw new Error('Invalid daily metrics data');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Upsert the daily metrics (insert or update if exists)
      const { data, error } = await supabase
        .from('health_metrics_daily')
        .upsert({
          user_id: user.id,
          ...dailyMetrics,
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (DEBUG_HEALTHKIT) {
        console.log('[HealthKit] Synced metrics to cloud:', data);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[HealthKit] Error syncing metrics to cloud:', error);
      return { success: false, error: error.message };
    }
  }

  // Fetch cloud metrics from Supabase
  async fetchCloudMetrics(startDate, endDate) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('health_metrics_daily')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Fetched ${data?.length || 0} days of cloud metrics`);
      }

      return data || [];
    } catch (error) {
      console.error('[HealthKit] Error fetching cloud metrics:', error);
      return [];
    }
  }

  // Sync last N days of health data
  async syncHealthData(days = 7) {
    try {
      if (!this.isInitialized) {
        // Try to initialize if we have cached connection
        const isConnected = await this.loadConnectionState();
        const isAuthorized = await this.getAuthorizationStatus();
        
        if (!isConnected || !isAuthorized) {
          throw new Error('HealthKit not connected or authorized');
        }
        
        this.isInitialized = true;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Syncing ${days} days of health data...`);
      }

      // Aggregate and sync each day
      const syncPromises = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        
        syncPromises.push(
          this.aggregateDailyMetrics(date)
            .then(metrics => this.syncDailyMetricsToCloud(metrics))
        );
      }

      const results = await Promise.allSettled(syncPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      if (DEBUG_HEALTHKIT) {
        console.log(`[HealthKit] Sync complete: ${successful} successful, ${failed} failed`);
      }

      // Save last sync time
      await this.saveLastSyncTime();

      // Clean up old local data
      await this.clearOldLocalData(30);

      return {
        success: true,
        synced: successful,
        failed: failed,
      };
    } catch (error) {
      console.error('[HealthKit] Error syncing health data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new HealthKitService();
