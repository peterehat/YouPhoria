/**
 * Metric Type Registry
 * 
 * Provides standardized metric types, unit conversions, and app-specific mappings
 * for universal health data storage across multiple sources.
 * 
 * This service ensures data consistency and enables cross-app data analysis.
 */

// Standard metric types with their canonical units
export const METRIC_TYPES = {
  // Activity & Fitness
  STEPS: 'steps',
  DISTANCE: 'distance_mi',
  DISTANCE_WALKING: 'distance_walking_mi',
  DISTANCE_RUNNING: 'distance_running_mi',
  DISTANCE_CYCLING: 'distance_cycling_mi',
  DISTANCE_SWIMMING: 'distance_swimming_mi',
  ACTIVE_CALORIES: 'active_calories_kcal',
  RESTING_CALORIES: 'resting_calories_kcal',
  TOTAL_CALORIES_BURNED: 'total_calories_burned_kcal',
  EXERCISE_MINUTES: 'exercise_minutes',
  ACTIVE_MINUTES: 'active_minutes',
  FLIGHTS_CLIMBED: 'flights_climbed',
  ELEVATION_GAIN: 'elevation_gain_ft',
  
  // Heart & Cardiovascular
  HEART_RATE: 'heart_rate_bpm',
  RESTING_HEART_RATE: 'resting_heart_rate_bpm',
  WALKING_HEART_RATE: 'walking_heart_rate_bpm',
  HEART_RATE_VARIABILITY: 'heart_rate_variability_ms',
  VO2_MAX: 'vo2_max_ml_kg_min',
  BLOOD_PRESSURE_SYSTOLIC: 'blood_pressure_systolic_mmhg',
  BLOOD_PRESSURE_DIASTOLIC: 'blood_pressure_diastolic_mmhg',
  
  // Body Measurements
  WEIGHT: 'weight_lbs',
  HEIGHT: 'height_in',
  BMI: 'bmi',
  BODY_FAT_PERCENTAGE: 'body_fat_percentage',
  LEAN_BODY_MASS: 'lean_body_mass_lbs',
  WAIST_CIRCUMFERENCE: 'waist_circumference_in',
  
  // Sleep
  SLEEP_DURATION: 'sleep_duration_hours',
  SLEEP_DEEP: 'sleep_deep_hours',
  SLEEP_REM: 'sleep_rem_hours',
  SLEEP_LIGHT: 'sleep_light_hours',
  SLEEP_AWAKE: 'sleep_awake_hours',
  
  // Vitals
  BLOOD_GLUCOSE: 'blood_glucose_mg_dl',
  OXYGEN_SATURATION: 'oxygen_saturation_percentage',
  RESPIRATORY_RATE: 'respiratory_rate_bpm',
  BODY_TEMPERATURE: 'body_temperature_fahrenheit',
  
  // Nutrition
  CALORIES_CONSUMED: 'calories_consumed_kcal',
  PROTEIN: 'protein_g',
  CARBOHYDRATES: 'carbohydrates_g',
  FAT: 'fat_g',
  FIBER: 'fiber_g',
  SUGAR: 'sugar_g',
  SODIUM: 'sodium_mg',
  WATER: 'water_oz',
  CAFFEINE: 'caffeine_mg',
  
  // Strength Training
  WEIGHT_LIFTED: 'weight_lifted_lbs',
  REPS: 'reps',
  SETS: 'sets',
  TRAINING_VOLUME: 'training_volume_lbs', // sets × reps × weight
  ONE_REP_MAX: 'one_rep_max_lbs',
  
  // Other
  MINDFUL_MINUTES: 'mindful_minutes',
  STRESS_LEVEL: 'stress_level_0_10',
};

// Data categories for grouping metrics
export const DATA_CATEGORIES = {
  ACTIVITY: 'activity',
  VITALS: 'vitals',
  BODY_MEASUREMENT: 'body_measurement',
  SLEEP: 'sleep',
  NUTRITION: 'nutrition',
  WORKOUT: 'workout',
  MENTAL_HEALTH: 'mental_health',
};

