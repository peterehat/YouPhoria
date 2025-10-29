import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
    const { user } = get();
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
    const { user } = get();
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
    const { user } = get();
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
    const { user } = get();
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
    const { user } = get();
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
    const { user } = get();
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
}));

export default useAppStore;
