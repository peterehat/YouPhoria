import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BottomNavigation = ({ currentScreen, onNavigate }) => {
  const navigationItems = [
    { id: 'Home', icon: 'home-outline', label: 'Home' },
    { id: 'Insights', icon: 'analytics-outline', label: 'Insights' },
    { id: 'Data', icon: 'bar-chart-outline', label: 'Data' },
    { id: 'Devices', icon: 'phone-portrait-outline', label: 'Devices' },
    { id: 'Apps', icon: 'apps-outline', label: 'Apps' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const isSelected = currentScreen === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isSelected && styles.selectedNavItem]}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isSelected ? '#222021' : '#ffffff'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Safe area padding for iOS home indicator
    paddingTop: 16,
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'transparent', // Ensure no content shows through
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#222021',
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 72,
    width: '100%',
    maxWidth: 400,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedNavItem: {
    // No additional styling needed for the container
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#eafd60',
  },
});

export default BottomNavigation;