// Metric metadata including category and default quality score
export const METRIC_METADATA = {
  [METRIC_TYPES.STEPS]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'steps', displayName: 'Steps' },
  [METRIC_TYPES.DISTANCE]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'mi', displayName: 'Distance' },
  [METRIC_TYPES.DISTANCE_WALKING]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'mi', displayName: 'Walking Distance' },
  [METRIC_TYPES.DISTANCE_RUNNING]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'mi', displayName: 'Running Distance' },
  [METRIC_TYPES.DISTANCE_CYCLING]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'mi', displayName: 'Cycling Distance' },
  [METRIC_TYPES.DISTANCE_SWIMMING]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'mi', displayName: 'Swimming Distance' },
  [METRIC_TYPES.ACTIVE_CALORIES]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'kcal', displayName: 'Active Calories' },
  [METRIC_TYPES.RESTING_CALORIES]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'kcal', displayName: 'Resting Calories' },
  [METRIC_TYPES.TOTAL_CALORIES_BURNED]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'kcal', displayName: 'Total Calories Burned' },
  [METRIC_TYPES.EXERCISE_MINUTES]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'min', displayName: 'Exercise Minutes' },
  [METRIC_TYPES.ACTIVE_MINUTES]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'min', displayName: 'Active Minutes' },
  [METRIC_TYPES.FLIGHTS_CLIMBED]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'flights', displayName: 'Flights Climbed' },
  [METRIC_TYPES.ELEVATION_GAIN]: { category: DATA_CATEGORIES.ACTIVITY, unit: 'ft', displayName: 'Elevation Gain' },
  
  [METRIC_TYPES.HEART_RATE]: { category: DATA_CATEGORIES.VITALS, unit: 'bpm', displayName: 'Heart Rate' },
  [METRIC_TYPES.RESTING_HEART_RATE]: { category: DATA_CATEGORIES.VITALS, unit: 'bpm', displayName: 'Resting Heart Rate' },
  [METRIC_TYPES.WALKING_HEART_RATE]: { category: DATA_CATEGORIES.VITALS, unit: 'bpm', displayName: 'Walking Heart Rate' },
  [METRIC_TYPES.HEART_RATE_VARIABILITY]: { category: DATA_CATEGORIES.VITALS, unit: 'ms', displayName: 'HRV' },
  [METRIC_TYPES.VO2_MAX]: { category: DATA_CATEGORIES.VITALS, unit: 'ml/kg/min', displayName: 'VO2 Max' },
  [METRIC_TYPES.BLOOD_PRESSURE_SYSTOLIC]: { category: DATA_CATEGORIES.VITALS, unit: 'mmHg', displayName: 'Blood Pressure (Systolic)' },
  [METRIC_TYPES.BLOOD_PRESSURE_DIASTOLIC]: { category: DATA_CATEGORIES.VITALS, unit: 'mmHg', displayName: 'Blood Pressure (Diastolic)' },
  
  [METRIC_TYPES.WEIGHT]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: 'lbs', displayName: 'Weight' },
  [METRIC_TYPES.HEIGHT]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: 'in', displayName: 'Height' },
  [METRIC_TYPES.BMI]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: 'lbs/in²', displayName: 'BMI' },
  [METRIC_TYPES.BODY_FAT_PERCENTAGE]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: '%', displayName: 'Body Fat %' },
  [METRIC_TYPES.LEAN_BODY_MASS]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: 'lbs', displayName: 'Lean Body Mass' },
  [METRIC_TYPES.WAIST_CIRCUMFERENCE]: { category: DATA_CATEGORIES.BODY_MEASUREMENT, unit: 'in', displayName: 'Waist Circumference' },
  
  [METRIC_TYPES.SLEEP_DURATION]: { category: DATA_CATEGORIES.SLEEP, unit: 'hours', displayName: 'Sleep Duration' },
  [METRIC_TYPES.SLEEP_DEEP]: { category: DATA_CATEGORIES.SLEEP, unit: 'hours', displayName: 'Deep Sleep' },
  [METRIC_TYPES.SLEEP_REM]: { category: DATA_CATEGORIES.SLEEP, unit: 'hours', displayName: 'REM Sleep' },
  [METRIC_TYPES.SLEEP_LIGHT]: { category: DATA_CATEGORIES.SLEEP, unit: 'hours', displayName: 'Light Sleep' },
  [METRIC_TYPES.SLEEP_AWAKE]: { category: DATA_CATEGORIES.SLEEP, unit: 'hours', displayName: 'Time Awake' },
  
  [METRIC_TYPES.BLOOD_GLUCOSE]: { category: DATA_CATEGORIES.VITALS, unit: 'mg/dL', displayName: 'Blood Glucose' },
  [METRIC_TYPES.OXYGEN_SATURATION]: { category: DATA_CATEGORIES.VITALS, unit: '%', displayName: 'Oxygen Saturation' },
  [METRIC_TYPES.RESPIRATORY_RATE]: { category: DATA_CATEGORIES.VITALS, unit: 'bpm', displayName: 'Respiratory Rate' },
  [METRIC_TYPES.BODY_TEMPERATURE]: { category: DATA_CATEGORIES.VITALS, unit: '°F', displayName: 'Body Temperature' },
  
  [METRIC_TYPES.CALORIES_CONSUMED]: { category: DATA_CATEGORIES.NUTRITION, unit: 'kcal', displayName: 'Calories' },
  [METRIC_TYPES.PROTEIN]: { category: DATA_CATEGORIES.NUTRITION, unit: 'g', displayName: 'Protein' },
  [METRIC_TYPES.CARBOHYDRATES]: { category: DATA_CATEGORIES.NUTRITION, unit: 'g', displayName: 'Carbs' },
  [METRIC_TYPES.FAT]: { category: DATA_CATEGORIES.NUTRITION, unit: 'g', displayName: 'Fat' },
  [METRIC_TYPES.FIBER]: { category: DATA_CATEGORIES.NUTRITION, unit: 'g', displayName: 'Fiber' },
  [METRIC_TYPES.SUGAR]: { category: DATA_CATEGORIES.NUTRITION, unit: 'g', displayName: 'Sugar' },
  [METRIC_TYPES.SODIUM]: { category: DATA_CATEGORIES.NUTRITION, unit: 'mg', displayName: 'Sodium' },
  [METRIC_TYPES.WATER]: { category: DATA_CATEGORIES.NUTRITION, unit: 'oz', displayName: 'Water' },
  [METRIC_TYPES.CAFFEINE]: { category: DATA_CATEGORIES.NUTRITION, unit: 'mg', displayName: 'Caffeine' },
  
  [METRIC_TYPES.WEIGHT_LIFTED]: { category: DATA_CATEGORIES.WORKOUT, unit: 'lbs', displayName: 'Weight Lifted' },
  [METRIC_TYPES.REPS]: { category: DATA_CATEGORIES.WORKOUT, unit: 'reps', displayName: 'Reps' },
  [METRIC_TYPES.SETS]: { category: DATA_CATEGORIES.WORKOUT, unit: 'sets', displayName: 'Sets' },
  [METRIC_TYPES.TRAINING_VOLUME]: { category: DATA_CATEGORIES.WORKOUT, unit: 'lbs', displayName: 'Training Volume' },
  [METRIC_TYPES.ONE_REP_MAX]: { category: DATA_CATEGORIES.WORKOUT, unit: 'lbs', displayName: '1RM' },
  
  [METRIC_TYPES.MINDFUL_MINUTES]: { category: DATA_CATEGORIES.MENTAL_HEALTH, unit: 'min', displayName: 'Mindful Minutes' },
  [METRIC_TYPES.STRESS_LEVEL]: { category: DATA_CATEGORIES.MENTAL_HEALTH, unit: 'level', displayName: 'Stress Level' },
};

