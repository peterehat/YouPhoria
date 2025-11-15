import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Background from './Background';
import ChatOverlay from './ChatOverlay';
import { getConversations, deleteConversation, updateConversation } from '../services/chatService';
import { uploadFile } from '../services/uploadService';
import { API_BASE_URL, isProduction, isLocalhost } from '../config/api';
import useAuthStore from '../store/authStore';

export default function InsightsScreen({ onOpenOnboarding = () => {} }) {
  const [conversations, setConversations] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial page load
  const [isRefreshing, setIsRefreshing] = useState(false); // Track pull-to-refresh
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameConversation, setRenameConversation] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();
  
  // Animation refs for staggered fade-in
  const animationRefs = useRef({});
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (user?.id) {
      loadConversations(false); // false = not a refresh action
    } else {
      setIsInitialLoad(false); // If no user, stop loading
    }
  }, [user]);

  // Trigger staggered fade-in animation when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      
      // Initialize animation values for each conversation
      conversations.forEach((conversation, index) => {
        if (!animationRefs.current[conversation.id]) {
          animationRefs.current[conversation.id] = new Animated.Value(0);
        }
        
        // Stagger the animations with 50ms delay between each, faster duration with ease out
        Animated.timing(animationRefs.current[conversation.id], {
          toValue: 1,
          duration: 150,
          delay: index * 25,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }
  }, [conversations]);

  const loadConversations = async (isRefreshAction = false) => {
    if (!user?.id) {
      console.log('[InsightsScreen] No user ID available');
      return;
    }
    
    console.log('[InsightsScreen] Loading conversations for user:', user.id);
    
    // Only set refresh state if this is a pull-to-refresh action
    if (isRefreshAction) {
      setIsRefreshing(true);
    }
    // isInitialLoad is already true from initial state, so we don't need to set it
    
    const result = await getConversations(user.id);
    
    console.log('[InsightsScreen] getConversations result:', result);
    
    if (result.success) {
      console.log('[InsightsScreen] Setting conversations:', result.conversations.length);
      setConversations(result.conversations);
      
      // Reset animation flag when new conversations load
      if (!isRefreshAction) {
        hasAnimated.current = false;
      }
    } else {
      console.error('[InsightsScreen] Failed to load conversations:', result.error);
      
      // Show user-friendly error alert
      if (result.errorTitle && result.error) {
        Alert.alert(
          result.errorTitle,
          result.error,
          [{ text: 'OK' }]
        );
      }
    }
    
    setIsInitialLoad(false);
    setIsRefreshing(false);
  };

  const handleOpenConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setShowChatOverlay(true);
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setShowChatOverlay(true);
  };

  const handleFileUpload = async () => {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'text/plain',
          'text/csv',
          'text/rtf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file under 10MB.');
        return;
      }

      console.log('[InsightsScreen] Selected file:', {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
      });

      // Show uploading state
      setIsUploading(true);
      setUploadProgress(0);

      // Upload file with progress tracking
      const uploadResult = await uploadFile(
        file.uri,
        file.name,
        file.mimeType,
        user.id,
        (progressData) => {
          console.log('[InsightsScreen] Upload progress:', Math.round(progressData.progress * 100) + '%');
          setUploadProgress(progressData.progress);
        }
      );

      // Give a brief moment to show 100% completion before hiding
      if (uploadResult.success) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setIsUploading(false);
      setUploadProgress(0);

      if (!uploadResult.success) {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload file');
        return;
      }

      // Show success alert
      Alert.alert(
        'File Uploaded Successfully',
        `${file.name} has been analyzed. ${uploadResult.extractedData.summary}\n\nYou can now ask questions about this data in your conversations.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('[InsightsScreen] Error uploading file:', error);
      setIsUploading(false);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handleCloseChatOverlay = () => {
    setShowChatOverlay(false);
    setSelectedConversationId(null);
    // Refresh conversations when chat closes - this is a refresh action
    loadConversations(true);
  };

  const handleRenameConversation = (conversation) => {
    if (Platform.OS === 'ios') {
      // iOS has Alert.prompt
      Alert.prompt(
        'Rename Conversation',
        'Enter a new name for this conversation',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Rename',
            onPress: async (newTitle) => {
              if (!newTitle || newTitle.trim() === '') {
                Alert.alert('Error', 'Please enter a valid name');
                return;
              }
              const result = await updateConversation(conversation.id, user.id, newTitle.trim());
              if (result.success) {
                loadConversations();
              } else {
                Alert.alert('Error', 'Failed to rename conversation');
              }
            },
          },
        ],
        'plain-text',
        conversation.title
      );
    } else {
      // Android - use custom modal
      setRenameConversation(conversation);
      setRenameText(conversation.title);
      setShowRenameModal(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!renameText || renameText.trim() === '') {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }
    
    const result = await updateConversation(renameConversation.id, user.id, renameText.trim());
    if (result.success) {
      setShowRenameModal(false);
      setRenameConversation(null);
      setRenameText('');
      loadConversations();
    } else {
      Alert.alert('Error', 'Failed to rename conversation');
    }
  };

  const handleRenameCancel = () => {
    setShowRenameModal(false);
    setRenameConversation(null);
    setRenameText('');
  };

  const handleLongPress = (conversation) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Rename Conversation', 'Delete Conversation'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: conversation.title,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Rename
            handleRenameConversation(conversation);
          } else if (buttonIndex === 2) {
            // Delete
            const result = await deleteConversation(conversation.id, user.id);
            if (result.success) {
              loadConversations();
            } else {
              Alert.alert('Error', 'Failed to delete conversation');
            }
          }
        }
      );
    } else {
      // Android fallback - show options menu
      Alert.alert(
        conversation.title,
        'Choose an action',
        [
          {
            text: 'Rename',
            onPress: () => handleRenameConversation(conversation),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Conversation',
                `Are you sure you want to delete "${conversation.title}"?`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const result = await deleteConversation(conversation.id, user.id);
                      if (result.success) {
                        loadConversations();
                      } else {
                        Alert.alert('Error', 'Failed to delete conversation');
                      }
                    },
                  },
                ]
              );
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to midnight for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowOnly - dateOnly;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conversation.title.toLowerCase().includes(query) ||
      (conversation.preview && conversation.preview.toLowerCase().includes(query))
    );
  });

  const renderConversationItem = (conversation) => {
    // Get or create animation value for this conversation
    if (!animationRefs.current[conversation.id]) {
      animationRefs.current[conversation.id] = new Animated.Value(hasAnimated.current ? 1 : 0);
    }
    
    const animatedStyle = {
      opacity: animationRefs.current[conversation.id],
      transform: [
        {
          translateY: animationRefs.current[conversation.id].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };
    
    return (
      <Animated.View key={conversation.id} style={animatedStyle}>
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleOpenConversation(conversation.id)}
          onLongPress={() => handleLongPress(conversation)}
          activeOpacity={0.8}
        >
          <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.conversationBlur}>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <View style={styles.conversationIcon}>
                  <Ionicons name="chatbubbles" size={20} color="#eaff61" />
                </View>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  <Text style={styles.conversationPreview} numberOfLines={2}>
                    {conversation.preview || 'No messages yet'}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Background style={styles.backgroundImage}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="analytics-outline" size={24} color="#eaff61" />
          <Text style={styles.headerTitle}>You-i Insights</Text>
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadConversations(true)}
              tintColor="#fff"
            />
          }
        >
          {/* Action Buttons Section */}
          <View style={styles.buttonSection}>
            {/* Search Field */}
            <View style={styles.searchContainer}>
              <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.searchBlur}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons name="search-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search conversations..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                      <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>
                  )}
                </View>
              </BlurView>
            </View>

            {/* Upload File Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleFileUpload}
              activeOpacity={0.85}
              disabled={isUploading}
            >
              <View style={styles.uploadSquare}>
                {isUploading ? (
                  <View style={styles.uploadProgressWrapper}>
                    <View style={styles.uploadProgressCircle}>
                      <Text style={styles.uploadProgressPercentage}>
                        {Math.round(uploadProgress * 100)}%
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                )}
              </View>
            </TouchableOpacity>

            {/* New Conversation Button */}
            <TouchableOpacity
              style={styles.newConversationButton}
              onPress={handleNewConversation}
              activeOpacity={0.85}
            >
              <View style={styles.newConversationSquare}>
                <Ionicons name="create-outline" size={24} color="#000" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Conversations Section */}
          <View style={styles.conversationsSection}>
            <Text style={styles.sectionTitle}>Your Wellness Conversations</Text>
            
            {isInitialLoad ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#eaff61" />
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.emptyStateBlur}>
                  <View style={styles.emptyStateContent}>
                    <Ionicons name="chatbubbles-outline" size={64} color="rgba(234, 255, 97, 0.5)" />
                    <Text style={styles.emptyStateTitle}>No Conversations Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Start a conversation with You-i to get personalized wellness insights based on your health data.
                    </Text>
                  </View>
                </BlurView>
              </View>
            ) : filteredConversations.length === 0 ? (
              <View style={styles.emptyState}>
                <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.emptyStateBlur}>
                  <View style={styles.emptyStateContent}>
                    <Ionicons name="search-outline" size={64} color="rgba(234, 255, 97, 0.5)" />
                    <Text style={styles.emptyStateTitle}>No Results Found</Text>
                    <Text style={styles.emptyStateText}>
                      No conversations match your search query. Try a different search term.
                    </Text>
                  </View>
                </BlurView>
              </View>
            ) : (
              <View style={styles.conversationsList}>
                {filteredConversations.map(conversation => renderConversationItem(conversation))}
              </View>
            )}
            
            {/* API Debug Indicator */}
            {__DEV__ && (
              <View style={styles.apiIndicatorInline}>
                <BlurView intensity={80} tint="dark" style={styles.apiIndicatorBlur}>
                  <View style={styles.apiIndicatorContent}>
                    <View style={[styles.apiDot, isProduction ? styles.apiDotProd : styles.apiDotLocal]} />
                    <Text style={styles.apiText} numberOfLines={1}>
                      {isProduction ? 'Production' : isLocalhost ? 'Local' : 'Dev'}: {API_BASE_URL.replace('/api/v1', '')}
                    </Text>
                  </View>
                </BlurView>
              </View>
            )}
          </View>
        </ScrollView>
      </Background>

      {/* Chat Overlay */}
      <ChatOverlay
        visible={showChatOverlay}
        onClose={handleCloseChatOverlay}
        conversationId={selectedConversationId}
      />

      {/* Rename Modal (Android) */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRenameCancel}
      >
        <View style={styles.renameModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BlurView intensity={100} tint="dark" style={styles.renameModalContainer}>
              <View style={styles.renameModalContent}>
                <Text style={styles.renameModalTitle}>Rename Conversation</Text>
                <TextInput
                  style={styles.renameModalInput}
                  value={renameText}
                  onChangeText={setRenameText}
                  placeholder="Enter new name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoFocus={true}
                  selectTextOnFocus={true}
                />
                <View style={styles.renameModalButtons}>
                  <TouchableOpacity
                    style={[styles.renameModalButton, styles.renameModalCancelButton]}
                    onPress={handleRenameCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.renameModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.renameModalButton, styles.renameModalSubmitButton]}
                    onPress={handleRenameSubmit}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.renameModalButtonText, styles.renameModalSubmitButtonText]}>Rename</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    zIndex: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  newConversationButton: {
    marginBottom: 24,
  },
  newConversationBlur: {
    borderRadius: 16,
    overflow: 'hidden',
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
  newConversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  newConversationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  conversationsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  conversationsList: {
    gap: 12,
  },
  conversationItem: {
    marginBottom: 3,
  },
  conversationBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  conversationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 255, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  conversationPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  loadingState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    marginTop: 40,
  },
  emptyStateBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyStateContent: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonSection: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
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
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: 32,
  },
  uploadButton: {
    width: 56,
    height: 56,
  },
  uploadSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eaff61',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  uploadProgressWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressPercentage: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  newConversationButton: {
    width: 56,
    height: 56,
  },
  newConversationSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eaff61',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  apiIndicatorInline: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 120,
  },
  apiIndicatorBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  apiIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 8,
  },
  apiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  apiDotLocal: {
    backgroundColor: '#eaff61',
  },
  apiDotProd: {
    backgroundColor: '#10b981',
  },
  apiText: {
    fontSize: 11,
    color: '#fff',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  renameModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  renameModalContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  renameModalContent: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  renameModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  renameModalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  renameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameModalCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  renameModalSubmitButton: {
    backgroundColor: '#eaff61',
  },
  renameModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  renameModalSubmitButtonText: {
    color: '#000',
  },
});
