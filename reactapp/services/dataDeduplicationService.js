/**
 * Data Deduplication Service
 * 
 * Manages canonical record marking for health data from multiple sources.
 * Strategy: Always prefer Apple Health (iOS) or Google Fit/Health Connect (Android)
 * for any data type they provide. Only use third-party app data when native
 * health apps don't provide that specific metric type.
 * 
 * All data is preserved, but non-canonical records are marked for filtering
 * during AI analysis.
 */

import { supabase } from '../lib/supabase';
import { DATA_SOURCES, METRIC_TYPES } from './metricTypeRegistry';

// Native health app sources that take priority
const NATIVE_HEALTH_SOURCES = [
  DATA_SOURCES.APPLE_HEALTH,
  DATA_SOURCES.GOOGLE_FIT,
  DATA_SOURCES.HEALTH_CONNECT,
];

// Metrics that native health apps typically provide
// If native health has these, third-party apps are marked non-canonical
const NATIVE_HEALTH_METRICS = [
  // Activity
  METRIC_TYPES.STEPS,
  METRIC_TYPES.DISTANCE,
  METRIC_TYPES.DISTANCE_WALKING,
  METRIC_TYPES.DISTANCE_RUNNING,
  METRIC_TYPES.DISTANCE_CYCLING,
  METRIC_TYPES.DISTANCE_SWIMMING,
  METRIC_TYPES.ACTIVE_CALORIES,
  METRIC_TYPES.RESTING_CALORIES,
  METRIC_TYPES.TOTAL_CALORIES_BURNED,
  METRIC_TYPES.EXERCISE_MINUTES,
  METRIC_TYPES.ACTIVE_MINUTES,
  METRIC_TYPES.FLIGHTS_CLIMBED,
  
  // Heart & Vitals
  METRIC_TYPES.HEART_RATE,
  METRIC_TYPES.RESTING_HEART_RATE,
  METRIC_TYPES.WALKING_HEART_RATE,
  METRIC_TYPES.HEART_RATE_VARIABILITY,
  METRIC_TYPES.VO2_MAX,
  METRIC_TYPES.BLOOD_PRESSURE_SYSTOLIC,
  METRIC_TYPES.BLOOD_PRESSURE_DIASTOLIC,
  METRIC_TYPES.BLOOD_GLUCOSE,
  METRIC_TYPES.OXYGEN_SATURATION,
  METRIC_TYPES.RESPIRATORY_RATE,
  METRIC_TYPES.BODY_TEMPERATURE,
  
  // Body Measurements
  METRIC_TYPES.WEIGHT,
  METRIC_TYPES.HEIGHT,
  METRIC_TYPES.BMI,
  METRIC_TYPES.BODY_FAT_PERCENTAGE,
  METRIC_TYPES.LEAN_BODY_MASS,
  METRIC_TYPES.WAIST_CIRCUMFERENCE,
  
  // Sleep
  METRIC_TYPES.SLEEP_DURATION,
  METRIC_TYPES.SLEEP_DEEP,
  METRIC_TYPES.SLEEP_REM,
  METRIC_TYPES.SLEEP_LIGHT,
  METRIC_TYPES.SLEEP_AWAKE,
  
  // Mental Health
  METRIC_TYPES.MINDFUL_MINUTES,
];

// Metrics that are ONLY available from third-party apps
// These are always canonical regardless of source
const THIRD_PARTY_EXCLUSIVE_METRICS = [
  // Nutrition (MyFitnessPal, etc.)
  METRIC_TYPES.CALORIES_CONSUMED,
  METRIC_TYPES.PROTEIN,
  METRIC_TYPES.CARBOHYDRATES,
  METRIC_TYPES.FAT,
  METRIC_TYPES.FIBER,
  METRIC_TYPES.SUGAR,
  METRIC_TYPES.SODIUM,
  METRIC_TYPES.WATER,
  METRIC_TYPES.CAFFEINE,
  
  // Strength Training (Strong, etc.)
  METRIC_TYPES.WEIGHT_LIFTED,
  METRIC_TYPES.REPS,
  METRIC_TYPES.SETS,
  METRIC_TYPES.TRAINING_VOLUME,
  METRIC_TYPES.ONE_REP_MAX,
  
  // Advanced metrics
  METRIC_TYPES.ELEVATION_GAIN, // Strava provides more detailed data
  METRIC_TYPES.STRESS_LEVEL,
];

