/**
 * Apple Health Integration Service
 * 
 * Enhanced Apple Health integration that writes to the redesigned schema
 * with quality scores, metadata, and support for raw data storage.
 * 
 * This service extends the existing healthKitService.js with new capabilities
 * for the universal health data architecture.
 */

import { Platform } from 'react-native';
import { queryQuantitySamples, queryCategorySamples } from '@kingstinct/react-native-healthkit';
import { supabase } from '../../lib/supabase';
import healthKitService from '../healthKitService';
import { 
  DATA_SOURCES, 
  METRIC_TYPES, 
  APP_METRIC_MAPPINGS,
  getStandardMetricType,
  getMetricMetadata,
  normalizeHealthData,
} from '../metricTypeRegistry';
import { runDeduplicationCheck } from '../dataDeduplicationService';

const DEBUG = __DEV__ && false;

// Map HealthKit identifiers to our standard metric types
const HK_TO_METRIC_TYPE = APP_METRIC_MAPPINGS[DATA_SOURCES.APPLE_HEALTH];

/**
 * Sync raw health data samples to health_data table
 * 
 * @param {string} hkIdentifier - HealthKit type identifier
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Sync result
 */
export async function syncRawSamples(hkIdentifier, startDate, endDate) {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Health only available on iOS' };
    }
    
    // Get standard metric type
    const metricType = getStandardMetricType(DATA_SOURCES.APPLE_HEALTH, hkIdentifier);
    if (!metricType) {
      console.warn(`[AppleHealth] No mapping for ${hkIdentifier}`);
      return { success: false, error: 'Unknown metric type' };
    }
    
    // Get metric metadata
    const metadata = getMetricMetadata(metricType);
    if (!metadata) {
      return { success: false, error: 'No metadata for metric type' };
    }
    
    // Fetch samples from HealthKit
    const samples = await queryQuantitySamples(hkIdentifier, {
      from: startDate,
      to: endDate,
    });
    
    if (!samples || samples.length === 0) {
      return { success: true, synced: 0 };
    }
    
    if (DEBUG) {
      console.log(`[AppleHealth] Fetched ${samples.length} samples for ${metricType}`);
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Normalize and prepare data for insertion
    const dataToInsert = samples.map(sample => {
      const normalized = normalizeHealthData({
        source: DATA_SOURCES.APPLE_HEALTH,
        appFieldName: hkIdentifier,
        value: sample.quantity,
        unit: sample.unit || metadata.unit,
        recordedAt: sample.startDate,
        sourceDevice: sample.device || null,
        metadata: {
          hk_uuid: sample.uuid,
          hk_source: sample.sourceName,
          hk_source_bundle: sample.sourceBundleId,
        },
      });
      
      if (normalized) {
        normalized.user_id = user.id;
      }
      
      return normalized;
    }).filter(Boolean);
    
    if (dataToInsert.length === 0) {
      return { success: true, synced: 0 };
    }
    
    // Insert in batches to avoid timeout
    const batchSize = 500;
    let totalInserted = 0;
    
    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('health_data')
        .upsert(batch, {
          onConflict: 'user_id,data_type,recorded_at,source_app',
          ignoreDuplicates: true,
        });
      
      if (error) {
        console.error(`[AppleHealth] Error inserting batch:`, error);
        // Continue with next batch
      } else {
        totalInserted += batch.length;
      }
    }
    
    if (DEBUG) {
      console.log(`[AppleHealth] Inserted ${totalInserted} samples for ${metricType}`);
    }
    
    return {
      success: true,
      synced: totalInserted,
      metricType,
    };
  } catch (error) {
    console.error('[AppleHealth] Error syncing raw samples:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync workout/activity events to health_events table
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Sync result
 */
export async function syncWorkoutEvents(startDate, endDate) {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Health only available on iOS' };
    }
    
    // Note: This would require additional HealthKit workout query support
    // For now, we'll extract workout data from exercise minutes
    // In a full implementation, you'd use HKWorkout queries
    
    console.log('[AppleHealth] Workout event sync not yet implemented');
    return { success: true, synced: 0 };
  } catch (error) {
    console.error('[AppleHealth] Error syncing workout events:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync sleep sessions to health_events table
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Sync result
 */
export async function syncSleepSessions(startDate, endDate) {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Health only available on iOS' };
    }
    
    // Fetch sleep analysis from HealthKit
    const sleepSamples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
      from: startDate,
      to: endDate,
    });
    
    if (!sleepSamples || sleepSamples.length === 0) {
      return { success: true, synced: 0 };
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Group sleep samples into sessions
    const sessions = groupSleepSessions(sleepSamples);
    
    // Prepare events for insertion
    const eventsToInsert = sessions.map(session => ({
      user_id: user.id,
      event_type: 'sleep_session',
      start_time: session.startDate,
      end_time: session.endDate,
      duration_seconds: Math.round((new Date(session.endDate) - new Date(session.startDate)) / 1000),
      title: 'Sleep',
      description: `Sleep session with ${session.stages.length} stages`,
      metrics: {
        stages: session.stages,
        total_duration_hours: session.totalHours,
      },
      source_app: DATA_SOURCES.APPLE_HEALTH,
      quality_score: 1.0,
    }));
    
    // Insert events
    const { data, error } = await supabase
      .from('health_events')
      .upsert(eventsToInsert, {
        onConflict: 'user_id,event_type,start_time',
        ignoreDuplicates: true,
      });
    
    if (error) {
      console.error('[AppleHealth] Error inserting sleep sessions:', error);
      return { success: false, error: error.message };
    }
    
    if (DEBUG) {
      console.log(`[AppleHealth] Synced ${sessions.length} sleep sessions`);
    }
    
    return {
      success: true,
      synced: sessions.length,
    };
  } catch (error) {
    console.error('[AppleHealth] Error syncing sleep sessions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync all available health data for a date range
 * 
 * @param {number} days - Number of days to sync (default: 30)
 * @returns {Promise<object>} Sync result
 */
export async function syncAllHealthData(days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`[AppleHealth] Starting sync for ${days} days...`);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Priority metrics to sync (most important for AI analysis)
    const priorityMetrics = [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      'HKQuantityTypeIdentifierBasalEnergyBurned',
      'HKQuantityTypeIdentifierAppleExerciseTime',
      'HKQuantityTypeIdentifierHeartRate',
      'HKQuantityTypeIdentifierRestingHeartRate',
      'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
      'HKQuantityTypeIdentifierBodyMass',
    ];
    
    // Sync raw samples for priority metrics
    const syncResults = [];
    const syncedMetrics = [];
    
    for (const hkIdentifier of priorityMetrics) {
      const result = await syncRawSamples(hkIdentifier, startDate, endDate);
      syncResults.push(result);
      
      if (result.success && result.metricType) {
        syncedMetrics.push(result.metricType);
      }
    }
    
    // Sync sleep sessions
    const sleepResult = await syncSleepSessions(startDate, endDate);
    syncResults.push(sleepResult);
    
    // Sync daily aggregates using existing service
    const dailyResult = await healthKitService.syncHealthData(days);
    
    // Run deduplication check
    // Since this is Apple Health (native), all records should be canonical
    // But we run it anyway for consistency
    await runDeduplicationCheck(user.id, DATA_SOURCES.APPLE_HEALTH, syncedMetrics);
    
    // Calculate totals
    const totalSynced = syncResults.reduce((sum, r) => sum + (r.synced || 0), 0);
    const successCount = syncResults.filter(r => r.success).length;
    
    console.log(`[AppleHealth] Sync complete: ${totalSynced} records, ${successCount}/${syncResults.length} metrics successful`);
    
    return {
      success: true,
      totalSynced,
      successCount,
      failedCount: syncResults.length - successCount,
      dailyMetrics: dailyResult,
    };
  } catch (error) {
    console.error('[AppleHealth] Error in syncAllHealthData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync historical data (all available data)
 * 
 * This fetches all available historical data from Apple Health.
 * Use with caution as it may take a long time and use significant storage.
 * 
 * @returns {Promise<object>} Sync result
 */
export async function syncHistoricalData() {
  try {
    // Sync last 365 days (1 year) of data
    // Apple Health typically has data going back further, but 1 year is a good balance
    const days = 365;
    
    console.log('[AppleHealth] Starting historical data sync (365 days)...');
    
    const result = await syncAllHealthData(days);
    
    if (result.success) {
      console.log('[AppleHealth] Historical sync complete');
    }
    
    return result;
  } catch (error) {
    console.error('[AppleHealth] Error in syncHistoricalData:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions

function groupSleepSessions(sleepSamples) {
  // Group consecutive sleep samples into sessions
  const sessions = [];
  let currentSession = null;
  
  sleepSamples.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  sleepSamples.forEach(sample => {
    const startTime = new Date(sample.startDate);
    const endTime = new Date(sample.endDate);
    
    if (!currentSession) {
      currentSession = {
        startDate: sample.startDate,
        endDate: sample.endDate,
        stages: [sample],
      };
    } else {
      const sessionEnd = new Date(currentSession.endDate);
      const timeDiff = (startTime - sessionEnd) / 1000 / 60; // minutes
      
      // If less than 30 minutes gap, consider it the same session
      if (timeDiff < 30) {
        currentSession.endDate = sample.endDate;
        currentSession.stages.push(sample);
      } else {
        // New session
        sessions.push(currentSession);
        currentSession = {
          startDate: sample.startDate,
          endDate: sample.endDate,
          stages: [sample],
        };
      }
    }
  });
  
  if (currentSession) {
    sessions.push(currentSession);
  }
  
  // Calculate total hours for each session
  sessions.forEach(session => {
    const duration = new Date(session.endDate) - new Date(session.startDate);
    session.totalHours = duration / 1000 / 60 / 60;
  });
  
  return sessions;
}

export default {
  syncRawSamples,
  syncWorkoutEvents,
  syncSleepSessions,
  syncAllHealthData,
  syncHistoricalData,
};