// Unit conversion functions
export const UNIT_CONVERSIONS = {
  // Distance
  km_to_miles: (km) => km * 0.621371,
  miles_to_km: (miles) => miles / 0.621371,
  meters_to_miles: (meters) => meters * 0.000621371,
  miles_to_meters: (miles) => miles / 0.000621371,
  meters_to_feet: (meters) => meters * 3.28084,
  feet_to_meters: (feet) => feet / 3.28084,
  
  // Weight
  kg_to_lbs: (kg) => kg * 2.20462,
  lbs_to_kg: (lbs) => lbs / 2.20462,
  g_to_oz: (g) => g * 0.035274,
  oz_to_g: (oz) => oz / 0.035274,
  
  // Height
  cm_to_inches: (cm) => cm * 0.393701,
  inches_to_cm: (inches) => inches / 0.393701,
  cm_to_feet: (cm) => cm * 0.0328084,
  feet_to_cm: (feet) => feet / 0.0328084,
  
  // Temperature
  celsius_to_fahrenheit: (c) => (c * 9/5) + 32,
  fahrenheit_to_celsius: (f) => (f - 32) * 5/9,
  
  // Volume
  ml_to_fl_oz: (ml) => ml * 0.033814,
  fl_oz_to_ml: (oz) => oz / 0.033814,
  ml_to_cups: (ml) => ml * 0.00422675,
  cups_to_ml: (cups) => cups / 0.00422675,
  ml_to_liters: (ml) => ml / 1000,
  liters_to_ml: (liters) => liters * 1000,
  
  // Time
  seconds_to_minutes: (seconds) => seconds / 60,
  minutes_to_seconds: (minutes) => minutes * 60,
  hours_to_minutes: (hours) => hours * 60,
  minutes_to_hours: (minutes) => minutes / 60,
  seconds_to_hours: (seconds) => seconds / 3600,
  hours_to_seconds: (hours) => hours * 3600,
};

