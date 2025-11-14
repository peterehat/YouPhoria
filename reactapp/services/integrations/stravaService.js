/**
 * Strava Integration Service
 * 
 * Integrates with Strava API to sync athletic activities including:
 * - Runs, rides, swims, and other activities
 * - Route data (GPS coordinates, elevation)
 * - Activity metrics (distance, pace, heart rate, power)
 * - Segment performance
 * - Achievements and personal records
 */

import { supabase } from '../../lib/supabase';
import {
  DATA_SOURCES,
  METRIC_TYPES,
  normalizeHealthData,
} from '../metricTypeRegistry';
import { runDeduplicationCheck } from '../dataDeduplicationService';

const DEBUG = __DEV__ && false;

// Strava API configuration
const STRAVA_API_CONFIG = {
  baseUrl: 'https://www.strava.com/api/v3',
  authUrl: 'https://www.strava.com/oauth/authorize',
  tokenUrl: 'https://www.strava.com/oauth/token',
  clientId: process.env.STRAVA_CLIENT_ID || '',
  clientSecret: process.env.STRAVA_CLIENT_SECRET || '',
  redirectUri: 'youphoria://strava/callback',
};

/**
 * Initialize OAuth flow for Strava
 * 
 * @returns {Promise<object>} Authorization URL
 */
