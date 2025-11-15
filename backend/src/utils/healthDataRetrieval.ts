/**
 * Health Data Retrieval Service
 * 
 * Backend service for querying health data from Supabase
 * Used by RAG service to retrieve user health context
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface DailyMetric {
  date: string;
  steps?: number;
  distance_mi?: number;
  active_calories?: number;
  resting_calories?: number;
  exercise_minutes?: number;
  flights_climbed?: number;
  avg_heart_rate?: number;
  resting_heart_rate?: number;
  heart_rate_variability?: number;
  sleep_hours?: number;
  weight_lbs?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  calories_consumed?: number;
  water_oz?: number;
  workout_count?: number;
  total_workout_minutes?: number;
  strength_sessions?: number;
  cardio_sessions?: number;
  data_completeness_score?: number;
}

export interface HealthEvent {
  id: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  title?: string;
  description?: string;
  source_app?: string;
  metrics?: any;
}

export interface DataSummary {
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
  averages: { [key: string]: number };
  totals: { [key: string]: number };
  events: { [key: string]: number };
  latestWeight?: number;
}

/**
 * Get daily aggregated metrics for a date range
 */
export async function getDailyMetrics(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data: DailyMetric[]; error?: string }> {
  try {
    console.log('[HealthDataRetrieval-getDailyMetrics] ===== QUERYING DAILY METRICS =====');
    console.log('[HealthDataRetrieval-getDailyMetrics] Full userId:', userId);
    console.log('[HealthDataRetrieval-getDailyMetrics] UserId type:', typeof userId);
    console.log('[HealthDataRetrieval-getDailyMetrics] Date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    console.log('[HealthDataRetrieval-getDailyMetrics] ===================================');
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('health_metrics_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('[HealthDataRetrieval-getDailyMetrics] Error fetching daily metrics:', error);
      console.error('[HealthDataRetrieval-getDailyMetrics] Error occurred with userId:', userId);
      return { success: false, data: [], error: error.message };
    }

    console.log('[HealthDataRetrieval-getDailyMetrics] Successfully retrieved', data?.length || 0, 'daily metrics for userId:', userId);
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[HealthDataRetrieval] Exception in getDailyMetrics:', error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Get health events (workouts, meals, etc.) for a date range
 */
export async function getHealthEvents(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date,
  eventTypes?: string[]
): Promise<{ success: boolean; data: HealthEvent[]; error?: string }> {
  try {
    console.log('[HealthDataRetrieval-getHealthEvents] ===== QUERYING HEALTH EVENTS =====');
    console.log('[HealthDataRetrieval-getHealthEvents] Full userId:', userId);
    console.log('[HealthDataRetrieval-getHealthEvents] UserId type:', typeof userId);
    console.log('[HealthDataRetrieval-getHealthEvents] ===================================');
    
    let query = supabase
      .from('health_events')
      .select('id, event_type, start_time, end_time, duration_seconds, title, description, source_app, metrics')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: false });

    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HealthDataRetrieval-getHealthEvents] Error fetching health events:', error);
      console.error('[HealthDataRetrieval-getHealthEvents] Error occurred with userId:', userId);
      return { success: false, data: [], error: error.message };
    }

    console.log('[HealthDataRetrieval-getHealthEvents] Successfully retrieved', data?.length || 0, 'health events for userId:', userId);
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[HealthDataRetrieval] Exception in getHealthEvents:', error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Get a comprehensive data summary for a date range
 */
export async function getDataSummary(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; summary?: DataSummary; error?: string }> {
  try {
    console.log('[HealthDataRetrieval-getDataSummary] ===== GETTING DATA SUMMARY =====');
    console.log('[HealthDataRetrieval-getDataSummary] Full userId:', userId);
    console.log('[HealthDataRetrieval-getDataSummary] UserId type:', typeof userId);
    console.log('[HealthDataRetrieval-getDataSummary] =================================');
    
    // Get daily metrics
    const dailyMetricsResult = await getDailyMetrics(supabase, userId, startDate, endDate);
    
    if (!dailyMetricsResult.success) {
      return { success: false, error: dailyMetricsResult.error };
    }

    const metrics = dailyMetricsResult.data;

    // Get event counts by type
    console.log('[HealthDataRetrieval-getDataSummary] Querying event counts for userId:', userId);
    const { data: eventCounts, error: evError } = await supabase
      .from('health_events')
      .select('event_type')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    const eventSummary: { [key: string]: number } = {};
    if (!evError && eventCounts) {
      eventCounts.forEach((event: any) => {
        eventSummary[event.event_type] = (eventSummary[event.event_type] || 0) + 1;
      });
    }

    // Calculate summary statistics
    const summary: DataSummary = {
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days: metrics.length,
      },
      averages: {},
      totals: {},
      events: eventSummary,
    };

    if (metrics.length > 0) {
      // Calculate averages
      const avgFields = [
        'steps', 'distance_mi', 'active_calories', 'exercise_minutes',
        'avg_heart_rate', 'resting_heart_rate', 'heart_rate_variability',
        'sleep_hours', 'calories_consumed', 'protein_g', 'carbs_g', 'fat_g', 'water_oz'
      ];

      avgFields.forEach(field => {
        const values = metrics
          .map(m => (m as any)[field])
          .filter(v => v != null && !isNaN(v));
        
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          summary.averages[field] = Math.round((sum / values.length) * 100) / 100;
        }
      });

      // Calculate totals
      const totalFields = [
        'steps', 'distance_mi', 'active_calories', 'exercise_minutes',
        'workout_count', 'strength_sessions', 'cardio_sessions'
      ];

      totalFields.forEach(field => {
        const values = metrics
          .map(m => (m as any)[field])
          .filter(v => v != null && !isNaN(v));
        
        if (values.length > 0) {
          summary.totals[field] = Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
        }
      });

      // Get latest weight
      const latestWithWeight = metrics.reverse().find(m => m.weight_lbs != null);
      if (latestWithWeight) {
        summary.latestWeight = latestWithWeight.weight_lbs;
      }
    }

    return { success: true, summary };
  } catch (error: any) {
    console.error('[HealthDataRetrieval] Exception in getDataSummary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get specific metrics time-series data
 */
export async function getMetricTimeSeries(
  supabase: SupabaseClient,
  userId: string,
  metricType: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    console.log('[HealthDataRetrieval-getMetricTimeSeries] ===== QUERYING METRIC TIME SERIES =====');
    console.log('[HealthDataRetrieval-getMetricTimeSeries] Full userId:', userId);
    console.log('[HealthDataRetrieval-getMetricTimeSeries] UserId type:', typeof userId);
    console.log('[HealthDataRetrieval-getMetricTimeSeries] Metric type:', metricType);
    console.log('[HealthDataRetrieval-getMetricTimeSeries] =======================================');
    
    const { data, error } = await supabase
      .from('health_data')
      .select('recorded_at, value, unit, source_app, metadata')
      .eq('user_id', userId)
      .eq('data_type', metricType)
      .eq('is_canonical', true)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('[HealthDataRetrieval-getMetricTimeSeries] Error fetching time-series data:', error);
      console.error('[HealthDataRetrieval-getMetricTimeSeries] Error occurred with userId:', userId);
      return { success: false, data: [], error: error.message };
    }

    console.log('[HealthDataRetrieval-getMetricTimeSeries] Successfully retrieved', data?.length || 0, 'time-series records for userId:', userId);
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[HealthDataRetrieval] Exception in getMetricTimeSeries:', error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Format daily metrics into natural language for RAG context
 */
export function formatDailyMetricsForContext(metrics: DailyMetric[]): string {
  if (metrics.length === 0) {
    return 'No health data available for this period.';
  }

  let text = `Health Data (${metrics.length} days):\n\n`;

  metrics.forEach(day => {
    text += `Date: ${day.date}\n`;

    // Activity
    if (day.steps) text += `  Steps: ${day.steps.toLocaleString()}\n`;
    if (day.distance_mi) text += `  Distance: ${day.distance_mi.toFixed(2)} miles\n`;
    if (day.active_calories) text += `  Active Calories: ${day.active_calories} kcal\n`;
    if (day.exercise_minutes) text += `  Exercise: ${day.exercise_minutes} minutes\n`;

    // Heart
    if (day.avg_heart_rate) text += `  Avg Heart Rate: ${day.avg_heart_rate} bpm\n`;
    if (day.resting_heart_rate) text += `  Resting Heart Rate: ${day.resting_heart_rate} bpm\n`;
    if (day.heart_rate_variability) text += `  HRV: ${day.heart_rate_variability} ms\n`;

    // Sleep
    if (day.sleep_hours) text += `  Sleep: ${day.sleep_hours.toFixed(1)} hours\n`;

    // Nutrition
    if (day.calories_consumed) text += `  Calories Consumed: ${day.calories_consumed} kcal\n`;
    if (day.protein_g) text += `  Protein: ${day.protein_g}g\n`;
    if (day.carbs_g) text += `  Carbs: ${day.carbs_g}g\n`;
    if (day.fat_g) text += `  Fat: ${day.fat_g}g\n`;
    if (day.water_oz) text += `  Water: ${day.water_oz.toFixed(1)} oz\n`;

    // Workouts
    if (day.workout_count) text += `  Workouts: ${day.workout_count}\n`;

    // Weight
    if (day.weight_lbs) {
      text += `  Weight: ${day.weight_lbs.toFixed(1)} lbs\n`;
    }

    text += '\n';
  });

  return text;
}

/**
 * Format data summary into natural language for RAG context
 */
export function formatSummaryForContext(summary: DataSummary): string {
  let text = `Health Summary (${summary.dateRange.start} to ${summary.dateRange.end}):\n\n`;
  
  text += `Period: ${summary.dateRange.days} days with data\n\n`;

  if (Object.keys(summary.averages).length > 0) {
    text += 'Daily Averages:\n';
    
    if (summary.averages.steps) text += `  Steps: ${Math.round(summary.averages.steps).toLocaleString()}\n`;
    if (summary.averages.distance_mi) text += `  Distance: ${summary.averages.distance_mi.toFixed(2)} miles\n`;
    if (summary.averages.active_calories) text += `  Active Calories: ${Math.round(summary.averages.active_calories)} kcal\n`;
    if (summary.averages.exercise_minutes) text += `  Exercise: ${Math.round(summary.averages.exercise_minutes)} minutes\n`;
    if (summary.averages.avg_heart_rate) text += `  Avg Heart Rate: ${Math.round(summary.averages.avg_heart_rate)} bpm\n`;
    if (summary.averages.resting_heart_rate) text += `  Resting Heart Rate: ${Math.round(summary.averages.resting_heart_rate)} bpm\n`;
    if (summary.averages.heart_rate_variability) text += `  HRV: ${Math.round(summary.averages.heart_rate_variability)} ms\n`;
    if (summary.averages.sleep_hours) text += `  Sleep: ${summary.averages.sleep_hours.toFixed(1)} hours\n`;
    if (summary.averages.calories_consumed) text += `  Calories Consumed: ${Math.round(summary.averages.calories_consumed)} kcal\n`;
    if (summary.averages.protein_g) text += `  Protein: ${Math.round(summary.averages.protein_g)}g\n`;
    if (summary.averages.water_oz) text += `  Water: ${Math.round(summary.averages.water_oz)} oz\n`;
    
    text += '\n';
  }

  if (Object.keys(summary.totals).length > 0) {
    text += 'Totals:\n';
    
    if (summary.totals.steps) text += `  Total Steps: ${Math.round(summary.totals.steps).toLocaleString()}\n`;
    if (summary.totals.distance_mi) text += `  Total Distance: ${summary.totals.distance_mi.toFixed(2)} miles\n`;
    if (summary.totals.active_calories) text += `  Total Active Calories: ${Math.round(summary.totals.active_calories)} kcal\n`;
    if (summary.totals.exercise_minutes) text += `  Total Exercise: ${Math.round(summary.totals.exercise_minutes)} minutes\n`;
    if (summary.totals.workout_count) text += `  Total Workouts: ${summary.totals.workout_count}\n`;
    if (summary.totals.strength_sessions) text += `  Strength Sessions: ${summary.totals.strength_sessions}\n`;
    if (summary.totals.cardio_sessions) text += `  Cardio Sessions: ${summary.totals.cardio_sessions}\n`;
    
    text += '\n';
  }

  if (summary.latestWeight) {
    text += `Current Weight: ${summary.latestWeight.toFixed(1)} lbs\n\n`;
  }

  if (Object.keys(summary.events).length > 0) {
    text += 'Activities:\n';
    Object.entries(summary.events).forEach(([type, count]) => {
      text += `  ${type}: ${count} times\n`;
    });
  }

  return text;
}

/**
 * Format health events into natural language for RAG context
 */
export function formatEventsForContext(events: HealthEvent[]): string {
  if (events.length === 0) {
    return '';
  }

  let text = `\nRecent Activities (${events.length} events):\n\n`;

  events.slice(0, 20).forEach(event => { // Limit to 20 most recent
    const startTime = new Date(event.start_time);
    text += `${event.event_type} - ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}\n`;
    
    if (event.title) text += `  Title: ${event.title}\n`;
    if (event.description) text += `  Description: ${event.description}\n`;
    if (event.duration_seconds) {
      const minutes = Math.round(event.duration_seconds / 60);
      text += `  Duration: ${minutes} minutes\n`;
    }
    if (event.metrics) {
      const metricsStr = Object.entries(event.metrics)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      text += `  Details: ${metricsStr}\n`;
    }
    
    text += '\n';
  });

  return text;
}

/**
 * Get uploaded file data for a date range
 */
export async function getUploadedFileData(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date,
  categories?: string[]
): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    console.log('[HealthDataRetrieval-getUploadedFileData] ===== QUERYING UPLOADED FILE DATA =====');
    console.log('[HealthDataRetrieval-getUploadedFileData] Full userId:', userId);
    console.log('[HealthDataRetrieval-getUploadedFileData] UserId type:', typeof userId);
    console.log('[HealthDataRetrieval-getUploadedFileData] Date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    console.log('[HealthDataRetrieval-getUploadedFileData] =======================================');
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let query = supabase
      .from('uploaded_file_data')
      .select('id, file_name, extracted_data, data_categories, summary, date_range_start, date_range_end, upload_date')
      .eq('user_id', userId);

    // For uploaded files (especially lab results), we use a more lenient date filter
    // Include files where:
    // 1. date_range_start is null (no date info) - always include
    // 2. date_range overlaps with query range
    // 3. OR file was uploaded recently (within 6 months of query end date)
    //    This ensures recent uploads are included even if the data is older
    const sixMonthsAgo = new Date(endDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    query = query.or(
      `date_range_start.is.null,and(date_range_start.lte.${endDateStr},date_range_end.gte.${startDateStr}),upload_date.gte.${sixMonthsAgoStr}`
    );

    // Filter by categories if specified
    if (categories && categories.length > 0) {
      query = query.overlaps('data_categories', categories);
    }

    query = query.order('upload_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('[HealthDataRetrieval-getUploadedFileData] Error fetching uploaded file data:', error);
      console.error('[HealthDataRetrieval-getUploadedFileData] Error occurred with userId:', userId);
      return { success: false, data: [], error: error.message };
    }

    console.log('[HealthDataRetrieval-getUploadedFileData] Successfully retrieved', data?.length || 0, 'uploaded files for userId:', userId);
    
    // Log details about what was retrieved
    if (data && data.length > 0) {
      console.log('[HealthDataRetrieval-getUploadedFileData] File details:');
      data.forEach((file: any) => {
        console.log(`  - ${file.file_name}: categories=${file.data_categories}, date_range=${file.date_range_start} to ${file.date_range_end}, entries=${file.extracted_data?.entries?.length || 0}`);
      });
    }
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[HealthDataRetrieval] Exception in getUploadedFileData:', error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Format uploaded file data into natural language for RAG context
 */
export function formatUploadedDataForContext(uploadedFiles: any[]): string {
  if (uploadedFiles.length === 0) {
    return '';
  }

  let text = `\nUploaded Health Data (${uploadedFiles.length} files):\n\n`;

  uploadedFiles.forEach((file) => {
    text += `File: ${file.file_name}\n`;
    
    if (file.summary) {
      text += `Summary: ${file.summary}\n`;
    }
    
    if (file.data_categories && file.data_categories.length > 0) {
      text += `Categories: ${file.data_categories.join(', ')}\n`;
    }
    
    if (file.date_range_start && file.date_range_end) {
      text += `Date Range: ${file.date_range_start} to ${file.date_range_end}\n`;
    }
    
    // Include extracted data entries (all entries, no cap)
    const extractedData = file.extracted_data;
    if (extractedData && extractedData.entries && extractedData.entries.length > 0) {
      text += `Data Entries (${extractedData.entries.length}):\n`;
      
      // Show all entries from the file
      extractedData.entries.forEach((entry: any, index: number) => {
        if (entry.date) {
          text += `  ${entry.date}: `;
        } else {
          text += `  Entry ${index + 1}: `;
        }
        
        // Format metrics
        const metricsStr = Object.entries(entry.metrics || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        
        text += metricsStr;
        
        if (entry.notes) {
          text += ` (${entry.notes})`;
        }
        
        text += '\n';
      });
    }
    
    text += '\n';
  });

  return text;
}

export default {
  getDailyMetrics,
  getHealthEvents,
  getDataSummary,
  getMetricTimeSeries,
  getUploadedFileData,
  formatDailyMetricsForContext,
  formatSummaryForContext,
  formatEventsForContext,
  formatUploadedDataForContext,
};

