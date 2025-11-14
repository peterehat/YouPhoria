/**
 * Chat Service
 * 
 * API client for communicating with the backend chat endpoints.
 * Handles sending messages, fetching conversations, and managing chat history.
 */

import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// Backend API URL - update this based on your environment
// For physical devices, use your computer's IP address instead of localhost
// Example: 'http://192.168.1.100:3000/api/v1'
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * Get authentication headers with Supabase token
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
  };
}

/**
 * Send a message and get AI response
 * 
 * @param {string} conversationId - Optional conversation ID (creates new if not provided)
 * @param {string} message - User message
 * @param {string} userId - User ID
 * @returns {Promise<object>} Response with conversationId and AI message
 */
export async function sendMessage(conversationId, message, userId) {
  try {
    console.log('[ChatService] Sending message:', {
      conversationId,
      messageLength: message?.length,
      userId: userId?.substring(0, 8) + '...',
      apiUrl: API_BASE_URL,
    });

    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversationId,
        message,
        userId,
      }),
    });

    console.log('[ChatService] Response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('[ChatService] Server error:', data);
      throw new Error(data.error || 'Failed to send message');
    }

    console.log('[ChatService] Message sent successfully');

    return {
      success: true,
      conversationId: data.conversationId,
      message: data.message,
    };
  } catch (error) {
    console.error('[ChatService] Error sending message:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message === 'Network request failed' || error.message.includes('Network')) {
      errorMessage = 'Unable to connect to server. Please check your connection and ensure the backend is running at ' + API_BASE_URL;
    } else if (error.message.includes('Failed to create conversation')) {
      errorMessage = 'Server configuration error. Please check backend .env file has SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY set.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get all conversations for a user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object>} List of conversations
 */
export async function getConversations(userId) {
  try {
    console.log('[ChatService] Fetching conversations for userId:', userId);
    console.log('[ChatService] API URL:', `${API_BASE_URL}/chat/conversations?userId=${userId}`);
    
    const headers = await getAuthHeaders();
    console.log('[ChatService] Auth headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });
    
    const response = await fetch(`${API_BASE_URL}/chat/conversations?userId=${userId}`, {
      method: 'GET',
      headers,
    });

    console.log('[ChatService] Response status:', response.status);
    const data = await response.json();
    console.log('[ChatService] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch conversations');
    }

    console.log('[ChatService] Conversations count:', data.conversations?.length || 0);
    return {
      success: true,
      conversations: data.conversations || [],
    };
  } catch (error) {
    console.error('[ChatService] Error fetching conversations:', error);
    return {
      success: false,
      error: error.message,
      conversations: [],
    };
  }
}

/**
 * Get a specific conversation with all messages
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Conversation with messages
 */
export async function getConversation(conversationId, userId) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}?userId=${userId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch conversation');
    }

    return {
      success: true,
      conversation: data.conversation,
    };
  } catch (error) {
    console.error('[ChatService] Error fetching conversation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new conversation
 * 
 * @param {string} userId - User ID
 * @param {string} title - Conversation title
 * @returns {Promise<object>} Created conversation
 */
export async function createConversation(userId, title) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        title,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create conversation');
    }

    return {
      success: true,
      conversation: data.conversation,
    };
  } catch (error) {
    console.error('[ChatService] Error creating conversation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a conversation
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Success status
 */
export async function deleteConversation(conversationId, userId) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}?userId=${userId}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete conversation');
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('[ChatService] Error deleting conversation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

