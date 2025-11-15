import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import * as DocumentPicker from 'expo-document-picker';
import { sendMessage, getConversation } from '../services/chatService';
import { uploadFile } from '../services/uploadService';
import useAuthStore from '../store/authStore';

export default function ChatOverlay({ 
  visible, 
  onClose, 
  initialMessage = null,
  conversationId = null,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const streamingIntervalRef = useRef(null);
  const typingDotAnim = useRef(new Animated.Value(1)).current;
  const cursorBlinkAnim = useRef(new Animated.Value(1)).current;
  const userScrollTimeoutRef = useRef(null);
  const { user } = useAuthStore();

  // Animate typing indicator
  useEffect(() => {
    if (streamingMessageId && streamingText === '') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingDotAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [streamingMessageId, streamingText]);

  // Animate cursor blink
  useEffect(() => {
    if (streamingMessageId && streamingText !== '') {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorBlinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorBlinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }
  }, [streamingMessageId, streamingText]);

  // Load existing conversation if conversationId provided
  useEffect(() => {
    if (visible && conversationId && user?.id) {
      loadConversation();
    } else if (visible && !conversationId) {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [visible, conversationId]);

  // Send initial message if provided
  useEffect(() => {
    if (visible && initialMessage && !conversationId) {
      handleSendMessage(initialMessage);
    }
  }, [visible, initialMessage]);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  const loadConversation = async () => {
    setIsLoading(true);
    const result = await getConversation(conversationId, user.id);
    
    if (result.success && result.conversation) {
      setMessages(result.conversation.messages || []);
      setCurrentConversationId(result.conversation.id);
      
      // Scroll to bottom after loading
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
    
    setIsLoading(false);
  };

  const streamText = (text, messageId) => {
    // Clear any existing streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    // Split text into paragraphs (by double newlines or single newlines)
    const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());
    const hasMoreThanThreeParagraphs = paragraphs.length > 3;
    
    // Calculate where the first 3 paragraphs end (count words instead of characters)
    let firstThreeParagraphsWordCount = 0;
    if (hasMoreThanThreeParagraphs) {
      const firstThreeParagraphsText = paragraphs.slice(0, 3).join(' ');
      firstThreeParagraphsWordCount = firstThreeParagraphsText.split(' ').length;
    }
    
    // Split text into words
    const words = text.split(' ');
    let currentIndex = 0;
    let currentSpeed = 10; // Track current speed
    
    setStreamingMessageId(messageId);
    setStreamingText('');
    setIsUserScrolling(false); // Reset scroll state

    const streamNextWord = () => {
      if (currentIndex < words.length) {
        // Check if we should speed up (after first 3 paragraphs)
        if (hasMoreThanThreeParagraphs && currentSpeed === 10 && currentIndex >= firstThreeParagraphsWordCount) {
          currentSpeed = 0.05; // Mark that we've sped up
          // Clear current interval and restart with faster speed
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = setInterval(streamNextWord, 0.1); // 100x faster (10ms -> 0.1ms)
          console.log('[Streaming] Speeding up 100x after', currentIndex, 'words');
          return; // Exit this iteration, let the new interval take over
        }

        setStreamingText(prev => {
          const newText = prev + (prev ? ' ' : '') + words[currentIndex];
          // Only auto-scroll if user hasn't manually scrolled
          if (!isUserScrolling) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
          return newText;
        });
        currentIndex++;
      } else {
        // Streaming complete
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
        setStreamingMessageId(null);
        setStreamingText('');
        setIsUserScrolling(false);
      }
    };

    // Start streaming at normal speed (10ms per word)
    streamingIntervalRef.current = setInterval(streamNextWord, 10);
  };

  const handleScroll = (event) => {
    // Get scroll position
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
    
    // Check if user is scrolled away from bottom (more than 50px)
    const distanceFromBottom = contentHeight - scrollPosition - scrollViewHeight;
    
    if (distanceFromBottom > 50) {
      // User has scrolled up
      setIsUserScrolling(true);
      
      // Clear any existing timeout
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      
      // After 3 seconds of no scrolling, resume auto-scroll
      userScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000);
    } else {
      // User is at or near the bottom
      setIsUserScrolling(false);
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputText.trim();
    
    if (!textToSend || isLoading) return;

    // Clear input immediately
    setInputText('');
    Keyboard.dismiss();

    // Add user message to UI
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send to backend
    console.log('[ChatOverlay] ===== SENDING MESSAGE TO BACKEND =====');
    console.log('[ChatOverlay] Current user from authStore:', user);
    console.log('[ChatOverlay] User ID being sent:', user?.id);
    console.log('[ChatOverlay] User ID type:', typeof user?.id);
    console.log('[ChatOverlay] Conversation ID:', currentConversationId);
    console.log('[ChatOverlay] Message:', textToSend.substring(0, 100));
    console.log('[ChatOverlay] =======================================');
    
    const result = await sendMessage(currentConversationId, textToSend, user.id);

    setIsLoading(false);

    if (result.success) {
      // Update conversation ID if it was just created
      if (!currentConversationId) {
        setCurrentConversationId(result.conversationId);
      }

      // Add AI response to UI with streaming effect
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: result.message,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Start streaming the text
      streamText(result.message, aiMessageId);
    } else {
      // Log detailed error information
      console.error('[ChatOverlay] Message send failed:', {
        error: result.error,
        details: result.details,
      });
      
      // Show error message with more details in development
      const isDevelopment = __DEV__;
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (isDevelopment && result.details) {
        errorContent += `\n\nDebug Info:\n• Error: ${result.details.originalError}\n• API URL: ${result.details.apiUrl}`;
      }
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
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

      console.log('[ChatOverlay] Selected file:', {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
      });

      // Show uploading message
      setIsUploading(true);
      const uploadingMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Uploading ${file.name}...`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, uploadingMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Upload file
      const uploadResult = await uploadFile(
        file.uri,
        file.name,
        file.mimeType,
        user.id
      );

      // Remove uploading message
      setMessages(prev => prev.filter(m => m.id !== uploadingMessage.id));
      setIsUploading(false);

      if (!uploadResult.success) {
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload file');
        return;
      }

      // Add success message from user
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `Uploaded file: ${file.name}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Add AI analysis message
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: `I've analyzed your file "${file.name}". ${uploadResult.extractedData.summary}\n\nI found ${uploadResult.extractedData.entries?.length || 0} data entries. You can now ask me questions about this data!`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Stream the AI message
      streamText(aiMessage.content, aiMessageId);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('[ChatOverlay] Error uploading file:', error);
      setIsUploading(false);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handleClose = () => {
    setInputText('');
    onClose();
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isStreaming = streamingMessageId === message.id;
    
    if (isUser) {
      // User messages with bubble
      return (
        <View
          key={message.id || index}
          style={[styles.messageContainer, styles.userMessageContainer]}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={[styles.messageBubble, styles.userBubble]}
          >
            <Text style={[styles.messageText, styles.userText]}>
              {message.content}
            </Text>
          </BlurView>
        </View>
      );
    } else {
      // AI messages without bubble, with markdown rendering
      const displayText = isStreaming ? streamingText : message.content;
      
      return (
        <View
          key={message.id || index}
          style={[styles.messageContainer, styles.aiMessageContainer]}
        >
          {isStreaming && streamingText === '' ? (
            // Show typing indicator at the start
            <View style={styles.typingIndicator}>
              <Animated.View 
                style={[
                  styles.typingDot,
                  { opacity: typingDotAnim }
                ]} 
              />
            </View>
          ) : (
            <View style={styles.markdownContainer}>
              <Markdown style={markdownStyles}>
                {displayText}
              </Markdown>
              {isStreaming && (
                <Animated.View 
                  style={[
                    styles.cursor,
                    { opacity: cursorBlinkAnim }
                  ]} 
                />
              )}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={100} tint="dark" style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>You-i</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {messages.length === 0 && !isLoading && (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>Start a conversation with You-i</Text>
                  <Text style={styles.emptySubtext}>Ask me anything about your wellness</Text>
                </View>
              )}
              
              {messages.map((message, index) => renderMessage(message, index))}
              
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color="#9ca3af" />
                    <Text style={styles.loadingText}>You-i is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.inputBlur}>
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    style={styles.attachButton}
                    onPress={handleFileUpload}
                    disabled={isLoading || isUploading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="attach"
                      size={24}
                      color={isLoading || isUploading ? '#9ca3af' : '#fff'}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Ask me anything..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={1000}
                    editable={!isLoading && !isUploading}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || isLoading || isUploading) && styles.sendButtonDisabled,
                    ]}
                    onPress={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading || isUploading}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={24}
                      color={inputText.trim() && !isLoading && !isUploading ? '#000' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    width: '100%',
    paddingRight: 8,
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  userBubble: {
    backgroundColor: 'rgba(234, 255, 97, 0.9)',
    borderColor: 'rgba(234, 255, 97, 0.3)',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#000',
  },
  aiText: {
    color: '#fff',
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loadingBubble: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    minHeight: 50,
    borderRadius: 24,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eaff61',
    opacity: 0.8,
  },
  markdownContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: '#eaff61',
    marginLeft: 2,
    marginTop: 2,
  },
});

// Markdown styles for AI responses
const markdownStyles = {
  body: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  strong: {
    color: '#eaff61',
    fontWeight: 'bold',
  },
  em: {
    color: '#fff',
    fontStyle: 'italic',
  },
  link: {
    color: '#60a5fa',
    textDecorationLine: 'underline',
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  code_inline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#eaff61',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fence: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#eaff61',
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  hr: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: 1,
    marginVertical: 16,
  },
};

