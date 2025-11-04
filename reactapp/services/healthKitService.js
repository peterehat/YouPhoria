import { Platform } from 'react-native';
import {
  requestAuthorization,
  isHealthDataAvailable,
  queryQuantitySamples,
  queryCategorySamples,
} from '@kingstinct/react-native-healthkit';

// Toggle verbose HealthKit logging here
const DEBUG_HEALTHKIT = __DEV__ && false;

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
  disconnect() {
    this.isInitialized = false;
    return true;
  }
}

export default new HealthKitService();
