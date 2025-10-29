import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from '../components/HomeScreen';
import AppsScreen from '../components/AppsScreen';
import InsightsScreen from '../components/InsightsScreen';
import DataScreen from '../components/DataScreen';
import DevicesScreen from '../components/DevicesScreen';
import BottomNavigation from '../components/BottomNavigation';
import { useState } from 'react';

const ProtectedApp = () => {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const handleNavigation = (screen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Insights':
        return <InsightsScreen />;
      case 'Data':
        return <DataScreen />;
      case 'Devices':
        return <DevicesScreen />;
      case 'Apps':
        return <AppsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
      <BottomNavigation currentScreen={currentScreen} onNavigate={handleNavigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ProtectedApp;