// App-specific source identifiers
export const DATA_SOURCES = {
  APPLE_HEALTH: 'Apple Health',
  GOOGLE_FIT: 'Google Fit',
  HEALTH_CONNECT: 'Health Connect',
  MYFITNESSPAL: 'MyFitnessPal',
  STRAVA: 'Strava',
  STRONG: 'Strong',
  FITBIT: 'Fitbit',
  GARMIN: 'Garmin',
  WHOOP: 'Whoop',
  OURA: 'Oura',
};

// Quality scores by source type
export const QUALITY_SCORES = {
  [DATA_SOURCES.APPLE_HEALTH]: 1.0,
  [DATA_SOURCES.GOOGLE_FIT]: 1.0,
  [DATA_SOURCES.HEALTH_CONNECT]: 1.0,
  [DATA_SOURCES.STRAVA]: 0.95,
  [DATA_SOURCES.STRONG]: 0.95,
  [DATA_SOURCES.FITBIT]: 0.95,
  [DATA_SOURCES.GARMIN]: 0.95,
  [DATA_SOURCES.WHOOP]: 0.95,
  [DATA_SOURCES.OURA]: 0.95,
  [DATA_SOURCES.MYFITNESSPAL]: 0.7,
  MANUAL_ENTRY: 0.7,
  ESTIMATED: 0.5,
};

