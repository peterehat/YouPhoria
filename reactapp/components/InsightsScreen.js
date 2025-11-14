import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Background from './Background';
import ChatOverlay from './ChatOverlay';
import { getConversations, deleteConversation } from '../services/chatService';
import { uploadFile } from '../services/uploadService';
import useAuthStore from '../store/authStore';

export default function InsightsScreen({ onOpenOnboarding = () => {} }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start as true to prevent flash
  const [showChatOverlay, setShowChatOverlay] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    } else {
      setIsLoading(false); // If no user, stop loading
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user?.id) {
      console.log('[InsightsScreen] No user ID available');
      return;
    }
    
    console.log('[InsightsScreen] Loading conversations for user:', user.id);
    setIsLoading(true);
    const result = await getConversations(user.id);
    
    console.log('[InsightsScreen] getConversations result:', result);
    
    if (result.success) {
      console.log('[InsightsScreen] Setting conversations:', result.conversations.length);
      setConversations(result.conversations);
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
    
    setIsLoading(false);
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

      // Show loading
      setIsLoading(true);

      // Upload file
      const uploadResult = await uploadFile(
        file.uri,
        file.name,
        file.mimeType,
        user.id
      );

      setIsLoading(false);

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
      setIsLoading(false);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handleCloseChatOverlay = () => {
    setShowChatOverlay(false);
    setSelectedConversationId(null);
    // Refresh conversations when chat closes
    loadConversations();
  };

  const handleLongPress = (conversation) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Conversation'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: conversation.title,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
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
      // Android fallback
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

  const renderConversationItem = (conversation) => {
    return (
      <TouchableOpacity
        key={conversation.id}
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
              refreshing={isLoading}
              onRefresh={loadConversations}
              tintColor="#fff"
            />
          }
        >
          {/* Action Buttons Section */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.revisitButton}
              activeOpacity={0.85}
              onPress={onOpenOnboarding}
            >
              <BlurView intensity={100} tint="systemUltraThinMaterial" style={styles.revisitButtonBlur}>
                <View style={styles.revisitButtonContent}>
                  <Ionicons name="person-circle-outline" size={24} color="#eaff61" />
                  <Text style={styles.revisitButtonText}>Update You-i Profile</Text>
                </View>
              </BlurView>
            </TouchableOpacity>

            {/* Upload File Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleFileUpload}
              activeOpacity={0.85}
            >
              <View style={styles.uploadSquare}>
                <Ionicons name="cloud-upload-outline" size={24} color="#000" />
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
            
            {isLoading ? (
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
            ) : (
              <View style={styles.conversationsList}>
                {conversations.map(conversation => renderConversationItem(conversation))}
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
  revisitButton: {
    flex: 1,
  },
  revisitButtonBlur: {
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
  revisitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  revisitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  revisitHelper: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
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
});
