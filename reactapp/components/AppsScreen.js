import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
  Image,
  NativeModules,
  Modal,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Background from './Background';
import Constants from 'expo-constants';
import HealthKitService from '../services/healthKitService';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';

// Toggle verbose HealthKit logging here (independent flag for this screen)
const DEBUG_HEALTHKIT = __DEV__ && false;

// Debug: Log native module availability (dev-only)
if (DEBUG_HEALTHKIT) {
  console.log('AppsScreen - NativeModules.AppleHealthKit:', NativeModules.AppleHealthKit);
}

export default function AppsScreen() {
  // Get user from auth store
  const user = useAuthStore((state) => state.user);
  
  // Get app store methods
  const addConnectedApp = useAppStore((state) => state.addConnectedApp);
  const removeConnectedApp = useAppStore((state) => state.removeConnectedApp);
  const connectedApps = useAppStore((state) => state.connectedApps);
  
  // Simple state management without Zustand
  const [connections, setConnections] = useState({
    appleHealth: false,
    myFitnessPal: false,
    strong: false,
    strava: false,
    fitbit: false,
  });
  
  const [healthKitAuthorized, setHealthKitAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Animation for modal slide up
  const slideAnim = useRef(new Animated.Value(1000)).current;

  // Check if running in Expo Go (which doesn't support HealthKit)
  const isExpoGo = Constants.appOwnership === 'expo';
  // Background handled by shared Background component


  // Check authorization status on mount
  useEffect(() => {
    const checkAppleHealthConnection = async () => {
      if (Platform.OS !== 'ios' || isExpoGo) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Check cached connection state (user-scoped)
        const cachedState = await HealthKitService.loadConnectionState();
        
        // Verify with actual HealthKit authorization (device-wide)
        const isAuthorized = await HealthKitService.getAuthorizationStatus();
        
        if (DEBUG_HEALTHKIT) {
          console.log('AppsScreen - Cached state:', cachedState);
          console.log('AppsScreen - Authorized:', isAuthorized);
        }

        // Only restore connection if BOTH cached state AND device authorization are true
        // This prevents showing "connected" for a new user just because a previous user granted permissions
        if (cachedState && isAuthorized) {
          // Restore connection state
          setConnections(prev => ({ ...prev, appleHealth: true }));
          setHealthKitAuthorized(true);
          
          // Get last sync time
          const lastSync = await HealthKitService.getLastSyncTime();
          setLastSyncTime(lastSync);
          
          if (DEBUG_HEALTHKIT) {
            console.log('AppsScreen - Apple Health connection restored');
          }
        } else if (cachedState && !isAuthorized) {
          // Cached state says connected but HealthKit says not authorized
          // User may have revoked permissions in Settings
          await HealthKitService.saveConnectionState(false);
          setConnections(prev => ({ ...prev, appleHealth: false }));
          setHealthKitAuthorized(false);
        } else {
          // Either no cached state or not authorized - ensure disconnected
          setConnections(prev => ({ ...prev, appleHealth: false }));
          setHealthKitAuthorized(false);
        }
      } catch (error) {
        console.error('AppsScreen - Error checking Apple Health connection:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAppleHealthConnection();
  }, [isExpoGo]);

  // Animate modal when it opens/closes
  useEffect(() => {
    if (showDataModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showDataModal, slideAnim]);

  // Helper functions to replace Zustand store methods
  const connectApp = (appId) => {
    setConnections(prev => ({
      ...prev,
      [appId]: true,
    }));
  };

  const disconnectApp = (appId) => {
    setConnections(prev => ({
      ...prev,
      [appId]: false,
    }));
  };

  // App configurations
  const apps = [
    {
      id: 'appleHealth',
      name: 'Apple Health',
      description: isExpoGo 
        ? 'Requires custom development build for HealthKit access'
        : 'Connect to HealthKit for comprehensive health data',
      icon: <Image source={require('../assets/appicons/health-app.png')} style={styles.appIconImage} />,
      isAvailable: Platform.OS === 'ios' && !isExpoGo,
      isConnected: connections.appleHealth,
    },
    {
      id: 'myFitnessPal',
      name: 'MyFitnessPal',
      description: 'Track nutrition and calorie intake',
      icon: <Image source={require('../assets/appicons/myfitnesspal-app.jpg')} style={styles.appIconImage} />,
      isAvailable: true,
      isConnected: connections.myFitnessPal,
    },
    {
      id: 'strong',
      name: 'Strong',
      description: 'Track workouts and strength training',
      icon: <Image source={require('../assets/appicons/strong-app.jpg')} style={styles.appIconImage} />,
      isAvailable: true,
      isConnected: connections.strong,
    },
    {
      id: 'strava',
      name: 'Strava',
      description: 'Track running and cycling activities',
      icon: <Image source={require('../assets/appicons/strava-app.jpg')} style={styles.appIconImage} />,
      isAvailable: true,
      isConnected: connections.strava,
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Track activity, sleep, and wellness metrics',
      icon: <Image source={require('../assets/appicons/fitbit-app.jpg')} style={styles.appIconImage} />,
      isAvailable: true,
      isConnected: connections.fitbit,
    },
  ];

  const handleAppToggle = async (app) => {
    if (app.id === 'appleHealth') {
      await handleAppleHealthToggle();
    } else {
      // For other apps, just toggle the connection state
      if (app.isConnected) {
        disconnectApp(app.id);
      } else {
        connectApp(app.id);
        Alert.alert(
          'Coming Soon',
          `${app.name} integration will be available in a future update.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleAppleHealthToggle = async () => {
    if (connections.appleHealth) {
      // Disconnect
      disconnectApp('appleHealth');
      setHealthKitAuthorized(false);
      await HealthKitService.disconnect();
      
      // Save disconnected state to AsyncStorage so it persists across sign-outs
      await HealthKitService.saveConnectionState(false);
      
      // Remove from Supabase if user is authenticated
      if (user) {
        const appleHealthApp = connectedApps.find(app => app.app_name === 'Apple Health');
        if (appleHealthApp) {
          await removeConnectedApp(appleHealthApp.id);
        }
      }
      
      Alert.alert(
        'Disconnected',
        'Apple Health has been disconnected. You can reconnect anytime.',
        [{ text: 'OK' }]
      );
    } else {
      // Check if running in Expo Go
      if (isExpoGo) {
        Alert.alert(
          'Custom Development Build Required',
          'Apple Health integration requires a custom development build. Please build the app with "npx expo run:ios" to enable HealthKit features.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Connect
      setIsLoading(true);
      try {
        if (DEBUG_HEALTHKIT) {
          console.log('Requesting HealthKit permissions...');
        }
        const authorized = await HealthKitService.requestPermissions();
        if (DEBUG_HEALTHKIT) {
          console.log('HealthKit authorization result:', authorized);
        }
        
        if (authorized) {
          connectApp('appleHealth');
          setHealthKitAuthorized(true);
          
          // Save connection state to AsyncStorage
          await HealthKitService.saveConnectionState(true);
          
          // Add to Supabase if user is authenticated
          if (user) {
            const result = await addConnectedApp({
              appName: 'Apple Health',
              appType: 'health_tracking',
            });
            
            if (DEBUG_HEALTHKIT) {
              console.log('Added to Supabase:', result);
            }
          }
          
          // Trigger initial sync
          setIsLoading(true);
          const syncResult = await HealthKitService.syncHealthData(7);
          
          if (syncResult.success) {
            const lastSync = await HealthKitService.getLastSyncTime();
            setLastSyncTime(lastSync);
            
            Alert.alert(
              'Connected Successfully',
              `Apple Health has been connected successfully. Synced ${syncResult.synced} days of health data.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Connected with Warning',
              'Apple Health connected but initial sync failed. Your data will sync next time you open the app.',
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('HealthKit connection error:', error);
        console.error('Error stack:', error.stack);
        
        let errorMessage = 'Failed to connect to Apple Health. Please try again.';
        const diagnostics = {
          platform: Platform.OS,
          appOwnership: Constants?.appOwnership,
          errorMessage: error?.message,
          errorStack: error?.stack,
        };
        
        if (error.message.includes('not available')) {
          errorMessage = 'HealthKit native module is not available. Please ensure the app is built with "npx expo run:ios".';
        } else if (error.message.includes('not available on this device')) {
          errorMessage = 'Apple Health is not available on this device.';
        } else if (error.message.includes('only available on iOS')) {
          errorMessage = 'Apple Health is only available on iOS devices.';
        } else if (error.message.includes('initialization failed')) {
          errorMessage = 'HealthKit initialization failed. Please check your device settings.';
        } else if (error.message.includes('not properly linked')) {
          errorMessage = 'HealthKit module is not properly linked. Please rebuild the app.';
        }
        
        Alert.alert(
          'Connection Failed',
          `${errorMessage}\n\nDiagnostics:\n${JSON.stringify(diagnostics, null, 2)}`,
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewData = async () => {
    if (!connections.appleHealth) {
      Alert.alert('Not Connected', 'Please connect to Apple Health first.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AppsScreen] Fetching health data...');
      
      // Check if HealthKit is initialized
      if (!HealthKitService.isInitialized) {
        console.log('[AppsScreen] HealthKit not initialized, initializing now...');
        const initialized = await HealthKitService.requestPermissions();
        if (!initialized) {
          throw new Error('HealthKit initialization failed');
        }
      }
      
      const data = await HealthKitService.getHealthData();
      console.log('[AppsScreen] Health data fetched:', data ? 'success' : 'no data');
      
      if (!data || (data.summary && data.summary.totalMetrics === 0)) {
        Alert.alert(
          'No Data Available',
          'No health data found for the last 7 days. Make sure you have data in the Health app and have granted all permissions.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setHealthData(data);
      setShowDataModal(true);
    } catch (error) {
      console.error('[AppsScreen] Error fetching health data:', error);
      console.error('[AppsScreen] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      
      let errorMessage = 'Failed to fetch health data. ';
      if (error.message.includes('not initialized')) {
        errorMessage += 'HealthKit is not initialized. Please reconnect Apple Health.';
      } else if (error.message.includes('permission')) {
        errorMessage += 'Missing required permissions. Please check Health app settings.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Format last sync time for display
  const formatLastSync = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const syncDate = new Date(date);
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return syncDate.toLocaleDateString();
  };

  const renderAppCard = (app) => (
    <View key={app.id} style={styles.appCard}>
      <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.appCardBlur}>
        <View style={styles.appCardContent}>
          <View style={styles.appHeader}>
            <View style={styles.appIconWrapper}>
              <View style={styles.appIconContainer}>
                {app.icon}
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: app.isConnected ? '#10b981' : '#6b7280' }
              ]}>
                <Ionicons 
                  name={app.isConnected ? "checkmark" : "close"} 
                  size={10} 
                  color="#ffffff" 
                />
              </View>
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appDescription}>
                {app.description}
                {app.id === 'appleHealth' && app.isConnected && lastSyncTime && (
                  <Text style={styles.lastSyncInline}>
                    {' • Last sync: ' + formatLastSync(lastSyncTime)}
                  </Text>
                )}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              {app.id === 'appleHealth' && app.isConnected && (
                <TouchableOpacity
                  style={styles.viewDataButton}
                  onPress={handleViewData}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  app.isConnected ? styles.disconnectButton : styles.connectButtonActive,
                  !app.isAvailable && styles.disabledButton
                ]}
                onPress={() => handleAppToggle(app)}
                disabled={!app.isAvailable || isLoading}
                activeOpacity={0.8}
              >
                {isLoading && app.id === 'appleHealth' ? (
                  <Ionicons name="hourglass-outline" size={20} color="#1f2937" />
                ) : app.isConnected ? (
                  <Ionicons name="close-circle-outline" size={20} color="#ffffff" />
                ) : (
                  <Ionicons name="add-circle-outline" size={20} color="#1f2937" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <Background style={styles.backgroundImage}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="apps-outline" size={24} color="#eaff61" />
          <Text style={styles.headerTitle}>Apps</Text>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          

          <View style={styles.appsContainer}>
            {apps.map(renderAppCard)}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <BlurView intensity={40} tint="light" style={styles.disclaimerBlur}>
              <Text style={styles.disclaimerText}>
                Third-party apps are the responsibility of their respective owners. 
                YouPhoria is not affiliated with these services.
              </Text>
            </BlurView>
          </View>
        </ScrollView>
      </Background>

      {/* Health Data Modal */}
      <Modal
        visible={showDataModal}
        animationType="fade"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDataModal(false)}
        transparent={true}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apple Health Data</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDataModal(false)}
              >
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {healthData ? (
              <View>
                {/* Summary Section */}
                {healthData.summary && (
                  <View style={styles.summaryCardContainer}>
                    <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.summaryCard}>
                      <View style={styles.summaryCardContent}>
                        <View style={styles.sectionTitleContainer}>
                          <Ionicons name="stats-chart" size={24} color="#eaff61" />
                          <Text style={styles.summaryTitle}>Data Summary</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Total Metrics:</Text>
                          <Text style={styles.summaryValue}>{healthData.summary.totalMetrics}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Total Data Points:</Text>
                          <Text style={styles.summaryValue}>{healthData.summary.totalDataPoints}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Categories:</Text>
                          <Text style={styles.summaryValue}>{healthData.summary.categories?.join(', ') || 'None'}</Text>
                        </View>
                      </View>
                    </BlurView>
                  </View>
                )}

                {/* Activity Section */}
                {healthData.activity && healthData.activity.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="fitness" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Activity & Fitness</Text>
                    </View>
                    {healthData.activity.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Heart Section */}
                {healthData.heart && healthData.heart.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="heart" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Heart</Text>
                    </View>
                    {healthData.heart.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(0) || 'N/A'} {metric.data[0]?.unit || 'bpm'}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Body Section */}
                {healthData.body && healthData.body.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="body" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Body Measurements</Text>
                    </View>
                    {healthData.body.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Vitals Section */}
                {healthData.vitals && healthData.vitals.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="pulse" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Vitals</Text>
                    </View>
                    {healthData.vitals.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || ''}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Nutrition Section */}
                {healthData.nutrition && healthData.nutrition.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="nutrition" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Nutrition</Text>
                    </View>
                    {healthData.nutrition.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || ''}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Sleep Section */}
                {healthData.sleep && healthData.sleep.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="moon" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Sleep & Mindfulness</Text>
                    </View>
                    {healthData.sleep.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Mobility Section */}
                {healthData.mobility && healthData.mobility.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="walk" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Mobility</Text>
                    </View>
                    {healthData.mobility.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Hearing Section */}
                {healthData.hearing && healthData.hearing.length > 0 && (
                  <View style={styles.categorySection}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons name="headset" size={22} color="#ffffff" />
                      <Text style={styles.categoryTitle}>Hearing</Text>
                    </View>
                    {healthData.hearing.map((metric, index) => (
                      <View key={index} style={styles.metricCardContainer}>
                        <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.metricCard}>
                          <View style={styles.metricCardContent}>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                            <Text style={styles.metricCount}>{metric.count} data points</Text>
                            {metric.data && metric.data.length > 0 && (
                              <Text style={styles.metricLatest}>
                                Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || 'dB'}
                              </Text>
                            )}
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}

                {/* Last Updated */}
                {healthData.lastUpdated && (
                  <View style={styles.timestampContainer}>
                    <Text style={styles.timestampText}>
                      Last updated: {new Date(healthData.lastUpdated).toLocaleString()}
                    </Text>
                  </View>
                )}

                {/* No Data Message */}
                {healthData.summary && healthData.summary.totalMetrics === 0 && (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                      No health data found for the last 7 days. Add some data in the Health app or check your permissions.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noDataText}>No health data available</Text>
            )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    zIndex: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleContainer: {
    marginBottom: 32,
  },
  titleBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.2)',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    // Android shadow
    elevation: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 10,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  appsContainer: {
    gap: 16,
  },
  appCard: {
    marginBottom: 4,
  },
  appCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // iOS 26 glass UI shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    // Android shadow
    elevation: 8,
  },
  appCardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appIconWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  appIconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // iOS 26 glass UI shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  appIconImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  lastSyncInline: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  connectButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectButtonActive: {
    backgroundColor: 'rgba(234, 255, 97, 0.9)',
    borderColor: '#eaff61',
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderWidth: 0.5,
    borderColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  disconnectButtonText: {
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  disclaimerContainer: {
    marginTop: 32,
    marginBottom: 20,
  },
  disclaimerBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.2)',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  viewDataButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDataButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: '#222021',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#222021',
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  dataSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  dataItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  noDataText: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginTop: 40,
  },
  summaryCardContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryCardContent: {
    backgroundColor: 'rgba(50, 50, 48, 0.95)',
    padding: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(234, 255, 97, 0.4)',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#eaff61',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#d1d5db',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingLeft: 4,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  metricCardContainer: {
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricCardContent: {
    backgroundColor: 'rgba(50, 50, 48, 0.95)',
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  metricLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  metricCount: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },
  metricLatest: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
  },
  timestampContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  timestampText: {
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
