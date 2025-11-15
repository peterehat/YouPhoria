import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { createError } from '../middleware/errorHandler';
import { retrieveHealthContext, buildPromptWithContext } from '../utils/ragService';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatController = {
  /**
   * Send a message and get AI response
   * POST /api/v1/chat/message
   */
  async sendMessage(req: Request, res: Response) {
    try {
      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
        return res.status(500).json({
          success: false,
          error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.',
        });
      }

      const { conversationId, message, userId } = req.body;

      // Log userId for troubleshooting
      console.log('[ChatController] ===== RECEIVED MESSAGE REQUEST =====');
      console.log('[ChatController] Full userId from request body:', userId);
      console.log('[ChatController] UserId type:', typeof userId);
      console.log('[ChatController] UserId length:', userId?.length);
      console.log('[ChatController] Request details:', {
        conversationId,
        messageLength: message?.length,
        messagePreview: message?.substring(0, 100),
      });
      console.log('[ChatController] ====================================');

      if (!message || !userId) {
        console.error('[ChatController] Missing required fields:', { hasMessage: !!message, hasUserId: !!userId });
        return res.status(400).json({
          success: false,
          error: 'Message and userId are required',
        });
      }

      let currentConversationId = conversationId;

      // If no conversation ID provided, create a new conversation
      if (!currentConversationId) {
        const title = message.substring(0, 100); // Use first 100 chars as title
        
        // Check if Supabase is configured
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('Supabase configuration missing:', {
            hasUrl: !!process.env.SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          });
          return res.status(500).json({
            success: false,
            error: 'Server configuration error: Supabase credentials not configured. Please check backend .env file.',
          });
        }

        const { data: newConversation, error: createError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            title: title,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', {
            error: createError,
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
          });
          return res.status(500).json({
            success: false,
            error: `Failed to create conversation: ${createError.message}`,
          });
        }

        currentConversationId = newConversation.id;
      }

      // Save user message to database
      const { error: userMessageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message,
        });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save message',
        });
      }

      // Get conversation history for context
      const { data: previousMessages, error: historyError } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching conversation history:', historyError);
      }

      // Prepare conversation history for Gemini (exclude the current message we just saved)
      const conversationHistory: ChatMessage[] = previousMessages
        ? previousMessages.slice(0, -1).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
        : [];

      // RAG: Retrieve health data context based on the user's query
      console.log('[ChatController] ===== CALLING RAG SERVICE =====');
      console.log('[ChatController] UserId being passed to RAG:', userId);
      console.log('[ChatController] UserId type:', typeof userId);
      console.log('[ChatController] Message:', message.substring(0, 100));
      console.log('[ChatController] =================================');
      
      const ragResult = await retrieveHealthContext(supabase, genAI, userId, message);
      
      if (!ragResult.success) {
        console.error('[Chat] RAG retrieval failed:', ragResult.error);
        // Continue without health context rather than failing
      } else {
        console.log('[Chat] RAG context retrieved:', {
          hasHealthData: ragResult.context.hasHealthData,
          dataTypes: ragResult.context.metadata.dataTypes,
          timeRange: ragResult.context.metadata.timeRange?.description,
        });
      }

      // System prompt for You-i personality
      const systemPrompt = `You are You-i, a helpful wellness AI assistant. You help users understand their health data and provide personalized wellness guidance. 
      
Be conversational, empathetic, and supportive. Provide actionable advice when appropriate, but always remind users to consult healthcare professionals for medical decisions.

When discussing health metrics, be specific and reference actual data when available. If you don't have specific data, ask clarifying questions to better understand the user's situation.

IMPORTANT: When displaying weight data to users, always use pounds (lbs) as the primary unit, as most users prefer imperial units. You may include kg in parentheses if helpful, but lead with lbs.`;

      // Build the complete prompt with RAG context
      const fullPrompt = buildPromptWithContext(
        systemPrompt,
        ragResult.context,
        conversationHistory,
        message
      );

      // Generate AI response using Gemini
      // Using gemini-2.5-flash (latest fast model as of Nov 2024)
      // Alternative: gemini-2.5-pro (more capable), gemini-2.0-flash (stable)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let aiResponse: string;
      try {
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        aiResponse = response.text();
      } catch (geminiError: any) {
        console.error('Error calling Gemini API:', geminiError);
        return res.status(500).json({
          success: false,
          error: `Gemini API error: ${geminiError.message || 'Failed to generate response'}. Please check your API key and try again.`,
        });
      }

      // Save AI response to database with RAG metadata
      const { error: aiMessageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            ragContext: ragResult.context.metadata,
          },
        });

      if (aiMessageError) {
        console.error('Error saving AI message:', aiMessageError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save AI response',
        });
      }

      res.json({
        success: true,
        conversationId: currentConversationId,
        message: aiResponse,
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message',
      });
    }
  },

  /**
   * Get all conversations for a user
   * GET /api/v1/chat/conversations
   */
  async getConversations(req: Request, res: Response) {
    try {
      const { userId } = req.query;

      console.log('[getConversations] Request received for userId:', userId);

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          chat_messages (
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[getConversations] Error fetching conversations:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch conversations',
        });
      }

      console.log('[getConversations] Raw conversations from DB:', JSON.stringify(conversations, null, 2));
      console.log('[getConversations] Conversations count:', conversations?.length || 0);

      // Format conversations with preview of last message
      const formattedConversations = conversations.map((conv: any) => {
        const messages = conv.chat_messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        return {
          id: conv.id,
          title: conv.title,
          preview: lastMessage ? lastMessage.content.substring(0, 100) : '',
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messageCount: messages.length,
        };
      });

      console.log('[getConversations] Formatted conversations:', JSON.stringify(formattedConversations, null, 2));

      res.json({
        success: true,
        conversations: formattedConversations,
      });
    } catch (error) {
      console.error('[getConversations] Error in getConversations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
      });
    }
  },

  /**
   * Get a specific conversation with all messages
   * GET /api/v1/chat/conversations/:id
   */
  async getConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      // Fetch conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch messages',
        });
      }

      res.json({
        success: true,
        conversation: {
          ...conversation,
          messages: messages || [],
        },
      });
    } catch (error) {
      console.error('Error in getConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation',
      });
    }
  },

  /**
   * Create a new conversation
   * POST /api/v1/chat/conversations
   */
  async createConversation(req: Request, res: Response) {
    try {
      const { userId, title } = req.body;

      if (!userId || !title) {
        return res.status(400).json({
          success: false,
          error: 'userId and title are required',
        });
      }

      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title: title,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create conversation',
        });
      }

      res.json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error('Error in createConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create conversation',
      });
    }
  },

  /**
   * Update a conversation (e.g., rename)
   * PATCH /api/v1/chat/conversations/:id
   */
  async updateConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, title } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'title is required',
        });
      }

      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .update({ title })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update conversation',
        });
      }

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found',
        });
      }

      res.json({
        success: true,
        conversation,
        message: 'Conversation updated successfully',
      });
    } catch (error) {
      console.error('Error in updateConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update conversation',
      });
    }
  },

  /**
   * Delete a conversation
   * DELETE /api/v1/chat/conversations/:id
   */
  async deleteConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete conversation',
        });
      }

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete conversation',
      });
    }
  },
};

