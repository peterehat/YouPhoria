import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConnectButton from './ConnectButton';

export default function HomeScreen({ onNavigateToApps }) {
  const [healthQuestion, setHealthQuestion] = useState('');

  const handleGetHealthGuidance = () => {
    console.log('Get health guidance for:', healthQuestion);
    // Add your navigation or API call logic here
  };

  const handleDataPress = () => {
    console.log('Data button pressed');
  };

  const handleDevicesPress = () => {
    console.log('Devices button pressed');
  };

  const handleAppsPress = () => {
    onNavigateToApps();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../assets/background.png')}
        //style={[styles.background, { transform: [{ translateY: 70 }] }]}
        resizeMode="cover"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <BlurView intensity={80} tint="dark" style={styles.avatarBlur}>
            <Text style={styles.avatarText}>PE</Text>
          </BlurView>
        </View>

        {/* Main Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Center Card */}
          <View style={styles.centerContainer}>
            <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.cardBlur}>
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.title}>You-I</Text>
                  <Text style={styles.subtitle}>Ask me wellness questions.</Text>
                  
                  <View style={styles.inputContainer}>
                    <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.inputBlur}>
                      <TextInput
                        style={styles.input}
                        placeholder="Type your health question here..."
                        placeholderTextColor="#6b7280"
                        value={healthQuestion}
                        onChangeText={setHealthQuestion}
                        multiline={false}
                      />
                    </BlurView>
                    
                    <TouchableOpacity 
                      style={styles.button}
                      onPress={handleGetHealthGuidance}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonText}>Get Health Guidance</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Bottom Connect Section */}
          <View style={styles.connectSection}>
            <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.connectBadge}>
              <Text style={styles.connectText}>CONNECT</Text>
            </BlurView>
            
            <View style={styles.buttonsRow}>
              <ConnectButton
                icon={<Ionicons name="cloud-upload-outline" size={28} color="#fff" />}
                label="DATA"
                onPress={handleDataPress}
              />
              <ConnectButton
                icon={<Ionicons name="phone-portrait-outline" size={28} color="#fff" />}
                label="DEVICES"
                onPress={handleDevicesPress}
              />
              <ConnectButton
                icon={<MaterialCommunityIcons name="link-variant" size={28} color="#fff" />}
                label="APPS"
                onPress={handleAppsPress}
              />
            </View>
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
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    top: 70,
    left: 24,
    zIndex: 20,
  },
  logo: {
    height: 32,
    width: 120,
  },
  avatarContainer: {
    position: 'absolute',
    top: 70,
    right: 24,
    zIndex: 20,
  },
  avatarBlur: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 250,
    paddingBottom: 230,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 70,
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // iOS 26 glass UI shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    // Android shadow
    elevation: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    gap: 16,
  },
  inputBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    height: 52,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    height: 48,
    backgroundColor: '#eaff61',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  connectSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  connectBadge: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
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
  connectText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: 8,
  },
});

