import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConnectButton from './ConnectButton';

export default function HomeScreen() {
  const [healthQuestion, setHealthQuestion] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  // Randomly select background image on component mount
  useEffect(() => {
    const backgrounds = [
      require('../assets/background.png'),
      require('../assets/group-post-workout.png'),
      require('../assets/woman-kettle-bells.png')
    ];
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    setBackgroundImage(backgrounds[randomIndex]);
  }, []);
  
  // Animation values
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const insightsButtonOpacity = useRef(new Animated.Value(0)).current;
  const inputHeight = useRef(new Animated.Value(52)).current;
  const responseOpacity = useRef(new Animated.Value(0)).current;
  const containerTop = useRef(new Animated.Value(200)).current; // Start position
  const cardMaxHeight = useRef(new Animated.Value(300)).current; // Card max height for animation
  const buttonContainerHeight = useRef(new Animated.Value(56)).current; // Button container height (48px button + 8px margin)
  const [contentHeight, setContentHeight] = useState(0);

  const handleGetHealthGuidance = () => {
    if (healthQuestion.trim()) {
      // Simulate getting a response
      const mockResponse = "Based on your question, here's some initial guidance. For more detailed insights, you can view the full analysis.";
      setResponseText(mockResponse);
      setShowResponse(true);
      
      // Animate button fade out and collapse
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(buttonContainerHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
      
      // Animate card height expansion
      Animated.timing(cardMaxHeight, {
        toValue: 2000, // Large value to allow natural sizing
        duration: 250,
        useNativeDriver: false,
      }).start();
      
      // Remove height animation - let content determine size naturally
      inputHeight.setValue(999); // Set to large value to allow natural sizing
      
      // Animate response fade in
      setTimeout(() => {
        Animated.timing(responseOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Animate insights button fade in
        setTimeout(() => {
          Animated.timing(insightsButtonOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 50);
      }, 150);
    }
  };

  const handleViewInsights = () => {
    // Navigation is now handled by BottomNavigation component
    console.log('Navigate to Insights');
  };

  const handleNewQuestion = () => {
    // Animate response and insights button fade out
    Animated.timing(responseOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
    
    Animated.timing(insightsButtonOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
    
    // Animate input height collapse
    Animated.timing(inputHeight, {
      toValue: 52,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
    
    // Animate card height collapse
    Animated.timing(cardMaxHeight, {
      toValue: 300,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
    
    // Animate button fade in and expand (starts immediately with other animations)
    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(buttonContainerHeight, {
      toValue: 56,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // After animations complete, reset state
    setTimeout(() => {
      setHealthQuestion('');
      setShowResponse(false);
      setResponseText('');
    }, 250);
  };

  const handleDataPress = () => {
    console.log('Data button pressed');
  };

  const handleDevicesPress = () => {
    console.log('Devices button pressed');
  };

  const handleAppsPress = () => {
    // Navigation is now handled by BottomNavigation component
    console.log('Navigate to Apps');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
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
          <Animated.View style={[styles.centerContainer, { marginTop: containerTop }]}>
            <Animated.View style={{ maxHeight: cardMaxHeight, overflow: 'hidden', width: '100%' }}>
              <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.cardBlur}>
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.title}>You-I</Text>
                  <Text style={styles.subtitle}>Ask me wellness questions.</Text>
                  
                  <View style={styles.inputContainer}>
                    <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.inputBlur}>
                      <Animated.View style={[styles.animatedInputContainer, { maxHeight: inputHeight }]}>
                        {!showResponse ? (
                          /* Question Input */
                          <TextInput
                            style={styles.input}
                            placeholder="Type your health question here..."
                            placeholderTextColor="#6b7280"
                            value={healthQuestion}
                            onChangeText={setHealthQuestion}
                            multiline={false}
                          />
                        ) : (
                          /* Response Section */
                          <Animated.View style={[styles.responseSection, { opacity: responseOpacity }]}>
                            <View style={styles.questionDisplay}>
                              <Text style={styles.questionText}>{healthQuestion}</Text>
                            </View>
                            
                            <View style={styles.responseDisplay}>
                              <Text style={styles.responseText}>{responseText}</Text>
                            </View>
                            
                            <Animated.View style={[styles.insightsButtonContainer, { opacity: insightsButtonOpacity }]}>
                              <TouchableOpacity 
                                style={styles.insightsButton}
                                onPress={handleViewInsights}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.insightsButtonText}>View You-I Insights</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.newQuestionButton}
                                onPress={handleNewQuestion}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="close" size={24} color="#ffffff" />
                              </TouchableOpacity>
                            </Animated.View>
                          </Animated.View>
                        )}
                      </Animated.View>
                    </BlurView>
                    
                    {/* Get Health Guidance Button */}
                    <Animated.View style={{ height: buttonContainerHeight, overflow: 'hidden' }}>
                      <Animated.View style={{ opacity: buttonOpacity }}>
                        <TouchableOpacity 
                          style={styles.button}
                          onPress={handleGetHealthGuidance}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.buttonText}>Get Health Guidance</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </Animated.View>
                  </View>
                </View>
              </View>
            </BlurView>
            </Animated.View>
          </Animated.View>

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
    borderWidth: 2,
    borderColor: '#eaff61',
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
    paddingTop: 20,
    paddingBottom: 0,
  },
  centerContainer: {
    alignItems: 'center',
    marginTop: 110,
    marginBottom: 0,
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
    color: '#ffffff',
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
  animatedInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    minHeight: 52,
    flexShrink: 0,
  },
  input: {
    height: 52,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: 'transparent',
  },
  responseSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  questionDisplay: {
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  questionText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'left',
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  responseDisplay: {
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  insightsButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
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
  insightsButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#eaff61',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
  },
  insightsButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  newQuestionButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 50,
  },
  newQuestionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  connectSection: {
    marginTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 120, // Space for bottom navigation
    paddingTop: 0,
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

