/**
 * MyFitnessPal Integration Service
 * 
 * Integrates with MyFitnessPal API to sync nutrition data including:
 * - Meals (breakfast, lunch, dinner, snacks)
 * - Nutrition macros (calories, protein, carbs, fat)
 * - Micronutrients (fiber, sugar, sodium, etc.)
 * - Water intake
 * 
 * Note: MyFitnessPal API access requires partnership/premium access.
 * This implementation provides the structure for when API access is available.
 * Alternative: Use web scraping or manual CSV import as fallback.
 */

import { supabase } from '../../lib/supabase';
import {
  DATA_SOURCES,
  METRIC_TYPES,
  normalizeHealthData,
} from '../metricTypeRegistry';
import { runDeduplicationCheck } from '../dataDeduplicationService';

const DEBUG = __DEV__ && false;

// MyFitnessPal API configuration
// Note: Replace with actual API credentials when available
const MFP_API_CONFIG = {
  baseUrl: 'https://api.myfitnesspal.com/v2',
  clientId: process.env.MFP_CLIENT_ID || '',
  clientSecret: process.env.MFP_CLIENT_SECRET || '',
  redirectUri: 'youphoria://myfitnesspal/callback',
};

/**
 * Initialize OAuth flow for MyFitnessPal
 * 
 * @returns {Promise<string>} Authorization URL
 */
