/**
 * Chat Service
 * 
 * API client for communicating with the backend chat endpoints.
 * Handles sending messages, fetching conversations, and managing chat history.
 */

import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// Backend API URL - automatically switches between dev and prod
// Priority: 1. Environment variable, 2. app.json, 3. Default based on __DEV__
const getApiUrl = () => {
  // Check environment variable first (allows override)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Check app.json
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Default based on development mode
  if (__DEV__) {
    // For simulator, use localhost; for production, use Railway
    return 'http://localhost:3000/api/v1';
  } else {
    // Production: use Railway backend
    return 'https://you-i-api-production.up.railway.app/api/v1';
  }
};

const API_BASE_URL = getApiUrl();

// Log API configuration on module load
console.log('[ChatService] API Configuration:', {
  environment: __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION',
  apiUrl: API_BASE_URL,
  isLocalhost: API_BASE_URL.includes('localhost'),
  isLocalIP: API_BASE_URL.match(/192\.168\.|10\.|172\./),
  isProduction: API_BASE_URL.includes('https://'),
});

// Warn if using development URL in production build
if (!__DEV__ && (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('192.168.') || API_BASE_URL.includes('10.') || API_BASE_URL.includes('172.'))) {
  console.warn('⚠️ [ChatService] WARNING: Production build is configured with a development/local API URL!');
  console.warn('⚠️ [ChatService] Current API URL:', API_BASE_URL);
  console.warn('⚠️ [ChatService] Please update app.json extra.apiUrl to your production backend URL');
}

/**
 * Detect network error type and provide user-friendly message
 */
function getNetworkErrorMessage(error, apiUrl) {
  const errorMsg = error.message.toLowerCase();
  
  // Network timeout
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return {
      title: 'Connection Timeout',
      message: 'The server is taking too long to respond. Please check your internet connection and try again.',
      technical: `Timeout connecting to ${apiUrl}`,
    };
  }
  
  // Network request failed (no connection)
  if (errorMsg.includes('network request failed') || errorMsg.includes('network error')) {
    // Check if using local IP (development)
    if (apiUrl.includes('192.168.') || apiUrl.includes('10.') || apiUrl.includes('172.') || apiUrl.includes('localhost')) {
      return {
        title: 'Development Server Not Reachable',
        message: 'Cannot connect to the development server. Make sure the backend is running and your device is on the same network.',
        technical: `Cannot reach ${apiUrl}. This is a local development URL.`,
      };
    }
    
    return {
      title: 'No Internet Connection',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      technical: `Network request failed to ${apiUrl}`,
    };
  }
  
  // Server error (500, 502, 503, etc.)
  if (errorMsg.includes('server error') || errorMsg.includes('internal error')) {
    return {
      title: 'Server Error',
      message: 'The server encountered an error. Please try again in a few moments.',
      technical: error.message,
    };
  }
  
  // Default error
  return {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please try again.',
    technical: error.message,
  };
}

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
    console.error('[ChatService] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      apiUrl: API_BASE_URL,
    });
    
    // Get user-friendly error message
    const errorInfo = getNetworkErrorMessage(error, API_BASE_URL);
    
    return {
      success: false,
      error: errorInfo.message,
      errorTitle: errorInfo.title,
      details: {
        originalError: error.message,
        technical: errorInfo.technical,
        apiUrl: API_BASE_URL,
      },
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
    console.error('[ChatService] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      apiUrl: API_BASE_URL,
    });
    
    // Get user-friendly error message
    const errorInfo = getNetworkErrorMessage(error, API_BASE_URL);
    
    return {
      success: false,
      error: errorInfo.message,
      errorTitle: errorInfo.title,
      conversations: [],
      details: {
        originalError: error.message,
        technical: errorInfo.technical,
        apiUrl: API_BASE_URL,
      },
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