/**
 * Check if a source is a native health app
 */
function isNativeHealthSource(source) {
  return NATIVE_HEALTH_SOURCES.includes(source);
}

/**
 * Check if a metric is typically provided by native health apps
 */
function isNativeHealthMetric(metricType) {
  return NATIVE_HEALTH_METRICS.includes(metricType);
}

/**
 * Check if a metric is exclusive to third-party apps
 */
function isThirdPartyExclusiveMetric(metricType) {
  return THIRD_PARTY_EXCLUSIVE_METRICS.includes(metricType);
}

/**
 * Determine if a data point should be canonical
 * 
 * Rules:
 * 1. If metric is third-party exclusive → always canonical
 * 2. If source is native health app → always canonical
 * 3. If source is third-party AND metric is native health metric → check if native health has it
 */
export function shouldBeCanonical(source, metricType) {
  // Rule 1: Third-party exclusive metrics are always canonical
  if (isThirdPartyExclusiveMetric(metricType)) {
    return true;
  }
  
  // Rule 2: Native health sources are always canonical
  if (isNativeHealthSource(source)) {
    return true;
  }
  
  // Rule 3: Third-party sources for native health metrics need checking
  // This will be determined by checking if native health data exists
  // Default to true, will be updated by markNonCanonicalRecords
  return true;
}

/**
 * Mark non-canonical records for a user's data
 * 
 * This function should be called after syncing data from any source.
 * It identifies duplicate metrics and marks third-party data as non-canonical
 * when native health data exists for the same metric/timeframe.
 * 
 * @param {string} userId - User ID
 * @param {string} metricType - Specific metric type to check (optional, checks all if not provided)
 * @param {Date} startDate - Start date for checking (optional)
 * @param {Date} endDate - End date for checking (optional)
 */
