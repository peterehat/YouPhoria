/**
 * Health Data Query Service
 * 
 * AI-optimized query layer for health data with support for:
 * - Time-series queries
 * - Multi-metric correlation analysis
 * - Semantic search on descriptions
 * - RAG-ready data exports
 * 
 * All queries use canonical data by default for accuracy.
 */

import { supabase } from '../lib/supabase';
import { METRIC_TYPES, DATA_CATEGORIES, METRIC_METADATA } from './metricTypeRegistry';

/**
 * Get time-series data for a specific metric
 * 
 * @param {string} userId - User ID
 * @param {string} metricType - Metric type (from METRIC_TYPES)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options
 * @returns {Promise<object>} Time-series data
 */
export async function getTimeSeriesData(userId, metricType, startDate, endDate, options = {}) {
  try {
    const {
      aggregation = 'none', // 'none', 'hourly', 'daily', 'weekly', 'monthly'
      includeNonCanonical = false,
      limit = null,
    } = options;
    
    let query = supabase
      .from('health_data')
      .select('recorded_at, value, unit, source_app, quality_score, metadata')
      .eq('user_id', userId)
      .eq('data_type', metricType)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });
    
    if (!includeNonCanonical) {
      query = query.eq('is_canonical', true);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[QueryService] Error fetching time-series data:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    // Apply aggregation if requested
    let processedData = data || [];
    
    if (aggregation !== 'none' && processedData.length > 0) {
      processedData = aggregateTimeSeries(processedData, aggregation);
    }
    
    return {
      success: true,
      data: processedData,
      metricType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      count: processedData.length,
    };
  } catch (error) {
    console.error('[QueryService] Error in getTimeSeriesData:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get multiple metrics for correlation analysis
 * 
 * @param {string} userId - User ID
 * @param {string[]} metricTypes - Array of metric types
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options
 * @returns {Promise<object>} Multi-metric data organized by date
 */
export async function getCorrelationData(userId, metricTypes, startDate, endDate, options = {}) {
  try {
    const {
      aggregation = 'daily',
      includeNonCanonical = false,
    } = options;
    
    // Fetch data for all metrics in parallel
    const promises = metricTypes.map(metricType =>
      getTimeSeriesData(userId, metricType, startDate, endDate, {
        aggregation,
        includeNonCanonical,
      })
    );
    
    const results = await Promise.all(promises);
    
    // Check for errors
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      console.error('[QueryService] Errors fetching correlation data:', errors);
    }
    
    // Organize data by date for easy correlation
    const dataByDate = {};
    
    results.forEach((result, index) => {
      if (result.success && result.data) {
        const metricType = metricTypes[index];
        
        result.data.forEach(point => {
          const dateKey = new Date(point.recorded_at).toISOString().split('T')[0];
          
          if (!dataByDate[dateKey]) {
            dataByDate[dateKey] = { date: dateKey };
          }
          
          dataByDate[dateKey][metricType] = point.value;
        });
      }
    });
    
    // Convert to array and sort by date
    const correlationData = Object.values(dataByDate).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );
    
    return {
      success: true,
      data: correlationData,
      metrics: metricTypes,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      count: correlationData.length,
    };
  } catch (error) {
    console.error('[QueryService] Error in getCorrelationData:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get daily aggregated metrics
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options
 * @returns {Promise<object>} Daily metrics
 */
export async function getDailyMetrics(userId, startDate, endDate, options = {}) {
  try {
    const { includeDataSources = false } = options;
    
    let selectFields = '*';
    if (!includeDataSources) {
      selectFields = `
        date, steps, distance_km, active_calories, resting_calories,
        exercise_minutes, flights_climbed, avg_heart_rate, resting_heart_rate,
        heart_rate_variability, sleep_hours, weight_kg, protein_g, carbs_g,
        fat_g, calories_consumed, water_ml, workout_count, total_workout_minutes,
        strength_sessions, cardio_sessions, data_completeness_score
      `;
    }
    
    const { data, error } = await supabase
      .from('health_metrics_daily')
      .select(selectFields)
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    if (error) {
      console.error('[QueryService] Error fetching daily metrics:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return {
      success: true,
      data: data || [],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('[QueryService] Error in getDailyMetrics:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get health events (workouts, meals, etc.)
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options
 * @returns {Promise<object>} Health events
 */
export async function getHealthEvents(userId, startDate, endDate, options = {}) {
  try {
    const {
      eventTypes = null, // Filter by event types
      includeMetrics = true,
      includeLocation = false,
      limit = null,
    } = options;
    
    let selectFields = 'id, event_type, start_time, end_time, duration_seconds, title, description, source_app, quality_score';
    
    if (includeMetrics) {
      selectFields += ', metrics';
    }
    
    if (includeLocation) {
      selectFields += ', location';
    }
    
    let query = supabase
      .from('health_events')
      .select(selectFields)
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: false });
    
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[QueryService] Error fetching health events:', error);
      return { success: false, error: error.message, data: [] };
    }
    
    return {
      success: true,
      data: data || [],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('[QueryService] Error in getHealthEvents:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Semantic search across health data descriptions
 * 
 * @param {string} userId - User ID
 * @param {string} searchQuery - Search query
 * @param {object} options - Additional options
 * @returns {Promise<object>} Search results
 */
export async function semanticSearch(userId, searchQuery, options = {}) {
  try {
    const {
      searchIn = 'all', // 'health_data', 'health_events', 'all'
      limit = 50,
    } = options;
    
    const results = {
      success: true,
      query: searchQuery,
      healthData: [],
      healthEvents: [],
    };
    
    // Search in health_data descriptions
    if (searchIn === 'health_data' || searchIn === 'all') {
      const { data: healthDataResults, error: hdError } = await supabase
        .from('health_data')
        .select('id, data_type, value, unit, recorded_at, description, source_app, metadata')
        .eq('user_id', userId)
        .eq('is_canonical', true)
        .textSearch('description', searchQuery, {
          type: 'websearch',
          config: 'english',
        })
        .limit(limit);
      
      if (!hdError && healthDataResults) {
        results.healthData = healthDataResults;
      }
    }
    
    // Search in health_events titles and descriptions
    if (searchIn === 'health_events' || searchIn === 'all') {
      const { data: eventsResults, error: evError } = await supabase
        .from('health_events')
        .select('id, event_type, start_time, end_time, title, description, source_app, metrics')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);
      
      if (!evError && eventsResults) {
        results.healthEvents = eventsResults;
      }
    }
    
    results.totalResults = results.healthData.length + results.healthEvents.length;
    
    return results;
  } catch (error) {
    console.error('[QueryService] Error in semanticSearch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get data summary for a date range
 * Useful for AI context about user's overall health status
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Data summary
 */
export async function getDataSummary(userId, startDate, endDate) {
  try {
    // Get daily metrics summary
    const dailyMetrics = await getDailyMetrics(userId, startDate, endDate);
    
    // Get event counts by type
    const { data: eventCounts, error: evError } = await supabase
      .from('health_events')
      .select('event_type')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());
    
    const eventSummary = {};
    if (!evError && eventCounts) {
      eventCounts.forEach(event => {
        eventSummary[event.event_type] = (eventSummary[event.event_type] || 0) + 1;
      });
    }
    
    // Calculate averages from daily metrics
    const metrics = dailyMetrics.data || [];
    const summary = {
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
      const sumFields = ['steps', 'distance_km', 'active_calories', 'exercise_minutes',
        'avg_heart_rate', 'sleep_hours', 'calories_consumed', 'protein_g', 'carbs_g', 'fat_g'];
      
      sumFields.forEach(field => {
        const values = metrics.map(m => m[field]).filter(v => v != null);
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          summary.averages[field] = Math.round((sum / values.length) * 100) / 100;
        }
      });
      
      // Calculate totals
      const totalFields = ['steps', 'distance_km', 'active_calories', 'exercise_minutes',
        'workout_count', 'strength_sessions', 'cardio_sessions'];
      
      totalFields.forEach(field => {
        const values = metrics.map(m => m[field]).filter(v => v != null);
        if (values.length > 0) {
          summary.totals[field] = values.reduce((a, b) => a + b, 0);
        }
      });
      
      // Get latest weight
      const latestWithWeight = metrics.find(m => m.weight_kg != null);
      if (latestWithWeight) {
        summary.latestWeight = latestWithWeight.weight_kg;
      }
    }
    
    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('[QueryService] Error in getDataSummary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export data in RAG-ready format for AI analysis
 * 
 * Formats health data as structured text suitable for embedding and retrieval
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {object} options - Additional options
 * @returns {Promise<object>} RAG-formatted data
 */
export async function exportForRAG(userId, startDate, endDate, options = {}) {
  try {
    const {
      includeRawData = false,
      includeDailyMetrics = true,
      includeEvents = true,
      maxChunkSize = 2000, // characters per chunk
    } = options;
    
    const chunks = [];
    
    // Get summary
    const summaryResult = await getDataSummary(userId, startDate, endDate);
    if (summaryResult.success) {
      const summaryText = formatSummaryForRAG(summaryResult.summary);
      chunks.push({
        type: 'summary',
        content: summaryText,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    }
    
    // Get daily metrics
    if (includeDailyMetrics) {
      const dailyResult = await getDailyMetrics(userId, startDate, endDate);
      if (dailyResult.success && dailyResult.data.length > 0) {
        const dailyChunks = formatDailyMetricsForRAG(dailyResult.data, maxChunkSize);
        chunks.push(...dailyChunks);
      }
    }
    
    // Get events
    if (includeEvents) {
      const eventsResult = await getHealthEvents(userId, startDate, endDate, {
        includeMetrics: true,
      });
      if (eventsResult.success && eventsResult.data.length > 0) {
        const eventChunks = formatEventsForRAG(eventsResult.data, maxChunkSize);
        chunks.push(...eventChunks);
      }
    }
    
    return {
      success: true,
      chunks,
      totalChunks: chunks.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('[QueryService] Error in exportForRAG:', error);
    return { success: false, error: error.message, chunks: [] };
  }
}

// Helper functions

function aggregateTimeSeries(data, aggregation) {
  const buckets = {};
  
  data.forEach(point => {
    const date = new Date(point.recorded_at);
    let bucketKey;
    
    switch (aggregation) {
      case 'hourly':
        date.setMinutes(0, 0, 0);
        bucketKey = date.toISOString();
        break;
      case 'daily':
        bucketKey = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        bucketKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        bucketKey = point.recorded_at;
    }
    
    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        recorded_at: bucketKey,
        values: [],
        sources: new Set(),
      };
    }
    
    buckets[bucketKey].values.push(point.value);
    buckets[bucketKey].sources.add(point.source_app);
  });
  
  // Calculate aggregated values (average)
  return Object.values(buckets).map(bucket => ({
    recorded_at: bucket.recorded_at,
    value: bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length,
    count: bucket.values.length,
    sources: Array.from(bucket.sources),
  }));
}

function formatSummaryForRAG(summary) {
  let text = `Health Data Summary (${summary.dateRange.start} to ${summary.dateRange.end}):\n\n`;
  
  text += `Period: ${summary.dateRange.days} days\n\n`;
  
  if (Object.keys(summary.averages).length > 0) {
    text += 'Daily Averages:\n';
    Object.entries(summary.averages).forEach(([key, value]) => {
      const metadata = METRIC_METADATA[key];
      const displayName = metadata?.displayName || key;
      text += `- ${displayName}: ${value}\n`;
    });
    text += '\n';
  }
  
  if (Object.keys(summary.totals).length > 0) {
    text += 'Totals:\n';
    Object.entries(summary.totals).forEach(([key, value]) => {
      const metadata = METRIC_METADATA[key];
      const displayName = metadata?.displayName || key;
      text += `- ${displayName}: ${value}\n`;
    });
    text += '\n';
  }
  
  if (Object.keys(summary.events).length > 0) {
    text += 'Activities:\n';
    Object.entries(summary.events).forEach(([type, count]) => {
      text += `- ${type}: ${count} times\n`;
    });
  }
  
  return text;
}

function formatDailyMetricsForRAG(metrics, maxChunkSize) {
  const chunks = [];
  let currentChunk = '';
  
  metrics.forEach(day => {
    let dayText = `\nDate: ${day.date}\n`;
    
    // Activity
    if (day.steps) dayText += `Steps: ${day.steps}\n`;
    if (day.distance_km) dayText += `Distance: ${day.distance_km} km\n`;
    if (day.active_calories) dayText += `Active Calories: ${day.active_calories} kcal\n`;
    if (day.exercise_minutes) dayText += `Exercise: ${day.exercise_minutes} minutes\n`;
    
    // Heart
    if (day.avg_heart_rate) dayText += `Avg Heart Rate: ${day.avg_heart_rate} bpm\n`;
    if (day.resting_heart_rate) dayText += `Resting Heart Rate: ${day.resting_heart_rate} bpm\n`;
    
    // Sleep
    if (day.sleep_hours) dayText += `Sleep: ${day.sleep_hours} hours\n`;
    
    // Nutrition
    if (day.calories_consumed) dayText += `Calories Consumed: ${day.calories_consumed} kcal\n`;
    if (day.protein_g) dayText += `Protein: ${day.protein_g}g\n`;
    
    // Workouts
    if (day.workout_count) dayText += `Workouts: ${day.workout_count}\n`;
    
    if (currentChunk.length + dayText.length > maxChunkSize) {
      chunks.push({
        type: 'daily_metrics',
        content: currentChunk,
        metadata: { dataType: 'daily_summary' },
      });
      currentChunk = dayText;
    } else {
      currentChunk += dayText;
    }
  });
  
  if (currentChunk) {
    chunks.push({
      type: 'daily_metrics',
      content: currentChunk,
      metadata: { dataType: 'daily_summary' },
    });
  }
  
  return chunks;
}

function formatEventsForRAG(events, maxChunkSize) {
  const chunks = [];
  let currentChunk = '';
  
  events.forEach(event => {
    let eventText = `\n${event.event_type} - ${new Date(event.start_time).toLocaleString()}\n`;
    if (event.title) eventText += `Title: ${event.title}\n`;
    if (event.description) eventText += `Description: ${event.description}\n`;
    if (event.duration_seconds) eventText += `Duration: ${Math.round(event.duration_seconds / 60)} minutes\n`;
    if (event.metrics) eventText += `Details: ${JSON.stringify(event.metrics)}\n`;
    
    if (currentChunk.length + eventText.length > maxChunkSize) {
      chunks.push({
        type: 'health_events',
        content: currentChunk,
        metadata: { dataType: 'events' },
      });
      currentChunk = eventText;
    } else {
      currentChunk += eventText;
    }
  });
  
  if (currentChunk) {
    chunks.push({
      type: 'health_events',
      content: currentChunk,
      metadata: { dataType: 'events' },
    });
  }
  
  return chunks;
}

export default {
  getTimeSeriesData,
  getCorrelationData,
  getDailyMetrics,
  getHealthEvents,
  semanticSearch,
  getDataSummary,
  exportForRAG,
};

