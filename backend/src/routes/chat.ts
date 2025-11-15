import { Router } from 'express';
import { chatController } from '../controllers/chatController';

export const chatRouter = Router();

// Send a message and get AI response
chatRouter.post('/message', chatController.sendMessage);

// Get all conversations for a user
chatRouter.get('/conversations', chatController.getConversations);

// Get a specific conversation with messages
chatRouter.get('/conversations/:id', chatController.getConversation);

// Create a new conversation
chatRouter.post('/conversations', chatController.createConversation);

// Update a conversation (e.g., rename)
chatRouter.patch('/conversations/:id', chatController.updateConversation);

// Delete a conversation
chatRouter.delete('/conversations/:id', chatController.deleteConversation);

