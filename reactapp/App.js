import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProtectedApp from './components/ProtectedApp';
import useAuthStore from './store/authStore';
import useAppStore from './store/appStore';
import HealthKitService from './services/healthKitService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { isAuthenticated, loading, initialize, needsOnboarding, onboardingChecked, completeOnboarding, startOnboarding } = useAuthStore();
  const { syncAllData } = useAppStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      syncAllData();
      
      // Sync Apple Health data if connected
      syncAppleHealthData();
    }
  }, [isAuthenticated]);

  // Sync Apple Health data on app launch
  const syncAppleHealthData = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // Check if Apple Health is connected
      const isConnected = await HealthKitService.loadConnectionState();
      const isAuthorized = await HealthKitService.getAuthorizationStatus();

      if (!isConnected || !isAuthorized) {
        return;
      }

      // Check if we need to sync (last sync > 1 hour ago)
      const lastSync = await HealthKitService.getLastSyncTime();
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (!lastSync || lastSync < oneHourAgo) {
        console.log('[App] Syncing Apple Health data...');
        
        // Sync last 7 days of data
        const result = await HealthKitService.syncHealthData(7);
        
        if (result.success) {
          console.log(`[App] Apple Health sync complete: ${result.synced} days synced`);
        } else {
          console.error('[App] Apple Health sync failed:', result.error);
        }
      } else {
        console.log('[App] Apple Health data is up to date');
      }
    } catch (error) {
      console.error('[App] Error syncing Apple Health data:', error);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !loading && onboardingChecked) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, loading, onboardingChecked]);

  if (!appIsReady || loading || (isAuthenticated && !onboardingChecked)) {
    return null;
  }

  const handleOnboardingComplete = () => {
    completeOnboarding();
    syncAllData();
  };

  const handleOnboardingClose = () => {
    // If user closes onboarding without completing, just go back to app
    completeOnboarding();
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      {!isAuthenticated ? (
        <AuthScreen />
      ) : needsOnboarding ? (
        <OnboardingScreen 
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
        />
      ) : (
        <ProtectedApp />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});