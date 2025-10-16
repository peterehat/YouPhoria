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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import HealthKitService from '../services/healthKitService';

export default function AppsScreen({ onNavigateToHome }) {
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
      description: 'Connect to HealthKit for comprehensive health data',
      icon: <Image source={require('../assets/appicons/health-app.png')} style={styles.appIconImage} />,
      isAvailable: Platform.OS === 'ios',
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
      // Connect
      setIsLoading(true);
      try {
        const isAvailable = await HealthKitService.isAvailable();
        if (!isAvailable) {
          Alert.alert(
            'HealthKit Not Available',
            'Apple Health is not available on this device.',
            [{ text: 'OK' }]
          );
          return;
        }

        const authorized = await HealthKitService.requestPermissions();
        if (authorized) {
          connectApp('appleHealth');
          setHealthKitAuthorized(true);
          Alert.alert(
            'Connected Successfully',
            'Apple Health has been connected successfully.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Please enable HealthKit permissions in Settings to connect Apple Health.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.log('HealthKit connection error:', error);
        Alert.alert(
          'Connection Failed',
          'Failed to connect to Apple Health. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderAppCard = (app) => (
    <View key={app.id} style={styles.appCard}>
      <BlurView intensity={60} tint="light" style={styles.appCardBlur}>
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
      </BlurView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../assets/background.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
        blurRadius={20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onNavigateToHome}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apps</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <BlurView intensity={60} tint="light" style={styles.titleBlur}>
              <Text style={styles.title}>Connect Your Apps</Text>
              <Text style={styles.subtitle}>
                Link your favorite health and fitness apps to get personalized insights
              </Text>
            </BlurView>
          </View>

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
      </ImageBackground>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 2,
    borderColor: '#eaff61',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    // Android shadow
    elevation: 10,
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
  headerSpacer: {
    width: 40,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
  appsContainer: {
    gap: 16,
  },
  appCard: {
    marginBottom: 4,
  },
  appCardBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.2)',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    // Android shadow
    elevation: 10,
  },
  appCardContent: {
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
    padding: 20,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
  },
  appIconImage: {
    width: 48,
    height: 48,
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
    color: '#6b7280',
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
    color: '#6b7280',
    fontWeight: '500',
  },
  connectButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  connectButtonActive: {
    backgroundColor: '#eaff61',
  },
  disconnectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  disconnectButtonText: {
    color: '#ef4444',
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
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
  },
});