// App-specific metric mappings
// Maps app-specific field names to our standard metric types
export const APP_METRIC_MAPPINGS = {
  [DATA_SOURCES.APPLE_HEALTH]: {
    'HKQuantityTypeIdentifierStepCount': METRIC_TYPES.STEPS,
    'HKQuantityTypeIdentifierDistanceWalkingRunning': METRIC_TYPES.DISTANCE_WALKING,
    'HKQuantityTypeIdentifierDistanceCycling': METRIC_TYPES.DISTANCE_CYCLING,
    'HKQuantityTypeIdentifierDistanceSwimming': METRIC_TYPES.DISTANCE_SWIMMING,
    'HKQuantityTypeIdentifierActiveEnergyBurned': METRIC_TYPES.ACTIVE_CALORIES,
    'HKQuantityTypeIdentifierBasalEnergyBurned': METRIC_TYPES.RESTING_CALORIES,
    'HKQuantityTypeIdentifierAppleExerciseTime': METRIC_TYPES.EXERCISE_MINUTES,
    'HKQuantityTypeIdentifierFlightsClimbed': METRIC_TYPES.FLIGHTS_CLIMBED,
    'HKQuantityTypeIdentifierHeartRate': METRIC_TYPES.HEART_RATE,
    'HKQuantityTypeIdentifierRestingHeartRate': METRIC_TYPES.RESTING_HEART_RATE,
    'HKQuantityTypeIdentifierWalkingHeartRateAverage': METRIC_TYPES.WALKING_HEART_RATE,
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': METRIC_TYPES.HEART_RATE_VARIABILITY,
    'HKQuantityTypeIdentifierVO2Max': METRIC_TYPES.VO2_MAX,
    'HKQuantityTypeIdentifierBodyMass': METRIC_TYPES.WEIGHT,
    'HKQuantityTypeIdentifierHeight': METRIC_TYPES.HEIGHT,
    'HKQuantityTypeIdentifierBodyMassIndex': METRIC_TYPES.BMI,
    'HKQuantityTypeIdentifierBodyFatPercentage': METRIC_TYPES.BODY_FAT_PERCENTAGE,
    'HKQuantityTypeIdentifierLeanBodyMass': METRIC_TYPES.LEAN_BODY_MASS,
    'HKQuantityTypeIdentifierBloodPressureSystolic': METRIC_TYPES.BLOOD_PRESSURE_SYSTOLIC,
    'HKQuantityTypeIdentifierBloodPressureDiastolic': METRIC_TYPES.BLOOD_PRESSURE_DIASTOLIC,
    'HKQuantityTypeIdentifierBloodGlucose': METRIC_TYPES.BLOOD_GLUCOSE,
    'HKQuantityTypeIdentifierOxygenSaturation': METRIC_TYPES.OXYGEN_SATURATION,
    'HKQuantityTypeIdentifierRespiratoryRate': METRIC_TYPES.RESPIRATORY_RATE,
    'HKQuantityTypeIdentifierBodyTemperature': METRIC_TYPES.BODY_TEMPERATURE,
    'HKQuantityTypeIdentifierDietaryEnergyConsumed': METRIC_TYPES.CALORIES_CONSUMED,
    'HKQuantityTypeIdentifierDietaryProtein': METRIC_TYPES.PROTEIN,
    'HKQuantityTypeIdentifierDietaryCarbohydrates': METRIC_TYPES.CARBOHYDRATES,
    'HKQuantityTypeIdentifierDietaryFatTotal': METRIC_TYPES.FAT,
    'HKQuantityTypeIdentifierDietaryFiber': METRIC_TYPES.FIBER,
    'HKQuantityTypeIdentifierDietarySugar': METRIC_TYPES.SUGAR,
    'HKQuantityTypeIdentifierDietarySodium': METRIC_TYPES.SODIUM,
    'HKQuantityTypeIdentifierDietaryWater': METRIC_TYPES.WATER,
    'HKQuantityTypeIdentifierDietaryCaffeine': METRIC_TYPES.CAFFEINE,
  },
  
  [DATA_SOURCES.MYFITNESSPAL]: {
    'calories': METRIC_TYPES.CALORIES_CONSUMED,
    'protein': METRIC_TYPES.PROTEIN,
    'carbs': METRIC_TYPES.CARBOHYDRATES,
    'fat': METRIC_TYPES.FAT,
    'fiber': METRIC_TYPES.FIBER,
    'sugar': METRIC_TYPES.SUGAR,
    'sodium': METRIC_TYPES.SODIUM,
    'water': METRIC_TYPES.WATER,
  },
  
  [DATA_SOURCES.STRAVA]: {
    'distance': METRIC_TYPES.DISTANCE,
    'moving_time': METRIC_TYPES.ACTIVE_MINUTES,
    'elapsed_time': METRIC_TYPES.EXERCISE_MINUTES,
    'total_elevation_gain': METRIC_TYPES.ELEVATION_GAIN,
    'average_heartrate': METRIC_TYPES.HEART_RATE,
    'calories': METRIC_TYPES.ACTIVE_CALORIES,
  },
  
  [DATA_SOURCES.STRONG]: {
    'weight': METRIC_TYPES.WEIGHT_LIFTED,
    'reps': METRIC_TYPES.REPS,
    'sets': METRIC_TYPES.SETS,
    'volume': METRIC_TYPES.TRAINING_VOLUME,
    'estimated_1rm': METRIC_TYPES.ONE_REP_MAX,
  },
};

/**
 * Get standardized metric type from app-specific field name
 */
export function getStandardMetricType(appSource, appFieldName) {
  const mapping = APP_METRIC_MAPPINGS[appSource];
  if (!mapping) {
    console.warn(`No metric mapping found for source: ${appSource}`);
    return null;
  }
  
  const standardType = mapping[appFieldName];
  if (!standardType) {
    console.warn(`No mapping found for ${appSource}.${appFieldName}`);
    return null;
  }
  
  return standardType;
}

/**
 * Get metric metadata (category, unit, display name)
 */
