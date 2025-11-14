import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import healthDataQueryService from '../services/healthDataQueryService';
import historicalSyncService from '../services/historicalSyncService';
import { getCanonicalData } from '../services/dataDeduplicationService';
import useAuthStore from './authStore';

const useAppStore = create((set, get) => ({
  // State
  connectedApps: [],
  connectedDevices: [],
  healthData: [],
  loading: {
    apps: false,
    devices: false,
    healthData: false,
  },
  error: null,

  // Actions
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (key, loading) => set((state) => ({
    loading: { ...state.loading, [key]: loading }
  })),

  // Connected Apps
  fetchConnectedApps: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => ({ loading: { ...state.loading, apps: true } }));
    try {
      const { data, error } = await supabase
        .from('connected_apps')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;

      set({ connectedApps: data || [] });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, apps: false } }));
    }
  },

  addConnectedApp: async (appData) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('connected_apps')
        .insert({
          user_id: user.id,
          app_name: appData.appName,
          app_type: appData.appType,
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString(),
          is_active: true,
          credentials: appData.credentials || null,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        connectedApps: [data, ...state.connectedApps]
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  updateConnectedApp: async (appId, updates) => {
    try {
      const { data, error } = await supabase
        .from('connected_apps')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        connectedApps: state.connectedApps.map(app =>
          app.id === appId ? data : app
        )
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  removeConnectedApp: async (appId) => {
    try {
      const { error } = await supabase
        .from('connected_apps')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      set((state) => ({
        connectedApps: state.connectedApps.filter(app => app.id !== appId)
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Connected Devices
  fetchConnectedDevices: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => ({ loading: { ...state.loading, devices: true } }));
    try {
      const { data, error } = await supabase
        .from('connected_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;

      set({ connectedDevices: data || [] });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, devices: false } }));
    }
  },

  addConnectedDevice: async (deviceData) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('connected_devices')
        .insert({
          user_id: user.id,
          device_name: deviceData.deviceName,
          device_type: deviceData.deviceType,
          connected_at: new Date().toISOString(),
          last_sync: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        connectedDevices: [data, ...state.connectedDevices]
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  updateConnectedDevice: async (deviceId, updates) => {
    try {
      const { data, error } = await supabase
        .from('connected_devices')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        connectedDevices: state.connectedDevices.map(device =>
          device.id === deviceId ? data : device
        )
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  removeConnectedDevice: async (deviceId) => {
    try {
      const { error } = await supabase
        .from('connected_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      set((state) => ({
        connectedDevices: state.connectedDevices.filter(device => device.id !== deviceId)
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Health Data
  fetchHealthData: async (filters = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => ({ loading: { ...state.loading, healthData: true } }));
    try {
      let query = supabase
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (filters.dataType) {
        query = query.eq('data_type', filters.dataType);
      }
      if (filters.dateFrom) {
        query = query.gte('recorded_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('recorded_at', filters.dateTo);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ healthData: data || [] });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, healthData: false } }));
    }
  },

  addHealthData: async (healthDataArray) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const dataToInsert = healthDataArray.map(data => ({
        user_id: user.id,
        data_type: data.dataType,
        value: data.value,
        unit: data.unit,
        recorded_at: data.recordedAt || new Date().toISOString(),
        source_app: data.sourceApp || null,
        source_device: data.sourceDevice || null,
      }));

      const { data, error } = await supabase
        .from('health_data')
        .insert(dataToInsert)
        .select();

      if (error) throw error;

      set((state) => ({
        healthData: [...data, ...state.healthData]
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Sync data from connected sources
  syncAllData: async () => {
    const { fetchConnectedApps, fetchConnectedDevices, fetchHealthData } = get();
    
    await Promise.all([
      fetchConnectedApps(),
      fetchConnectedDevices(),
      fetchHealthData(),
    ]);
  },

  // Clear all data (useful for logout)
  clearAllData: () => {
    set({
      connectedApps: [],
      connectedDevices: [],
      healthData: [],
      error: null,
    });
  },

  // ===== HEALTH METRICS METHODS =====

  // Sync health metrics to Supabase
  syncHealthMetrics: async (metricsArray) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('health_metrics_daily')
        .upsert(metricsArray.map(metric => ({
          user_id: user.id,
          ...metric,
        })), {
          onConflict: 'user_id,date',
        })
        .select();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Fetch health metrics from Supabase
  fetchHealthMetrics: async (startDate, endDate) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    set((state) => ({ loading: { ...state.loading, healthData: true } }));
    try {
      let query = supabase
        .from('health_metrics_daily')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set((state) => ({ loading: { ...state.loading, healthData: false } }));
    }
  },

  // Get Apple Health connection status
  getAppleHealthConnection: () => {
    const { connectedApps } = get();
    return connectedApps.find(app => app.app_name === 'Apple Health');
  },

  // Update last sync timestamp for an app
  updateLastSync: async (appId) => {
    try {
      const { data, error } = await supabase
        .from('connected_apps')
        .update({
          last_sync: new Date().toISOString(),
          sync_status: 'completed',
        })
        .eq('id', appId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        connectedApps: state.connectedApps.map(app =>
          app.id === appId ? data : app
        )
      }));

      return { success: true, data };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // ===== NEW QUERY SERVICE METHODS =====

  // Get time-series data for a metric
  getTimeSeriesData: async (metricType, startDate, endDate, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.getTimeSeriesData(
      user.id,
      metricType,
      startDate,
      endDate,
      options
    );
  },

  // Get correlation data for multiple metrics
  getCorrelationData: async (metricTypes, startDate, endDate, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.getCorrelationData(
      user.id,
      metricTypes,
      startDate,
      endDate,
      options
    );
  },

  // Get daily aggregated metrics
  getDailyMetrics: async (startDate, endDate, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.getDailyMetrics(
      user.id,
      startDate,
      endDate,
      options
    );
  },

  // Get health events (workouts, meals, etc.)
  getHealthEvents: async (startDate, endDate, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.getHealthEvents(
      user.id,
      startDate,
      endDate,
      options
    );
  },

  // Semantic search across health data
  searchHealthData: async (searchQuery, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.semanticSearch(
      user.id,
      searchQuery,
      options
    );
  },

  // Get data summary for AI context
  getDataSummary: async (startDate, endDate) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.getDataSummary(
      user.id,
      startDate,
      endDate
    );
  },

  // Export data for RAG/AI analysis
  exportForRAG: async (startDate, endDate, options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await healthDataQueryService.exportForRAG(
      user.id,
      startDate,
      endDate,
      options
    );
  },

  // Get canonical data (deduplicated)
  getCanonicalHealthData: async (filters = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await getCanonicalData(user.id, filters);
  },

  // ===== HISTORICAL SYNC METHODS =====

  // Sync historical data for all connected apps
  syncHistoricalData: async (options = {}) => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    set((state) => ({ loading: { ...state.loading, apps: true } }));
    try {
      const result = await historicalSyncService.syncAllHistoricalData(user.id, options);
      
      // Refresh connected apps to update sync status
      await get().fetchConnectedApps();
      
      return result;
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    } finally {
      set((state) => ({ loading: { ...state.loading, apps: false } }));
    }
  },

  // Get sync status for all apps
  getSyncStatus: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await historicalSyncService.getSyncStatus(user.id);
  },

  // Schedule background sync
  scheduleBackgroundSync: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await historicalSyncService.scheduleBackgroundSync(user.id);
  },

  // Estimate sync time
  estimateSyncTime: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'User not authenticated' };

    return await historicalSyncService.estimateSyncTime(user.id);
  },
}));

export default useAppStore;
