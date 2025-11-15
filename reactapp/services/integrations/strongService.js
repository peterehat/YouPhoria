/**
 * Strong App Integration Service
 * 
 * Integrates with Strong workout tracking app to sync:
 * - Workout sessions
 * - Exercises with sets, reps, and weight
 * - Personal records and progress
 * - Training volume and intensity metrics
 * 
 * Note: Strong doesn't have a public API. This implementation provides
 * the structure for CSV import or potential future API access.
 * Alternative: Parse exported CSV files from Strong app.
 */

import { supabase } from '../../lib/supabase';
import {
  DATA_SOURCES,
  METRIC_TYPES,
  normalizeHealthData,
  UNIT_CONVERSIONS,
} from '../metricTypeRegistry';
import { runDeduplicationCheck } from '../dataDeduplicationService';

const DEBUG = __DEV__ && false;

/**
 * Parse Strong CSV export file
 * 
 * Strong allows users to export their workout data as CSV.
 * This function parses that CSV data.
 * 
 * @param {string} csvData - CSV file contents
 * @returns {Promise<object>} Parsed workouts
 */
export async function parseStrongCSV(csvData) {
  try {
    const lines = csvData.split('\n');
    if (lines.length < 2) {
      return { success: false, error: 'Invalid CSV data' };
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Expected headers: Date, Workout Name, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes
    const workouts = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      // Group by workout (date + workout name)
      const workoutKey = `${row['Date']}_${row['Workout Name']}`;
      
      if (!workouts[workoutKey]) {
        workouts[workoutKey] = {
          date: row['Date'],
          name: row['Workout Name'],
          notes: row['Workout Notes'],
          exercises: {},
        };
      }
      
      // Group exercises
      const exerciseName = row['Exercise Name'];
      if (!workouts[workoutKey].exercises[exerciseName]) {
        workouts[workoutKey].exercises[exerciseName] = {
          name: exerciseName,
          sets: [],
        };
      }
      
      // Add set
      workouts[workoutKey].exercises[exerciseName].sets.push({
        setOrder: parseInt(row['Set Order']) || 0,
        weight: parseFloat(row['Weight']) || 0,
        reps: parseInt(row['Reps']) || 0,
        distance: parseFloat(row['Distance']) || 0,
        seconds: parseInt(row['Seconds']) || 0,
        notes: row['Notes'],
      });
    }
    
    return {
      success: true,
      workouts: Object.values(workouts),
    };
  } catch (error) {
    console.error('[Strong] Error parsing CSV:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import workouts from Strong CSV
 * 
 * @param {string} userId - User ID
 * @param {string} csvData - CSV file contents
 * @returns {Promise<object>} Import result
 */
export async function importFromCSV(userId, csvData) {
  try {
    const parseResult = await parseStrongCSV(csvData);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }
    
    const { workouts } = parseResult;
    
    if (!workouts || workouts.length === 0) {
      return { success: true, imported: 0 };
    }
    
    const healthDataRecords = [];
    const healthEvents = [];
    const syncedMetrics = new Set();
    
    // Process each workout
    for (const workout of workouts) {
      const workoutDate = new Date(workout.date);
      
      // Calculate workout metrics
      const totalVolume = calculateTotalVolume(workout.exercises);
      const totalSets = calculateTotalSets(workout.exercises);
      const totalReps = calculateTotalReps(workout.exercises);
      const exerciseCount = Object.keys(workout.exercises).length;
      
      // Estimate workout duration (rough estimate: 3 minutes per set)
      const estimatedDuration = totalSets * 3 * 60; // seconds
      
      // Create health_event for the workout
      const event = {
        user_id: userId,
        event_type: 'strength_training',
        start_time: workoutDate.toISOString(),
        end_time: new Date(workoutDate.getTime() + estimatedDuration * 1000).toISOString(),
        duration_seconds: estimatedDuration,
        title: workout.name,
        description: workout.notes || `Strength training with ${exerciseCount} exercises`,
        metrics: {
          exercises: Object.values(workout.exercises),
          total_volume_lbs: totalVolume,
          total_sets: totalSets,
          total_reps: totalReps,
          exercise_count: exerciseCount,
        },
        source_app: DATA_SOURCES.STRONG,
        quality_score: 0.95,
      };
      
      healthEvents.push(event);
      
      // Create health_data records for aggregate metrics
      const metrics = [
        { type: METRIC_TYPES.TRAINING_VOLUME, value: totalVolume, unit: 'kg' },
        { type: METRIC_TYPES.SETS, value: totalSets, unit: 'sets' },
        { type: METRIC_TYPES.REPS, value: totalReps, unit: 'reps' },
      ];
      
      metrics.forEach(metric => {
        if (metric.value > 0) {
          const normalized = normalizeHealthData({
            source: DATA_SOURCES.STRONG,
            appFieldName: metric.type,
            value: metric.value,
            unit: metric.unit,
            recordedAt: workoutDate.toISOString(),
            metadata: {
              workout_name: workout.name,
              exercise_count: exerciseCount,
            },
          });
          
          if (normalized) {
            normalized.user_id = userId;
            healthDataRecords.push(normalized);
            syncedMetrics.add(metric.type);
          }
        }
      });
      
      // Create individual records for each exercise's max weight (for 1RM tracking)
      Object.values(workout.exercises).forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        if (maxWeight > 0) {
          const normalized = normalizeHealthData({
            source: DATA_SOURCES.STRONG,
            appFieldName: METRIC_TYPES.WEIGHT_LIFTED,
            value: maxWeight,
            unit: 'kg',
            recordedAt: workoutDate.toISOString(),
            metadata: {
              exercise_name: exercise.name,
              workout_name: workout.name,
            },
            description: `${exercise.name} - Max weight`,
          });
          
          if (normalized) {
            normalized.user_id = userId;
            healthDataRecords.push(normalized);
            syncedMetrics.add(METRIC_TYPES.WEIGHT_LIFTED);
          }
        }
      });
    }
    
    // Insert health_data records
    let dataInserted = 0;
    if (healthDataRecords.length > 0) {
      const { error: dataError } = await supabase
        .from('health_data')
        .upsert(healthDataRecords, {
          onConflict: 'user_id,data_type,recorded_at,source_app',
          ignoreDuplicates: true,
        });
      
      if (!dataError) {
        dataInserted = healthDataRecords.length;
      } else {
        console.error('[Strong] Error inserting health_data:', dataError);
      }
    }
    
    // Insert health_events
    let eventsInserted = 0;
    if (healthEvents.length > 0) {
      const { error: eventsError } = await supabase
        .from('health_events')
        .upsert(healthEvents, {
          onConflict: 'user_id,event_type,start_time',
          ignoreDuplicates: true,
        });
      
      if (!eventsError) {
        eventsInserted = healthEvents.length;
      } else {
        console.error('[Strong] Error inserting health_events:', eventsError);
      }
    }
    
    // Update connected_apps if exists, or create new entry
    const { data: existingApp } = await supabase
      .from('connected_apps')
      .select('id')
      .eq('user_id', userId)
      .eq('app_name', 'Strong')
      .single();
    
    if (existingApp) {
      await supabase
        .from('connected_apps')
        .update({ last_sync: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app_name', 'Strong');
    } else {
      await supabase
        .from('connected_apps')
        .insert({
          user_id: userId,
          app_name: 'Strong',
          app_type: 'workout',
          is_active: true,
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString(),
        });
    }
    
    // Run deduplication check
    await runDeduplicationCheck(userId, DATA_SOURCES.STRONG, Array.from(syncedMetrics));
    
    if (DEBUG) {
      console.log(`[Strong] Imported ${dataInserted} data records and ${eventsInserted} workout events`);
    }
    
    return {
      success: true,
      dataRecords: dataInserted,
      workoutEvents: eventsInserted,
      workoutsImported: workouts.length,
    };
  } catch (error) {
    console.error('[Strong] Error importing from CSV:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate progress metrics for a specific exercise
 * 
 * @param {string} userId - User ID
 * @param {string} exerciseName - Exercise name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Progress metrics
 */
export async function getExerciseProgress(userId, exerciseName, startDate, endDate) {
  try {
    // Fetch all workouts with this exercise
    const { data: events, error } = await supabase
      .from('health_events')
      .select('start_time, metrics')
      .eq('user_id', userId)
      .eq('event_type', 'strength_training')
      .eq('source_app', DATA_SOURCES.STRONG)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!events || events.length === 0) {
      return { success: true, progress: [] };
    }
    
    // Extract exercise data from each workout
    const progress = [];
    
    events.forEach(event => {
      const exercises = event.metrics?.exercises || {};
      const exercise = Object.values(exercises).find(ex => 
        ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
      
      if (exercise) {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight));
        const totalVolume = exercise.sets.reduce((sum, set) => 
          sum + (set.weight * set.reps), 0
        );
        const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
        
        progress.push({
          date: event.start_time,
          maxWeight,
          totalVolume,
          totalSets: exercise.sets.length,
          totalReps,
          sets: exercise.sets,
        });
      }
    });
    
    return {
      success: true,
      exerciseName,
      progress,
      firstWorkout: progress[0]?.date,
      lastWorkout: progress[progress.length - 1]?.date,
      totalWorkouts: progress.length,
    };
  } catch (error) {
    console.error('[Strong] Error getting exercise progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get workout summary statistics
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Workout statistics
 */
export async function getWorkoutStats(userId, startDate, endDate) {
  try {
    const { data: events, error } = await supabase
      .from('health_events')
      .select('start_time, duration_seconds, metrics')
      .eq('user_id', userId)
      .eq('event_type', 'strength_training')
      .eq('source_app', DATA_SOURCES.STRONG)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());
    
    if (error) {
      throw error;
    }
    
    if (!events || events.length === 0) {
      return {
        success: true,
        stats: {
          totalWorkouts: 0,
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
          averageWorkoutDuration: 0,
        },
      };
    }
    
    const stats = {
      totalWorkouts: events.length,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      totalDuration: 0,
      uniqueExercises: new Set(),
    };
    
    events.forEach(event => {
      stats.totalVolume += event.metrics?.total_volume_lbs || 0;
      stats.totalSets += event.metrics?.total_sets || 0;
      stats.totalReps += event.metrics?.total_reps || 0;
      stats.totalDuration += event.duration_seconds || 0;
      
      const exercises = event.metrics?.exercises || {};
      Object.keys(exercises).forEach(name => stats.uniqueExercises.add(name));
    });
    
    stats.averageWorkoutDuration = Math.round(stats.totalDuration / events.length / 60); // minutes
    stats.uniqueExercises = stats.uniqueExercises.size;
    
    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('[Strong] Error getting workout stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect Strong
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Result
 */
export async function disconnect(userId) {
  try {
    const { error } = await supabase
      .from('connected_apps')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('app_name', 'Strong');
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Strong] Error disconnecting:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

function calculateTotalVolume(exercises) {
  let total = 0;
  Object.values(exercises).forEach(exercise => {
    exercise.sets.forEach(set => {
      total += (set.weight || 0) * (set.reps || 0);
    });
  });
  return total;
}

function calculateTotalSets(exercises) {
  let total = 0;
  Object.values(exercises).forEach(exercise => {
    total += exercise.sets.length;
  });
  return total;
}

function calculateTotalReps(exercises) {
  let total = 0;
  Object.values(exercises).forEach(exercise => {
    exercise.sets.forEach(set => {
      total += set.reps || 0;
    });
  });
  return total;
}

export default {
  parseStrongCSV,
  importFromCSV,
  getExerciseProgress,
  getWorkoutStats,
  disconnect,
};

