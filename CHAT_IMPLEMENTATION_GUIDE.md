# You-i Chat Interface Implementation Guide

## Overview

This document describes the ChatGPT-style conversational interface implementation for the You-i wellness assistant. The feature includes:

- Full-screen chat overlay with ChatGPT-like interface
- Persistent chat history stored in Supabase
- Google Gemini AI integration for intelligent responses
- RAG-ready architecture for health data context
- Chat history management in the Insights screen

## Architecture

### Frontend (React Native)
- **HomeScreen.js** - Simplified input with integrated send button
- **ChatOverlay.js** - Full-screen modal chat interface
- **InsightsScreen.js** - Chat history list and management
- **chatService.js** - API client for backend communication

### Backend (Node.js/Express)
- **chatController.ts** - Chat endpoints and Gemini integration
- **chat.ts** - Route definitions
- **api.ts** - Updated to include chat routes

### Database (Supabase)
- **chat_conversations** - Stores chat sessions
- **chat_messages** - Stores individual messages
- Row Level Security (RLS) policies for user isolation

## Setup Instructions

### 1. Database Migration

Run the migration in your Supabase SQL editor:

```bash
# Navigate to Supabase dashboard > SQL Editor
# Run: reactapp/database-migrations/005_create_chat_tables.sql
```

This creates:
- `chat_conversations` table
- `chat_messages` table
- Indexes for performance
- RLS policies for security
- Trigger to update conversation timestamps

### 2. Backend Configuration

#### Install Dependencies

The backend dependencies have been installed. Verify with:

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,exp://192.168.1.1:19000
```

#### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

#### Start Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000`

### 3. Frontend Configuration

#### Environment Variables

Create or update `.env` in the `reactapp` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

For production, update this to your deployed backend URL.

#### Start React Native App

```bash
cd reactapp
npm start
```

## Features

### Home Screen

**Changes:**
- Text updated: "Let's talk about your wellness."
- Placeholder: "Ask me anything..."
- Integrated send button (right side of input field)
- All animations removed for cleaner UX
- Clicking send opens full-screen chat overlay

### Chat Overlay

**Features:**
- Full-screen modal with slide-up animation
- ChatGPT-style message bubbles
- User messages (right, yellow background)
- AI messages (left, translucent background)
- Auto-scroll to bottom on new messages
- Loading indicator while AI responds
- Keyboard-aware layout
- Close button returns to home

**Behavior:**
- Creates new conversation on first message
- Maintains conversation context
- Saves all messages to database
- Can be opened with initial message from home screen

### Insights Screen

**Features:**
- List of all user conversations
- Shows conversation title, preview, and date
- "Start New Conversation" button
- Tap conversation to reopen in chat overlay
- Swipe/tap delete for conversations
- Empty state when no conversations exist
- Pull to refresh

**Integration:**
- Opens ChatOverlay with selected conversation
- Refreshes list when chat closes
- Maintains "Update Profile" button

## API Endpoints

### POST /api/v1/chat/message
Send a message and get AI response

**Request:**
```json
{
  "conversationId": "uuid or null",
  "message": "string",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "uuid",
  "message": "AI response text"
}
```

### GET /api/v1/chat/conversations?userId=uuid
Get all conversations for a user

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "title": "string",
      "preview": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "messageCount": 5
    }
  ]
}
```

### GET /api/v1/chat/conversations/:id?userId=uuid
Get specific conversation with messages

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "title": "string",
    "messages": [
      {
        "id": "uuid",
        "role": "user|assistant",
        "content": "string",
        "created_at": "timestamp"
      }
    ]
  }
}
```

### DELETE /api/v1/chat/conversations/:id?userId=uuid
Delete a conversation

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

## Future Enhancements

### Planned Features
1. **RAG Integration** - Connect to existing `healthDataQueryService.js` to provide health context
2. **Streaming Responses** - Implement SSE for real-time AI response streaming
3. **Conversation Titles** - Auto-generate meaningful titles from first message
4. **Message Editing** - Allow users to edit their messages
5. **Conversation Search** - Search through chat history
6. **Export Conversations** - Export chat history as PDF or text
7. **Voice Input** - Add voice-to-text for messages
8. **Suggested Questions** - Show relevant health questions based on user data

### RAG Integration Example

To integrate health data context, update `chatController.ts`:

```typescript
import { exportForRAG } from '../../reactapp/services/healthDataQueryService';

// In sendMessage function, before calling Gemini:
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30); // Last 30 days

const healthContext = await exportForRAG(userId, startDate, endDate, {
  includeDailyMetrics: true,
  includeEvents: true,
});

// Add health context to system prompt
const systemPrompt = `You are You-i, a helpful wellness AI assistant...

User's Recent Health Data:
${healthContext.chunks.map(chunk => chunk.content).join('\n\n')}

Use this data to provide personalized insights and recommendations.`;
```

## Testing

### Manual Testing Checklist

- [ ] Home screen shows new text and integrated button
- [ ] Send button opens chat overlay
- [ ] Chat overlay displays correctly
- [ ] Messages send and receive responses
- [ ] Messages persist in database
- [ ] Insights screen shows conversation list
- [ ] Can reopen existing conversations
- [ ] Can delete conversations
- [ ] Pull to refresh works
- [ ] Keyboard behavior is correct
- [ ] Animations are smooth

### Backend Testing

Test endpoints with curl:

```bash
# Send message
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"your-user-id"}'

# Get conversations
curl http://localhost:3000/api/v1/chat/conversations?userId=your-user-id
```

## Troubleshooting

### Backend Issues

**Error: GEMINI_API_KEY not found**
- Ensure `.env` file exists in backend directory
- Verify GEMINI_API_KEY is set correctly
- Restart backend server after adding env vars

**Error: Cannot connect to Supabase**
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Verify Supabase project is active
- Check network connectivity

### Frontend Issues

**Error: Cannot connect to backend**
- Verify backend server is running
- Check EXPO_PUBLIC_API_URL in reactapp/.env
- For physical device testing, use your computer's IP address

**Chat overlay doesn't open**
- Check console for errors
- Verify ChatOverlay import in HomeScreen.js
- Ensure user is authenticated

**Messages not persisting**
- Check database migration was run
- Verify RLS policies are correct
- Check user authentication token

## Files Modified/Created

### Database
- ✅ `reactapp/database-migrations/005_create_chat_tables.sql`

### Backend
- ✅ `backend/package.json` (updated)
- ✅ `backend/tsconfig.json` (created)
- ✅ `backend/src/controllers/chatController.ts` (created)
- ✅ `backend/src/routes/chat.ts` (created)
- ✅ `backend/src/routes/api.ts` (updated)

### Frontend
- ✅ `reactapp/services/chatService.js` (created)
- ✅ `reactapp/components/ChatOverlay.js` (created)
- ✅ `reactapp/components/HomeScreen.js` (refactored)
- ✅ `reactapp/components/InsightsScreen.js` (updated)

## Support

For issues or questions:
1. Check this guide thoroughly
2. Review console logs for errors
3. Verify all environment variables are set
4. Ensure database migration was successful
5. Test backend endpoints independently

## License

Part of the YouPhoria wellness platform.