export async function initiateOAuth() {
  try {
    const authUrl = `${MFP_API_CONFIG.baseUrl}/oauth/authorize?` +
      `client_id=${MFP_API_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(MFP_API_CONFIG.redirectUri)}&` +
      `response_type=code&` +
      `scope=diary nutrition`;
    
    return { success: true, authUrl };
  } catch (error) {
    console.error('[MyFitnessPal] Error initiating OAuth:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Exchange authorization code for access token
 * 
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<object>} Access token and refresh token
 */
export async function exchangeCodeForToken(code) {
  try {
    const response = await fetch(`${MFP_API_CONFIG.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: MFP_API_CONFIG.clientId,
        client_secret: MFP_API_CONFIG.clientSecret,
        redirect_uri: MFP_API_CONFIG.redirectUri,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('[MyFitnessPal] Error exchanging code for token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save MyFitnessPal credentials to connected_apps
 * 
 * @param {string} userId - User ID
 * @param {object} tokens - Access and refresh tokens
 * @returns {Promise<object>} Result
 */
export async function saveCredentials(userId, tokens) {
  try {
    const { data, error } = await supabase
      .from('connected_apps')
      .upsert({
        user_id: userId,
        app_name: 'MyFitnessPal',
        app_type: 'nutrition',
        is_active: true,
        credentials: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
        },
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,app_name',
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('[MyFitnessPal] Error saving credentials:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get stored credentials for MyFitnessPal
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Credentials
 */
export async function getCredentials(userId) {
  try {
    const { data, error } = await supabase
      .from('connected_apps')
      .select('credentials')
      .eq('user_id', userId)
      .eq('app_name', 'MyFitnessPal')
      .eq('is_active', true)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data || !data.credentials) {
      return { success: false, error: 'No credentials found' };
    }
    
    // Check if token is expired and refresh if needed
    const expiresAt = new Date(data.credentials.expires_at);
    if (expiresAt < new Date()) {
      // Token expired, refresh it
      const refreshResult = await refreshAccessToken(userId, data.credentials.refresh_token);
      if (refreshResult.success) {
        return { success: true, credentials: refreshResult.credentials };
      }
    }
    
    return { success: true, credentials: data.credentials };
  } catch (error) {
    console.error('[MyFitnessPal] Error getting credentials:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Refresh access token
 * 
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object>} New credentials
 */
async function refreshAccessToken(userId, refreshToken) {
  try {
    const response = await fetch(`${MFP_API_CONFIG.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: MFP_API_CONFIG.clientId,
        client_secret: MFP_API_CONFIG.clientSecret,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save new tokens
    await saveCredentials(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    });
    
    return {
      success: true,
      credentials: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      },
    };
  } catch (error) {
    console.error('[MyFitnessPal] Error refreshing token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch diary entries (meals) for a date range
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Diary entries
 */
export async function fetchDiaryEntries(userId, startDate, endDate) {
  try {
    const credResult = await getCredentials(userId);
    if (!credResult.success) {
      return { success: false, error: credResult.error };
    }
    
    const { access_token } = credResult.credentials;
    
    // Fetch diary for each day in range
    const entries = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `${MFP_API_CONFIG.baseUrl}/diary?date=${dateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        entries.push({ date: dateStr, ...data });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { success: true, entries };
  } catch (error) {
    console.error('[MyFitnessPal] Error fetching diary entries:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync nutrition data to database
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<object>} Sync result
 */
export async function syncNutritionData(userId, startDate, endDate) {
  try {
    const diaryResult = await fetchDiaryEntries(userId, startDate, endDate);
    if (!diaryResult.success) {
      return { success: false, error: diaryResult.error };
    }
    
    const { entries } = diaryResult;
    
    if (!entries || entries.length === 0) {
      return { success: true, synced: 0 };
    }
    
    const healthDataRecords = [];
    const healthEvents = [];
    const syncedMetrics = new Set();
    
    // Process each day's diary
    for (const dayEntry of entries) {
      const date = new Date(dayEntry.date);
      
      // Extract daily totals
      const totals = dayEntry.totals || {};
      
      // Create health_data records for daily nutrition totals
      const nutritionMetrics = [
        { type: METRIC_TYPES.CALORIES_CONSUMED, value: totals.calories, unit: 'kcal' },
        { type: METRIC_TYPES.PROTEIN, value: totals.protein, unit: 'g' },
        { type: METRIC_TYPES.CARBOHYDRATES, value: totals.carbs, unit: 'g' },
        { type: METRIC_TYPES.FAT, value: totals.fat, unit: 'g' },
        { type: METRIC_TYPES.FIBER, value: totals.fiber, unit: 'g' },
        { type: METRIC_TYPES.SUGAR, value: totals.sugar, unit: 'g' },
        { type: METRIC_TYPES.SODIUM, value: totals.sodium, unit: 'mg' },
      ];
      
      nutritionMetrics.forEach(metric => {
        if (metric.value != null) {
          const normalized = normalizeHealthData({
            source: DATA_SOURCES.MYFITNESSPAL,
            appFieldName: metric.type,
            value: metric.value,
            unit: metric.unit,
            recordedAt: date.toISOString(),
            metadata: {
              daily_total: true,
            },
          });
          
          if (normalized) {
            normalized.user_id = userId;
            healthDataRecords.push(normalized);
            syncedMetrics.add(metric.type);
          }
        }
      });
      
      // Create health_events for individual meals
      const meals = dayEntry.meals || [];
      meals.forEach(meal => {
        const mealTime = new Date(date);
        // Estimate meal times based on meal type
        if (meal.name === 'Breakfast') mealTime.setHours(8, 0, 0);
        else if (meal.name === 'Lunch') mealTime.setHours(12, 0, 0);
        else if (meal.name === 'Dinner') mealTime.setHours(18, 0, 0);
        else if (meal.name === 'Snacks') mealTime.setHours(15, 0, 0);
        
        healthEvents.push({
          user_id: userId,
          event_type: 'meal',
          start_time: mealTime.toISOString(),
          end_time: mealTime.toISOString(),
          duration_seconds: 0,
          title: meal.name,
          description: `${meal.foods?.length || 0} food items`,
          metrics: {
            foods: meal.foods || [],
            nutrition: meal.totals || {},
          },
          source_app: DATA_SOURCES.MYFITNESSPAL,
          quality_score: 0.7, // Manual entry
        });
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
        console.error('[MyFitnessPal] Error inserting health_data:', dataError);
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
        console.error('[MyFitnessPal] Error inserting health_events:', eventsError);
      }
    }
    
    // Update last sync time
    await supabase
      .from('connected_apps')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('app_name', 'MyFitnessPal');
    
    // Run deduplication check
    await runDeduplicationCheck(userId, DATA_SOURCES.MYFITNESSPAL, Array.from(syncedMetrics));
    
    if (DEBUG) {
      console.log(`[MyFitnessPal] Synced ${dataInserted} data records and ${eventsInserted} meal events`);
    }
    
    return {
      success: true,
      dataRecords: dataInserted,
      mealEvents: eventsInserted,
    };
  } catch (error) {
    console.error('[MyFitnessPal] Error syncing nutrition data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync historical data (all available data)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Sync result
 */
export async function syncHistoricalData(userId) {
  try {
    // Sync last 365 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    
    console.log('[MyFitnessPal] Starting historical data sync (365 days)...');
    
    const result = await syncNutritionData(userId, startDate, endDate);
    
    if (result.success) {
      console.log('[MyFitnessPal] Historical sync complete');
    }
    
    return result;
  } catch (error) {
    console.error('[MyFitnessPal] Error in syncHistoricalData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect MyFitnessPal
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
      .eq('app_name', 'MyFitnessPal');
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('[MyFitnessPal] Error disconnecting:', error);
    return { success: false, error: error.message };
  }
}

export default {
  initiateOAuth,
  exchangeCodeForToken,
  saveCredentials,
  getCredentials,
  fetchDiaryEntries,
  syncNutritionData,
  syncHistoricalData,
  disconnect,
};