export function getMetricMetadata(metricType) {
  return METRIC_METADATA[metricType] || null;
}

/**
 * Get quality score for a data source
 */
export function getQualityScore(source) {
  return QUALITY_SCORES[source] || QUALITY_SCORES.ESTIMATED;
}

/**
 * Convert value to standard unit
 */
export function convertToStandardUnit(value, fromUnit, toUnit) {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return value;
  }
  
  // Distance conversions
  if (fromUnit === 'km' && toUnit === 'mi') {
    return UNIT_CONVERSIONS.km_to_miles(value);
  }
  if (fromUnit === 'meters' && toUnit === 'mi') {
    return UNIT_CONVERSIONS.meters_to_miles(value);
  }
  if (fromUnit === 'meters' && toUnit === 'ft') {
    return UNIT_CONVERSIONS.meters_to_feet(value);
  }
  
  // Weight conversions
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return UNIT_CONVERSIONS.kg_to_lbs(value);
  }
  if (fromUnit === 'g' && toUnit === 'oz') {
    return UNIT_CONVERSIONS.g_to_oz(value);
  }
  
  // Height conversions
  if (fromUnit === 'cm' && toUnit === 'inches') {
    return UNIT_CONVERSIONS.cm_to_inches(value);
  }
  if (fromUnit === 'cm' && toUnit === 'feet') {
    return UNIT_CONVERSIONS.cm_to_feet(value);
  }
  
  // Temperature conversions
  if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
    return UNIT_CONVERSIONS.celsius_to_fahrenheit(value);
  }
  
  // Volume conversions
  if (fromUnit === 'ml' && toUnit === 'fl_oz') {
    return UNIT_CONVERSIONS.ml_to_fl_oz(value);
  }
  if (fromUnit === 'ml' && toUnit === 'cups') {
    return UNIT_CONVERSIONS.ml_to_cups(value);
  }
  if (fromUnit === 'ml' && toUnit === 'liters') {
    return UNIT_CONVERSIONS.ml_to_liters(value);
  }
  
  // Time conversions
  if (fromUnit === 'seconds' && toUnit === 'minutes') {
    return UNIT_CONVERSIONS.seconds_to_minutes(value);
  }
  if (fromUnit === 'minutes' && toUnit === 'seconds') {
    return UNIT_CONVERSIONS.minutes_to_seconds(value);
  }
  if (fromUnit === 'hours' && toUnit === 'minutes') {
    return UNIT_CONVERSIONS.hours_to_minutes(value);
  }
  if (fromUnit === 'seconds' && toUnit === 'hours') {
    return UNIT_CONVERSIONS.seconds_to_hours(value);
  }
  
  console.warn(`No conversion available from ${fromUnit} to ${toUnit}`);
  return value;
}

/**
 * Normalize health data from any source to standard format
 */
export function normalizeHealthData({
  source,
  appFieldName,
  value,
  unit,
  recordedAt,
  sourceDevice = null,
  metadata = {},
  description = null,
}) {
  // Get standard metric type
  const metricType = getStandardMetricType(source, appFieldName);
  if (!metricType) {
    return null;
  }
  
  // Get metric metadata
  const metricMetadata = getMetricMetadata(metricType);
  if (!metricMetadata) {
    return null;
  }
  
  // Convert to standard unit if needed
  const standardValue = convertToStandardUnit(value, unit, metricMetadata.unit);
  
  // Get quality score
  const qualityScore = getQualityScore(source);
  
  return {
    data_type: metricType,
    value: standardValue,
    unit: metricMetadata.unit,
    recorded_at: recordedAt,
    source_app: source,
    source_device: sourceDevice,
    data_category: metricMetadata.category,
    quality_score: qualityScore,
    metadata,
    description,
    is_aggregated: false,
    is_canonical: true, // Will be updated by deduplication service
  };
}

export default {
  METRIC_TYPES,
  DATA_CATEGORIES,
  METRIC_METADATA,
  DATA_SOURCES,
  QUALITY_SCORES,
  APP_METRIC_MAPPINGS,
  UNIT_CONVERSIONS,
  getStandardMetricType,
  getMetricMetadata,
  getQualityScore,
  convertToStandardUnit,
  normalizeHealthData,
};

