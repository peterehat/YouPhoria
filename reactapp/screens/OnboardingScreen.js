import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Background from '../components/Background';
import useAuthStore from '../store/authStore';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onComplete, onClose }) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPart2, setShowPart2] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [loadingExisting, setLoadingExisting] = useState(true);
  
  // PanResponder refs for sliders (must be at top level)
  const moodPanResponderRef = useRef(null);
  const alignmentPanResponderRef = useRef(null);

  // Part 1 data
  const [firstName, setFirstName] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [gender, setGender] = useState('');
  const [mainGoal, setMainGoal] = useState([]);
  const [moodToday, setMoodToday] = useState(5);

  // Part 2 data
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sleepHours, setSleepHours] = useState([]);
  const [activityFrequency, setActivityFrequency] = useState([]);
  const [eatingHabits, setEatingHabits] = useState([]);
  const [morningFeeling, setMorningFeeling] = useState([]);
  const [currentState, setCurrentState] = useState('');
  const [imbalanceArea, setImbalanceArea] = useState([]);
  const [alignmentScore, setAlignmentScore] = useState(5);
  const [thirtyDayGoal, setThirtyDayGoal] = useState('');

  const genderOptions = ['Male', 'Female', 'Prefer not to say'];
  const mainGoalOptions = ['More energy', 'Less stress', 'Better sleep', 'Get in shape', 'Feel happier overall'];
  const sleepOptions = ['<5', '5–6', '7–8', '>8'];
  const activityOptions = ['Rarely', '1–2× / week', '3–4×', '5+'];
  const eatingOptions = ['Balanced', 'On the go', 'Needs work'];
  const morningOptions = ['Energized', 'Tired', 'Calm', 'Anxious'];
  const stateOptions = ['Just getting by', 'Doing okay but want more', 'Feeling great & ready to grow'];
  const imbalanceOptions = ['Energy', 'Relationships', 'Focus', 'Purpose'];

  useEffect(() => {
    const loadExistingOnboarding = async () => {
      if (!user) {
        setLoadingExisting(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_data')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading onboarding data:', error);
          return;
        }

        if (data?.onboarding_data) {
          const existing = data.onboarding_data;

          setFirstName(existing.firstName || '');
          if (existing.birthday) {
            const [year = '', month = '', day = ''] = existing.birthday.split('-');
            setBirthday({
              month: month.padStart(2, '0'),
              day: day.padStart(2, '0'),
              year,
            });
          }
          setGender(existing.gender || '');
          setMainGoal(Array.isArray(existing.mainGoal) ? existing.mainGoal : (existing.mainGoal ? [existing.mainGoal] : []));

          const parsedMood = Number(existing.moodToday);
          if (!Number.isNaN(parsedMood)) {
            setMoodToday(parsedMood);
          }

          setHeight(existing.height || '');
          setWeight(existing.weight || '');
          setSleepHours(Array.isArray(existing.sleepHours) ? existing.sleepHours : (existing.sleepHours ? [existing.sleepHours] : []));
          setActivityFrequency(Array.isArray(existing.activityFrequency) ? existing.activityFrequency : (existing.activityFrequency ? [existing.activityFrequency] : []));
          setEatingHabits(Array.isArray(existing.eatingHabits) ? existing.eatingHabits : (existing.eatingHabits ? [existing.eatingHabits] : []));
          setMorningFeeling(Array.isArray(existing.morningFeeling) ? existing.morningFeeling : (existing.morningFeeling ? [existing.morningFeeling] : []));
          setCurrentState(existing.currentState || '');
          setImbalanceArea(Array.isArray(existing.imbalanceArea) ? existing.imbalanceArea : (existing.imbalanceArea ? [existing.imbalanceArea] : []));

          const parsedAlignment = Number(existing.alignmentScore);
          if (!Number.isNaN(parsedAlignment)) {
            setAlignmentScore(parsedAlignment);
          }
          setThirtyDayGoal(existing.thirtyDayGoal || '');

          // If the user completed part 2 before, show it immediately for editing convenience
          const hasPart2Data = Boolean(
            existing.height ||
              existing.weight ||
              existing.sleepHours ||
              existing.activityFrequency ||
              existing.eatingHabits ||
              existing.morningFeeling ||
              existing.currentState ||
              existing.imbalanceArea ||
              existing.thirtyDayGoal
          );

          if (hasPart2Data) {
            setShowPart2(true);
          }
        }
      } catch (err) {
        console.error('Unexpected error loading onboarding data:', err);
      } finally {
        setLoadingExisting(false);
      }
    };

    loadExistingOnboarding();
  }, [user]);

  const getProgress = () => {
    const hasValue = (val) => {
      if (Array.isArray(val)) return val.length > 0;
      return Boolean(val);
    };

    if (!showPart2) {
      // Part 1: 5 questions
      const answered = [firstName, birthday.month, gender, hasValue(mainGoal), moodToday].filter(Boolean).length;
      return (answered / 5) * 50; // Part 1 is 50% of total
    } else {
      // Part 2: 10 questions
      const answered = [height, weight, hasValue(sleepHours), hasValue(activityFrequency), hasValue(eatingHabits), hasValue(morningFeeling), currentState, hasValue(imbalanceArea), alignmentScore, thirtyDayGoal].filter(Boolean).length;
      return 50 + (answered / 10) * 50; // Part 2 is the remaining 50%
    }
  };

  const animateTransition = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const normalizedBirthday = () => {
    const month = birthday.month.trim();
    const day = birthday.day.trim();
    const year = birthday.year.trim();

    if (!month || !day || !year) {
      return null;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleContinueToPart2 = () => {
    const trimmedName = firstName.trim();
    const month = birthday.month.trim();
    const day = birthday.day.trim();
    const year = birthday.year.trim();

    if (!trimmedName || !month || !day || !year || !gender || (Array.isArray(mainGoal) ? mainGoal.length === 0 : !mainGoal)) {
      Alert.alert('Please complete all fields', 'We need these details to personalize your experience.');
      return;
    }

    setFirstName(trimmedName);
    setBirthday({
      month: month.padStart(2, '0'),
      day: day.padStart(2, '0'),
      year,
    });

    animateTransition(() => {
      setShowPart2(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const handleSkip = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_data: {
            skipped: true,
            firstName: firstName.trim(),
            birthday: normalizedBirthday(),
            gender,
            mainGoal,
            moodToday,
          },
        })
        .eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  };

  const handleComplete = async () => {
    const hasValue = (val) => Array.isArray(val) ? val.length > 0 : Boolean(val);
    
    if (
      !height.trim() ||
      !weight.trim() ||
      !hasValue(sleepHours) ||
      !hasValue(activityFrequency) ||
      !hasValue(eatingHabits) ||
      !hasValue(morningFeeling) ||
      !currentState ||
      !hasValue(imbalanceArea) ||
      !thirtyDayGoal.trim()
    ) {
      Alert.alert('Almost there!', 'Please answer all questions to complete your profile.');
      return;
    }

    try {
      const fullName = firstName.trim();
      const normalizedHeight = height.trim();
      const normalizedWeight = weight.trim();
      const normalizedGoal = thirtyDayGoal.trim();
      const birthdayString = normalizedBirthday();

      const onboardingData = {
        firstName: fullName,
        birthday: birthdayString,
        gender,
        mainGoal,
        moodToday,
        height: normalizedHeight,
        weight: normalizedWeight,
        sleepHours,
        activityFrequency,
        eatingHabits,
        morningFeeling,
        currentState,
        imbalanceArea,
        alignmentScore,
        thirtyDayGoal: normalizedGoal,
        skipped: false,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_data: onboardingData,
        })
        .eq('id', user.id);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  // Initialize mood PanResponder
  if (!moodPanResponderRef.current) {
    const sliderWidth = width - 80;
    moodPanResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const locationX = Math.max(0, Math.min(evt.nativeEvent.locationX, sliderWidth));
        const percentage = locationX / sliderWidth;
        const value = Math.round(percentage * 10);
        setMoodToday(Math.max(0, Math.min(10, value)));
      },
      onPanResponderMove: (evt, gestureState) => {
        const locationX = Math.max(0, Math.min(evt.nativeEvent.locationX, sliderWidth));
        const percentage = locationX / sliderWidth;
        const value = Math.round(percentage * 10);
        setMoodToday(Math.max(0, Math.min(10, value)));
      },
      onPanResponderRelease: () => true,
      onPanResponderTerminate: () => true,
    });
  }

  const renderMoodSlider = () => {
    const emojis = ['😔', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😍', '🥳'];

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.emojiRow}>
          <Text style={styles.emojiLabel}>😔</Text>
          <Text style={styles.emojiLabel}>😐</Text>
          <Text style={styles.emojiLabel}>😄</Text>
        </View>
        <View style={styles.sliderWrapper} {...moodPanResponderRef.current.panHandlers}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(moodToday / 10) * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${(moodToday / 10) * 100}%` }]}>
              <Text style={styles.sliderThumbEmoji}>{emojis[moodToday]}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Initialize alignment PanResponder
  if (!alignmentPanResponderRef.current) {
    const sliderWidth = width - 80;
    alignmentPanResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const locationX = Math.max(0, Math.min(evt.nativeEvent.locationX, sliderWidth));
        const percentage = locationX / sliderWidth;
        const value = Math.round(percentage * 10);
        setAlignmentScore(Math.max(0, Math.min(10, value)));
      },
      onPanResponderMove: (evt, gestureState) => {
        const locationX = Math.max(0, Math.min(evt.nativeEvent.locationX, sliderWidth));
        const percentage = locationX / sliderWidth;
        const value = Math.round(percentage * 10);
        setAlignmentScore(Math.max(0, Math.min(10, value)));
      },
      onPanResponderRelease: () => true,
      onPanResponderTerminate: () => true,
    });
  }

  const renderAlignmentSlider = () => {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.emojiRow}>
          <Text style={styles.sliderNumber}>1</Text>
          <Text style={styles.sliderNumber}>5</Text>
          <Text style={styles.sliderNumber}>10</Text>
        </View>
        <View style={styles.sliderWrapper} {...alignmentPanResponderRef.current.panHandlers}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(alignmentScore / 10) * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${(alignmentScore / 10) * 100}%` }]}>
              <Text style={styles.sliderThumbText}>{alignmentScore}</Text>
            </View>
          </View>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>Disconnected</Text>
          <Text style={styles.sliderLabelText}>Aligned</Text>
        </View>
      </View>
    );
  };

  const renderMultipleChoice = (options, selected, onSelect, allowMultiple = true) => {
    const isSelected = (option) => {
      if (Array.isArray(selected)) {
        return selected.includes(option);
      }
      return selected === option;
    };

    const handleSelect = (option) => {
      if (allowMultiple) {
        if (Array.isArray(selected)) {
          if (selected.includes(option)) {
            onSelect(selected.filter(item => item !== option));
          } else {
            onSelect([...selected, option]);
          }
        } else {
          onSelect([option]);
        }
      } else {
        onSelect(option);
      }
    };

    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              isSelected(option) && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(option)}
          >
            <View style={[
              styles.checkbox,
              isSelected(option) && styles.checkboxSelected,
            ]}>
              {isSelected(option) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[
              styles.optionText,
              isSelected(option) && styles.optionTextSelected,
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPart1 = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey there 👋 I'm You-i.</Text>
        <Text style={styles.description}>
          Let's start building your You-i Wellness Profile — a living snapshot that grows with you.
        </Text>
        <Text style={styles.description}>
          Every input, data source, and check-in helps me understand you better so I can guide you toward feeling and becoming the happiest and best version of yourself.
        </Text>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>1.</Text>
        <Text style={styles.questionText}>What's your first name?</Text>
        <TextInput
          style={styles.input}
          placeholder="Your first name"
          placeholderTextColor="#9CA3AF"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>2.</Text>
        <Text style={styles.questionText}>
          Nice to meet you{firstName ? `, ${firstName}` : ''}! When's your birthday?
        </Text>
        <Text style={styles.helperText}>
          It helps me align with your natural rhythms — and maybe even your zodiac energy ✨
        </Text>
        <View style={styles.birthdayContainer}>
          <TextInput
            style={[styles.input, styles.birthdayInput]}
            placeholder="MM"
            placeholderTextColor="#9CA3AF"
            value={birthday.month}
            onChangeText={(text) => setBirthday({ ...birthday, month: text })}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.birthdaySeparator}>/</Text>
          <TextInput
            style={[styles.input, styles.birthdayInput]}
            placeholder="DD"
            placeholderTextColor="#9CA3AF"
            value={birthday.day}
            onChangeText={(text) => setBirthday({ ...birthday, day: text })}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.birthdaySeparator}>/</Text>
          <TextInput
            style={[styles.input, styles.birthdayInput, { flex: 1.5 }]}
            placeholder="YYYY"
            placeholderTextColor="#9CA3AF"
            value={birthday.year}
            onChangeText={(text) => setBirthday({ ...birthday, year: text })}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>3.</Text>
        <Text style={styles.questionText}>How do you identify?</Text>
        {renderMultipleChoice(genderOptions, gender, setGender, false)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>4.</Text>
        <Text style={styles.questionText}>What's your main goal right now?</Text>
        {renderMultipleChoice(mainGoalOptions, mainGoal, setMainGoal)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>5.</Text>
        <Text style={styles.questionText}>How are you feeling today?</Text>
        {renderMoodSlider()}
      </View>

      <View style={styles.transitionSection}>
        <Text style={styles.transitionText}>
          Awesome{firstName ? `, ${firstName}` : ''}. That gives me your starting point.
        </Text>
        <Text style={styles.transitionText}>
          Want to keep going so I can personalize your path toward your happiest and best self?
        </Text>
        <Text style={styles.helperText}>
          Remember — your You-i Wellness Profile will keep learning from every input, data source, and check-in you make.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleContinueToPart2}
      >
        <Text style={styles.buttonText}>Continue Building My Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleSkip}
      >
        <Text style={styles.secondaryButtonText}>Maybe Later</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPart2 = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Great!</Text>
        <Text style={styles.description}>
          Each answer helps me understand how you think, move, and feel.
        </Text>
        <Text style={styles.description}>
          Together, we'll keep shaping your You-i Wellness Profile — it evolves with every step you take toward the happiest and best version of yourself.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Body & Lifestyle</Text>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Height</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5'10'' or 178cm"
          placeholderTextColor="#9CA3AF"
          value={height}
          onChangeText={setHeight}
        />
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Weight</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 175 lbs or 79 kg"
          placeholderTextColor="#9CA3AF"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Typical sleep per night</Text>
        {renderMultipleChoice(sleepOptions, sleepHours, setSleepHours)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>How often do you move your body?</Text>
        {renderMultipleChoice(activityOptions, activityFrequency, setActivityFrequency)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Eating habits right now?</Text>
        {renderMultipleChoice(eatingOptions, eatingHabits, setEatingHabits)}
      </View>

      <Text style={styles.sectionTitle}>Mind & Emotions</Text>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>When you wake up, you usually feel …</Text>
        {renderMultipleChoice(morningOptions, morningFeeling, setMorningFeeling)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>Which feels most true today?</Text>
        {renderMultipleChoice(stateOptions, currentState, setCurrentState, false)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>One area that feels out of balance:</Text>
        {renderMultipleChoice(imbalanceOptions, imbalanceArea, setImbalanceArea)}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>
          If 1 feels disconnected and 10 feels aligned — where are you today?
        </Text>
        {renderAlignmentSlider()}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionText}>
          If You-i could help you shift one thing in the next 30 days, what would it be?
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Share your thoughts..."
          placeholderTextColor="#9CA3AF"
          value={thirtyDayGoal}
          onChangeText={setThirtyDayGoal}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.transitionSection}>
        <Text style={styles.transitionText}>
          Thanks, {firstName}! Your You-i Wellness Profile is now in motion.
        </Text>
        <Text style={styles.helperText}>
          Every check-in, connected device, and reflection you share will help me guide you more accurately — shaping habits, routines, and insights that bring you closer to feeling and becoming the happiest and best version of yourself.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Show My Insights</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loadingExisting) {
    return (
      <Background style={styles.background} overlayOpacity={0.65}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StatusBar style="light" />
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#eaff61" />
            <Text style={styles.loadingText}>Preparing your You-i Wellness Profile...</Text>
          </View>
        </KeyboardAvoidingView>
      </Background>
    );
  }

  return (
    <Background style={styles.background} overlayOpacity={0.65}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          {onClose && (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.pageTitle}>Youphoric Form</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Profile Progress • {Math.round(getProgress())}% – You-i learns from every input. Keep building your happiest self.
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {!showPart2 ? renderPart1() : renderPart2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  loadingText: {
    color: '#e5e7eb',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#eaff61',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#eaff61',
    marginTop: 20,
    marginBottom: 20,
  },
  questionSection: {
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eaff61',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  birthdayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  birthdayInput: {
    flex: 1,
    textAlign: 'center',
  },
  birthdaySeparator: {
    fontSize: 20,
    color: '#888888',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionButtonSelected: {
    backgroundColor: '#3a3a3a',
    borderColor: '#eaff61',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#eaff61',
    borderColor: '#eaff61',
  },
  checkmark: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 10,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  emojiLabel: {
    fontSize: 24,
  },
  sliderNumber: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '600',
  },
  sliderWrapper: {
    paddingVertical: 20,
    marginHorizontal: -5,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#eaff61',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -16,
    width: 40,
    height: 40,
    marginLeft: -20,
    backgroundColor: '#eaff61',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderThumbEmoji: {
    fontSize: 20,
  },
  sliderThumbText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#888888',
  },
  transitionSection: {
    marginTop: 20,
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(234, 255, 97, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 255, 97, 0.3)',
  },
  transitionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#eaff61',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 16,
  },
  secondaryButtonText: {
    color: '#888888',
    fontSize: 16,
  },
});

export default OnboardingScreen;