export async function initiateOAuth() {
  try {
    const authUrl = `${STRAVA_API_CONFIG.authUrl}?` +
      `client_id=${STRAVA_API_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(STRAVA_API_CONFIG.redirectUri)}&` +
      `response_type=code&` +
      `scope=read,activity:read_all,profile:read_all&` +
      `approval_prompt=auto`;
    
    return { success: true, authUrl };
  } catch (error) {
    console.error('[Strava] Error initiating OAuth:', error);
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
    const response = await fetch(STRAVA_API_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_API_CONFIG.clientId,
        client_secret: STRAVA_API_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
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
      expiresAt: data.expires_at,
      athlete: data.athlete,
    };
  } catch (error) {
    console.error('[Strava] Error exchanging code for token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save Strava credentials to connected_apps
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
        app_name: 'Strava',
        app_type: 'fitness',
        is_active: true,
        credentials: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: new Date(tokens.expiresAt * 1000).toISOString(),
          athlete_id: tokens.athlete?.id,
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
    console.error('[Strava] Error saving credentials:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get stored credentials for Strava
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
      .eq('app_name', 'Strava')
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
    console.error('[Strava] Error getting credentials:', error);
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
    const response = await fetch(STRAVA_API_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: STRAVA_API_CONFIG.clientId,
        client_secret: STRAVA_API_CONFIG.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
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
      expiresAt: data.expires_at,
    });
    
    return {
      success: true,
      credentials: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
      },
    };
  } catch (error) {
    console.error('[Strava] Error refreshing token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch activities from Strava
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date (optional)
 * @param {number} page - Page number for pagination
 * @param {number} perPage - Items per page
 * @returns {Promise<object>} Activities
 */
export async function fetchActivities(userId, startDate = null, page = 1, perPage = 200) {
  try {
    const credResult = await getCredentials(userId);
    if (!credResult.success) {
      return { success: false, error: credResult.error };
    }
    
    const { access_token } = credResult.credentials;
    
    let url = `${STRAVA_API_CONFIG.baseUrl}/athlete/activities?page=${page}&per_page=${perPage}`;
    
    if (startDate) {
      const timestamp = Math.floor(startDate.getTime() / 1000);
      url += `&after=${timestamp}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    
    const activities = await response.json();
    
    return { success: true, activities };
  } catch (error) {
    console.error('[Strava] Error fetching activities:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch detailed activity data including streams (GPS, heart rate, etc.)
 * 
 * @param {string} userId - User ID
 * @param {string} activityId - Strava activity ID
 * @returns {Promise<object>} Detailed activity data
 */
export async function fetchActivityDetails(userId, activityId) {
  try {
    const credResult = await getCredentials(userId);
    if (!credResult.success) {
      return { success: false, error: credResult.error };
    }
    
    const { access_token } = credResult.credentials;
    
    // Fetch activity details
    const activityResponse = await fetch(
      `${STRAVA_API_CONFIG.baseUrl}/activities/${activityId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    
    if (!activityResponse.ok) {
      throw new Error(`Failed to fetch activity details: ${activityResponse.status}`);
    }
    
    const activity = await activityResponse.json();
    
    // Fetch activity streams (GPS, heart rate, etc.)
    const streamsResponse = await fetch(
      `${STRAVA_API_CONFIG.baseUrl}/activities/${activityId}/streams?keys=latlng,time,heartrate,distance,altitude,velocity_smooth&key_by_type=true`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    
    let streams = null;
    if (streamsResponse.ok) {
      streams = await streamsResponse.json();
    }
    
    return {
      success: true,
      activity,
      streams,
    };
  } catch (error) {
    console.error('[Strava] Error fetching activity details:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync activities to database
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date (optional, defaults to 30 days ago)
 * @returns {Promise<object>} Sync result
 */
export async function syncActivities(userId, startDate = null) {
  try {
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const activitiesResult = await fetchActivities(userId, startDate);
    if (!activitiesResult.success) {
      return { success: false, error: activitiesResult.error };
    }
    
    const { activities } = activitiesResult;
    
    if (!activities || activities.length === 0) {
      return { success: true, synced: 0 };
    }
    
    const healthDataRecords = [];
    const healthEvents = [];
    const syncedMetrics = new Set();
    
    // Process each activity
    for (const activity of activities) {
      const startTime = new Date(activity.start_date);
      
      // Create health_event for the activity
      const event = {
        user_id: userId,
        event_type: mapActivityType(activity.type),
        start_time: activity.start_date,
        end_time: new Date(startTime.getTime() + activity.elapsed_time * 1000).toISOString(),
        duration_seconds: activity.moving_time,
        title: activity.name,
        description: activity.description || `${activity.type} activity`,
        metrics: {
          distance: activity.distance,
          elevation_gain: activity.total_elevation_gain,
          average_speed: activity.average_speed,
          max_speed: activity.max_speed,
          average_heartrate: activity.average_heartrate,
          max_heartrate: activity.max_heartrate,
          calories: activity.calories,
          achievement_count: activity.achievement_count,
          kudos_count: activity.kudos_count,
          suffer_score: activity.suffer_score,
        },
        source_app: DATA_SOURCES.STRAVA,
        quality_score: 0.95,
      };
      
      // Add location if available
      if (activity.start_latlng && activity.start_latlng.length === 2) {
        event.location = {
          start_lat: activity.start_latlng[0],
          start_lng: activity.start_latlng[1],
          end_lat: activity.end_latlng?.[0],
          end_lng: activity.end_latlng?.[1],
        };
      }
      
      healthEvents.push(event);
      
      // Extract metrics for health_data
      const metrics = [
        { type: METRIC_TYPES.DISTANCE, value: activity.distance, unit: 'm' },
        { type: METRIC_TYPES.ACTIVE_CALORIES, value: activity.calories, unit: 'kcal' },
        { type: METRIC_TYPES.ACTIVE_MINUTES, value: Math.round(activity.moving_time / 60), unit: 'min' },
        { type: METRIC_TYPES.ELEVATION_GAIN, value: activity.total_elevation_gain, unit: 'm' },
      ];
      
      if (activity.average_heartrate) {
        metrics.push({ type: METRIC_TYPES.HEART_RATE, value: activity.average_heartrate, unit: 'bpm' });
      }
      
      metrics.forEach(metric => {
        if (metric.value != null) {
          const normalized = normalizeHealthData({
            source: DATA_SOURCES.STRAVA,
            appFieldName: metric.type,
            value: metric.value,
            unit: metric.unit,
            recordedAt: activity.start_date,
            metadata: {
              activity_id: activity.id,
              activity_type: activity.type,
              activity_name: activity.name,
            },
          });
          
          if (normalized) {
            normalized.user_id = userId;
            healthDataRecords.push(normalized);
            syncedMetrics.add(metric.type);
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
        console.error('[Strava] Error inserting health_data:', dataError);
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
        console.error('[Strava] Error inserting health_events:', eventsError);
      }
    }
    
    // Update last sync time
    await supabase
      .from('connected_apps')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('app_name', 'Strava');
    
    // Run deduplication check
    await runDeduplicationCheck(userId, DATA_SOURCES.STRAVA, Array.from(syncedMetrics));
    
    if (DEBUG) {
      console.log(`[Strava] Synced ${dataInserted} data records and ${eventsInserted} activity events`);
    }
    
    return {
      success: true,
      dataRecords: dataInserted,
      activityEvents: eventsInserted,
    };
  } catch (error) {
    console.error('[Strava] Error syncing activities:', error);
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
    // Sync all activities (Strava API will return up to 200 per page)
    // We'll fetch multiple pages if needed
    console.log('[Strava] Starting historical data sync...');
    
    let page = 1;
    let totalSynced = 0;
    let hasMore = true;
    
    while (hasMore && page <= 10) { // Limit to 10 pages (2000 activities)
      const activitiesResult = await fetchActivities(userId, null, page, 200);
      
      if (!activitiesResult.success || !activitiesResult.activities || activitiesResult.activities.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process this page of activities
      const syncResult = await syncActivities(userId, null);
      if (syncResult.success) {
        totalSynced += (syncResult.activityEvents || 0);
      }
      
      if (activitiesResult.activities.length < 200) {
        hasMore = false;
      }
      
      page++;
    }
    
    console.log(`[Strava] Historical sync complete: ${totalSynced} activities`);
    
    return {
      success: true,
      totalActivities: totalSynced,
    };
  } catch (error) {
    console.error('[Strava] Error in syncHistoricalData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect Strava
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
      .eq('app_name', 'Strava');
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('[Strava] Error disconnecting:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions

function mapActivityType(stravaType) {
  const typeMap = {
    'Run': 'run',
    'Ride': 'bike_ride',
    'Swim': 'swim',
    'Walk': 'walk',
    'Hike': 'hike',
    'WeightTraining': 'strength_training',
    'Workout': 'workout',
    'Yoga': 'yoga',
  };
  
  return typeMap[stravaType] || 'workout';
}

export default {
  initiateOAuth,
  exchangeCodeForToken,
  saveCredentials,
  getCredentials,
  fetchActivities,
  fetchActivityDetails,
  syncActivities,
  syncHistoricalData,
  disconnect,
};

