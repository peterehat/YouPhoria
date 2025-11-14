/**
 * Historical Data Sync Service
 * 
 * Coordinates historical data synchronization across all connected integrations.
 * Ensures all available historical data is backfilled into the database for AI analysis.
 */

import { supabase } from '../lib/supabase';
import appleHealthService from './integrations/appleHealthService';
import myFitnessPalService from './integrations/myFitnessPalService';
import stravaService from './integrations/stravaService';
import strongService from './integrations/strongService';

const DEBUG = __DEV__ && false;

/**
 * Get all connected apps for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Connected apps
 */
export async function getConnectedApps(userId) {
  try {
    const { data, error } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    return { success: true, apps: data || [] };
  } catch (error) {
    console.error('[HistoricalSync] Error getting connected apps:', error);
    return { success: false, error: error.message, apps: [] };
  }
}

/**
 * Sync historical data for a specific app
 * 
 * @param {string} userId - User ID
 * @param {string} appName - App name
 * @returns {Promise<object>} Sync result
 */
export async function syncAppHistoricalData(userId, appName) {
  try {
    console.log(`[HistoricalSync] Starting historical sync for ${appName}...`);
    
    let result;
    
    switch (appName) {
      case 'Apple Health':
        result = await appleHealthService.syncHistoricalData();
        break;
        
      case 'MyFitnessPal':
        result = await myFitnessPalService.syncHistoricalData(userId);
        break;
        
      case 'Strava':
        result = await stravaService.syncHistoricalData(userId);
        break;
        
      case 'Strong':
        // Strong requires manual CSV import, so we skip automatic historical sync
        console.log('[HistoricalSync] Strong requires manual CSV import');
        result = { success: true, message: 'Manual import required' };
        break;
        
      default:
        console.warn(`[HistoricalSync] Unknown app: ${appName}`);
        result = { success: false, error: 'Unknown app' };
    }
    
    // Update sync status in connected_apps
    if (result.success) {
      await supabase
        .from('connected_apps')
        .update({
          last_sync: new Date().toISOString(),
          sync_status: 'completed',
        })
        .eq('user_id', userId)
        .eq('app_name', appName);
    } else {
      await supabase
        .from('connected_apps')
        .update({
          sync_status: 'failed',
        })
        .eq('user_id', userId)
        .eq('app_name', appName);
    }
    
    return result;
  } catch (error) {
    console.error(`[HistoricalSync] Error syncing ${appName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync historical data for all connected apps
 * 
 * @param {string} userId - User ID
 * @param {object} options - Sync options
 * @returns {Promise<object>} Sync results
 */
export async function syncAllHistoricalData(userId, options = {}) {
  try {
    const {
      parallel = false, // Whether to sync apps in parallel or sequentially
      appsToSync = null, // Specific apps to sync (null = all)
    } = options;
    
    console.log('[HistoricalSync] Starting historical sync for all connected apps...');
    
    // Get connected apps
    const appsResult = await getConnectedApps(userId);
    if (!appsResult.success) {
      return { success: false, error: appsResult.error };
    }
    
    let apps = appsResult.apps;
    
    // Filter to specific apps if requested
    if (appsToSync && appsToSync.length > 0) {
      apps = apps.filter(app => appsToSync.includes(app.app_name));
    }
    
    if (apps.length === 0) {
      return {
        success: true,
        message: 'No connected apps to sync',
        results: [],
      };
    }
    
    const results = [];
    
    if (parallel) {
      // Sync all apps in parallel
      const syncPromises = apps.map(app => 
        syncAppHistoricalData(userId, app.app_name)
          .then(result => ({ app: app.app_name, ...result }))
      );
      
      const settledResults = await Promise.allSettled(syncPromises);
      
      settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            app: 'unknown',
            success: false,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    } else {
      // Sync apps sequentially
      for (const app of apps) {
        const result = await syncAppHistoricalData(userId, app.app_name);
        results.push({
          app: app.app_name,
          ...result,
        });
      }
    }
    
    // Calculate summary
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log(`[HistoricalSync] Complete: ${successCount} succeeded, ${failedCount} failed`);
    
    return {
      success: true,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failedCount,
      },
    };
  } catch (error) {
    console.error('[HistoricalSync] Error in syncAllHistoricalData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check sync status for all connected apps
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Sync status
 */
export async function getSyncStatus(userId) {
  try {
    const { data, error } = await supabase
      .from('connected_apps')
      .select('app_name, last_sync, sync_status, connected_at')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    const status = (data || []).map(app => ({
      app: app.app_name,
      lastSync: app.last_sync,
      status: app.sync_status || 'pending',
      connectedAt: app.connected_at,
      needsSync: !app.last_sync || app.sync_status === 'failed',
    }));
    
    return {
      success: true,
      status,
      needsSyncCount: status.filter(s => s.needsSync).length,
    };
  } catch (error) {
    console.error('[HistoricalSync] Error getting sync status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Estimate time required for historical sync
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Time estimate
 */
export async function estimateSyncTime(userId) {
  try {
    const appsResult = await getConnectedApps(userId);
    if (!appsResult.success) {
      return { success: false, error: appsResult.error };
    }
    
    // Rough estimates (in seconds)
    const timeEstimates = {
      'Apple Health': 120, // 2 minutes for 365 days
      'MyFitnessPal': 180, // 3 minutes for 365 days
      'Strava': 60, // 1 minute (depends on activity count)
      'Strong': 30, // 30 seconds (CSV import)
    };
    
    let totalEstimate = 0;
    const estimates = [];
    
    appsResult.apps.forEach(app => {
      const estimate = timeEstimates[app.app_name] || 60;
      totalEstimate += estimate;
      estimates.push({
        app: app.app_name,
        estimatedSeconds: estimate,
        estimatedMinutes: Math.round(estimate / 60),
      });
    });
    
    return {
      success: true,
      totalSeconds: totalEstimate,
      totalMinutes: Math.round(totalEstimate / 60),
      byApp: estimates,
    };
  } catch (error) {
    console.error('[HistoricalSync] Error estimating sync time:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule background sync for all apps
 * 
 * This can be called periodically to keep data up to date
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} Sync result
 */
export async function scheduleBackgroundSync(userId) {
  try {
    console.log('[HistoricalSync] Starting background sync...');
    
    // Sync last 7 days for all apps (incremental sync)
    const appsResult = await getConnectedApps(userId);
    if (!appsResult.success) {
      return { success: false, error: appsResult.error };
    }
    
    const results = [];
    
    for (const app of appsResult.apps) {
      let result;
      
      switch (app.app_name) {
        case 'Apple Health':
          result = await appleHealthService.syncAllHealthData(7);
          break;
          
        case 'MyFitnessPal':
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          result = await myFitnessPalService.syncNutritionData(userId, startDate, endDate);
          break;
          
        case 'Strava':
          const stravaStart = new Date();
          stravaStart.setDate(stravaStart.getDate() - 7);
          result = await stravaService.syncActivities(userId, stravaStart);
          break;
          
        default:
          result = { success: true, message: 'No background sync needed' };
      }
      
      results.push({
        app: app.app_name,
        ...result,
      });
      
      // Update last sync time
      if (result.success) {
        await supabase
          .from('connected_apps')
          .update({ last_sync: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('app_name', app.app_name);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[HistoricalSync] Background sync complete: ${successCount}/${results.length} succeeded`);
    
    return {
      success: true,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
      },
    };
  } catch (error) {
    console.error('[HistoricalSync] Error in scheduleBackgroundSync:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getConnectedApps,
  syncAppHistoricalData,
  syncAllHistoricalData,
  getSyncStatus,
  estimateSyncTime,
  scheduleBackgroundSync,
};