export async function markNonCanonicalRecords(userId, metricType = null, startDate = null, endDate = null) {
  try {
    // Build query for health data
    let query = supabase
      .from('health_data')
      .select('id, data_type, source_app, recorded_at')
      .eq('user_id', userId);
    
    if (metricType) {
      query = query.eq('data_type', metricType);
    }
    
    if (startDate) {
      query = query.gte('recorded_at', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('recorded_at', endDate.toISOString());
    }
    
    const { data: allRecords, error } = await query;
    
    if (error) {
      console.error('[Deduplication] Error fetching records:', error);
      return { success: false, error: error.message };
    }
    
    if (!allRecords || allRecords.length === 0) {
      return { success: true, updated: 0 };
    }
    
    // Group records by metric type and time window (1-hour buckets)
    const recordGroups = {};
    
    allRecords.forEach(record => {
      const recordDate = new Date(record.recorded_at);
      const hourBucket = new Date(recordDate);
      hourBucket.setMinutes(0, 0, 0);
      const bucketKey = `${record.data_type}_${hourBucket.toISOString()}`;
      
      if (!recordGroups[bucketKey]) {
        recordGroups[bucketKey] = [];
      }
      
      recordGroups[bucketKey].push(record);
    });
    
    // Identify records to mark as non-canonical
    const recordsToMarkNonCanonical = [];
    
    Object.values(recordGroups).forEach(group => {
      if (group.length <= 1) {
        // No duplicates in this time window
        return;
      }
      
      const metricType = group[0].data_type;
      
      // If this is a third-party exclusive metric, all records are canonical
      if (isThirdPartyExclusiveMetric(metricType)) {
        return;
      }
      
      // Check if native health source exists in this group
      const hasNativeHealth = group.some(r => isNativeHealthSource(r.source_app));
      
      if (hasNativeHealth) {
        // Mark all non-native health records as non-canonical
        group.forEach(record => {
          if (!isNativeHealthSource(record.source_app)) {
            recordsToMarkNonCanonical.push(record.id);
          }
        });
      }
    });
    
    // Update records in batches
    if (recordsToMarkNonCanonical.length > 0) {
      const { error: updateError } = await supabase
        .from('health_data')
        .update({ is_canonical: false })
        .in('id', recordsToMarkNonCanonical);
      
      if (updateError) {
        console.error('[Deduplication] Error updating records:', updateError);
        return { success: false, error: updateError.message };
      }
    }
    
    console.log(`[Deduplication] Marked ${recordsToMarkNonCanonical.length} records as non-canonical`);
    
    return {
      success: true,
      updated: recordsToMarkNonCanonical.length,
      totalRecords: allRecords.length,
    };
  } catch (error) {
    console.error('[Deduplication] Error in markNonCanonicalRecords:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if native health data exists for a specific metric and time range
 * 
 * This is useful for determining if third-party data should be canonical
 * before inserting it.
 */
export async function hasNativeHealthData(userId, metricType, recordedAt) {
  try {
    // Check if this metric is third-party exclusive
    if (isThirdPartyExclusiveMetric(metricType)) {
      return false; // No native health data for this metric
    }
    
    // Create 1-hour time window around the recorded time
    const recordDate = new Date(recordedAt);
    const startWindow = new Date(recordDate);
    startWindow.setMinutes(startWindow.getMinutes() - 30);
    const endWindow = new Date(recordDate);
    endWindow.setMinutes(endWindow.getMinutes() + 30);
    
    // Query for native health data in this window
    const { data, error } = await supabase
      .from('health_data')
      .select('id')
      .eq('user_id', userId)
      .eq('data_type', metricType)
      .in('source_app', NATIVE_HEALTH_SOURCES)
      .gte('recorded_at', startWindow.toISOString())
      .lte('recorded_at', endWindow.toISOString())
      .limit(1);
    
    if (error) {
      console.error('[Deduplication] Error checking native health data:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('[Deduplication] Error in hasNativeHealthData:', error);
    return false;
  }
}

/**
 * Get canonical data for a user
 * 
 * Convenience function to query only canonical records
 */
export async function getCanonicalData(userId, filters = {}) {
  try {
    let query = supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .eq('is_canonical', true)
      .order('recorded_at', { ascending: false });
    
    if (filters.dataType) {
      query = query.eq('data_type', filters.dataType);
    }
    
    if (filters.category) {
      query = query.eq('data_category', filters.category);
    }
    
    if (filters.startDate) {
      query = query.gte('recorded_at', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query = query.lte('recorded_at', filters.endDate.toISOString());
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[Deduplication] Error fetching canonical data:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[Deduplication] Error in getCanonicalData:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Run deduplication check after data sync
 * 
 * This should be called after syncing data from any source to ensure
 * canonical flags are up to date.
 */
export async function runDeduplicationCheck(userId, source, syncedMetrics = []) {
  try {
    console.log(`[Deduplication] Running check for user ${userId}, source: ${source}`);
    
    // If native health source, no need to check - it's always canonical
    if (isNativeHealthSource(source)) {
      console.log('[Deduplication] Native health source - skipping check');
      return { success: true, updated: 0 };
    }
    
    // For third-party sources, check each synced metric
    let totalUpdated = 0;
    
    for (const metricType of syncedMetrics) {
      // Skip third-party exclusive metrics
      if (isThirdPartyExclusiveMetric(metricType)) {
        continue;
      }
      
      // Mark non-canonical records for this metric
      const result = await markNonCanonicalRecords(userId, metricType);
      
      if (result.success) {
        totalUpdated += result.updated || 0;
      }
    }
    
    console.log(`[Deduplication] Check complete. Updated ${totalUpdated} records.`);
    
    return { success: true, updated: totalUpdated };
  } catch (error) {
    console.error('[Deduplication] Error in runDeduplicationCheck:', error);
    return { success: false, error: error.message };
  }
}

export default {
  shouldBeCanonical,
  markNonCanonicalRecords,
  hasNativeHealthData,
  getCanonicalData,
  runDeduplicationCheck,
  isNativeHealthSource,
  isNativeHealthMetric,
  isThirdPartyExclusiveMetric,
};

