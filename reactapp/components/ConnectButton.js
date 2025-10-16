import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function ConnectButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <BlurView intensity={100} tint="systemUltraThinMaterialDark" style={styles.blurContainer}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.label}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#eaff61',
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
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

