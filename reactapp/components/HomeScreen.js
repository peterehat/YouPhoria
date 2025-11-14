import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConnectButton from './ConnectButton';
import Background from './Background';
import ChatOverlay from './ChatOverlay';
import useAuthStore from '../store/authStore';

export default function HomeScreen({ onNavigate }) {
  const [healthQuestion, setHealthQuestion] = useState('');
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [initialMessage, setInitialMessage] = useState(null);
  
  const { user, signOut } = useAuthStore();

  const handleSendMessage = () => {
    if (healthQuestion.trim()) {
      setInitialMessage(healthQuestion);
      setShowChatOverlay(true);
      setHealthQuestion(''); // Clear input
    }
  };

  const handleCloseChatOverlay = () => {
    setShowChatOverlay(false);
    setInitialMessage(null);
  };

  const handleDataPress = () => {
    onNavigate?.('Data');
  };

  const handleDevicesPress = () => {
    onNavigate?.('Devices');
  };

  const handleAppsPress = () => {
    onNavigate?.('Apps');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      return names.map(name => name[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      <Background style={styles.background}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/You-i-Logo-circle.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
            <BlurView intensity={80} tint="dark" style={styles.avatarBlur}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.contentWrapper}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Center Card */}
            <View style={styles.centerContainer}>
              <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.cardBlur}>
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Image 
                      source={require('../assets/You-i-Logo-wide.png')}
                      style={styles.centerLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.subtitle}>Let's talk about your wellness.</Text>
                    
                    <View style={styles.inputContainer}>
                      <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.inputBlur}>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={styles.input}
                            placeholder="Ask me anything..."
                            placeholderTextColor="#6b7280"
                            value={healthQuestion}
                            onChangeText={setHealthQuestion}
                            multiline={false}
                            onSubmitEditing={handleSendMessage}
                            returnKeyType="send"
                          />
                          <TouchableOpacity
                            style={[
                              styles.sendButton,
                              !healthQuestion.trim() && styles.sendButtonDisabled,
                            ]}
                            onPress={handleSendMessage}
                            disabled={!healthQuestion.trim()}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="arrow-up"
                              size={24}
                              color={healthQuestion.trim() ? '#222021' : '#fff'}
                            />
                          </TouchableOpacity>
                        </View>
                      </BlurView>
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
        </View>
      </Background>

      {/* Chat Overlay */}
      <ChatOverlay
        visible={showChatOverlay}
        onClose={handleCloseChatOverlay}
        initialMessage={initialMessage}
      />
    </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentWrapper: {
    flex: 1,
    zIndex: 10,
  },
  logoContainer: {
    position: 'absolute',
    top: 70,
    left: 24,
    zIndex: 20,
  },
  logo: {
    height: 52,
    width: 52,
    tintColor: '#ffffff',
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
    borderWidth: 2,
    borderColor: '#eaff61',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
    paddingTop: 20,
    paddingBottom: 0,
  },
  centerContainer: {
    alignItems: 'center',
    marginTop: 180,
    marginBottom: 0,
  },
  cardBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 32,
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
  centerLogo: {
    height: 48,
    width: 200,
    tintColor: '#ffffff',
    marginBottom: 20,
    marginLeft: -15,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  inputBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eaff61',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#eaff61',
  },
  connectSection: {
    marginTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 0,
    alignItems: 'center',
  },
  connectBadge: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
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
