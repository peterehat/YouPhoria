import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import AppsScreen from './components/AppsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const navigateToApps = () => {
    setCurrentScreen('Apps');
  };

  const navigateToHome = () => {
    setCurrentScreen('Home');
  };

  return (
    <>
      <StatusBar style="light" />
      {currentScreen === 'Home' ? (
        <HomeScreen onNavigateToApps={navigateToApps} />
      ) : (
        <AppsScreen onNavigateToHome={navigateToHome} />
      )}
    </>
  );
}