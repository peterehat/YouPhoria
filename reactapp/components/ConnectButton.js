import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';

export default function ConnectButton({ icon, label, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 5,
    borderColor: '#eaff61',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    // Android shadow
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

