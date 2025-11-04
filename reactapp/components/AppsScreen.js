import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Background from './Background';
import Constants from 'expo-constants';
import HealthKitService from '../services/healthKitService';

// Toggle verbose HealthKit logging here (independent flag for this screen)
const DEBUG_HEALTHKIT = __DEV__ && false;

// Debug: Log native module availability (dev-only)
if (DEBUG_HEALTHKIT) {
  console.log('AppsScreen - NativeModules.AppleHealthKit:', NativeModules.AppleHealthKit);
}

export default function AppsScreen() {
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

  // Check if running in Expo Go (which doesn't support HealthKit)
  const isExpoGo = Constants.appOwnership === 'expo';
  // Background handled by shared Background component


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
      HealthKitService.disconnect();
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

      // The Kingstinct HealthKit package uses NitroModules, so we don't need to check NativeModules
      // The module availability is checked when we try to call it

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
          Alert.alert(
            'Connected Successfully',
            'Apple Health has been connected successfully. You can now access your health data.',
            [{ text: 'OK' }]
          );
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
      const data = await HealthKitService.getHealthData();
      setHealthData(data);
      setShowDataModal(true);
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert('Error', 'Failed to fetch health data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppCard = (app) => (
    <View key={app.id} style={styles.appCard}>
      <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.appCardBlur}>
        <View style={styles.appCardContent}>
          <View style={styles.appHeader}>
            <View style={styles.appIconContainer}>
              {app.icon}
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appDescription}>{app.description}</Text>
            </View>
          </View>
          
          <View style={styles.appActions}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: app.isConnected ? '#10b981' : '#6b7280' }
              ]} />
              <Text style={styles.statusText}>
                {app.isConnected ? 'Connected' : 'Not Connected'}
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
                  <Text style={styles.viewDataButtonText}>View Data</Text>
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
                <Text style={[
                  styles.connectButtonText,
                  app.isConnected && styles.disconnectButtonText,
                  !app.isAvailable && styles.disabledButtonText
                ]}>
                  {isLoading && app.id === 'appleHealth' ? 'Connecting...' : 
                   app.isConnected ? 'Disconnect' : 'Connect'}
                </Text>
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
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDataModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apple Health Data</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDataModal(false)}
            >
              <Ionicons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {healthData ? (
              <View>
                {/* Summary Section */}
                {healthData.summary && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📊 Data Summary</Text>
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
                )}

                {/* Activity Section */}
                {healthData.activity && healthData.activity.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>🏃 Activity & Fitness</Text>
                    {healthData.activity.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Heart Section */}
                {healthData.heart && healthData.heart.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>❤️ Heart</Text>
                    {healthData.heart.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(0) || 'N/A'} {metric.data[0]?.unit || 'bpm'}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Body Section */}
                {healthData.body && healthData.body.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>⚖️ Body Measurements</Text>
                    {healthData.body.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Vitals Section */}
                {healthData.vitals && healthData.vitals.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>🩺 Vitals</Text>
                    {healthData.vitals.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Nutrition Section */}
                {healthData.nutrition && healthData.nutrition.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>🍎 Nutrition</Text>
                    {healthData.nutrition.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Sleep Section */}
                {healthData.sleep && healthData.sleep.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>😴 Sleep & Mindfulness</Text>
                    {healthData.sleep.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Mobility Section */}
                {healthData.mobility && healthData.mobility.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>🚶 Mobility</Text>
                    {healthData.mobility.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(2) || 'N/A'} {metric.data[0]?.unit || ''}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Hearing Section */}
                {healthData.hearing && healthData.hearing.length > 0 && (
                  <View style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>🎧 Hearing</Text>
                    {healthData.hearing.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricCount}>{metric.count} data points</Text>
                        {metric.data && metric.data.length > 0 && (
                          <Text style={styles.metricLatest}>
                            Latest: {metric.data[0]?.quantity?.toFixed(1) || 'N/A'} {metric.data[0]?.unit || 'dB'}
                          </Text>
                        )}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    lineHeight: 18,
  },
  appActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectButtonActive: {
    backgroundColor: 'rgba(234, 255, 97, 0.8)',
    borderColor: '#eaff61',
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
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
  },
  viewDataButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  summaryCard: {
    backgroundColor: 'rgba(234, 255, 97, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 255, 97, 0.3)',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricCount: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricLatest: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  timestampContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 41, 55, 0.1)',
  },
  timestampText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});
