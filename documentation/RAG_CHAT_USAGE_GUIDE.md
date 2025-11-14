# RAG-Enhanced Chat Usage Guide

## Overview

The You-i chat system now automatically retrieves and uses your health data to provide personalized responses. No changes are needed to the frontend code - the RAG (Retrieval-Augmented Generation) system works transparently in the backend.

## How It Works

When you send a message, the system:
1. **Analyzes** your question to see if it's about health data
2. **Retrieves** relevant health metrics from your database
3. **Generates** a personalized response based on your actual data

## Example Conversations

### Getting Daily Stats
**You:** "How many steps did I take yesterday?"  
**You-i:** "Yesterday (November 12), you took 8,547 steps and walked 6.2 km. You also burned 342 active calories. Great job staying active!"

### Weekly Summaries
**You:** "How was my sleep last week?"  
**You-i:** "Last week (Nov 3-10), you averaged 7.2 hours of sleep per night. Your best night was Thursday with 8.1 hours, and your lowest was Monday with 6.3 hours. Try to maintain consistency for better recovery!"

### Monthly Progress
**You:** "Show me my workout progress this month"  
**You-i:** "This month you've completed 12 workouts totaling 385 minutes of exercise. That's an average of 3 workouts per week! You've done 7 strength sessions and 5 cardio sessions. Keep up the great work!"

### Recent Activity
**You:** "How have I been doing lately?"  
**You-i:** "Over the past 7 days, you've averaged 9,234 steps per day, 7.5 hours of sleep, and 45 minutes of exercise. Your heart rate has been healthy at an average of 68 bpm. You're doing well overall!"

### Specific Metrics
**You:** "What's my heart rate been like this week?"  
**You-i:** "This week your average heart rate has been 72 bpm, with a resting heart rate of 58 bpm. Your HRV (heart rate variability) averaged 45ms, which indicates good cardiovascular health."

## Supported Time References

You can ask about:
- **Today**: "today", "so far today"
- **Yesterday**: "yesterday"
- **This week**: "this week", "so far this week"
- **Last week**: "last week", "past week"
- **This month**: "this month", "so far this month"
- **Last month**: "last month", "past month"
- **Specific periods**: "last 7 days", "past 30 days", "last 3 months"
- **Recent**: "recently", "lately" (defaults to last 7 days)

## Supported Metrics

You can ask about any health metric:
- **Activity**: steps, distance, calories burned, exercise time, stairs climbed
- **Heart**: heart rate, resting heart rate, HRV
- **Sleep**: sleep duration, sleep quality
- **Body**: weight
- **Nutrition**: calories consumed, protein, carbs, fat, water
- **Workouts**: workout count, workout duration, strength sessions, cardio sessions

## General Conversation

The chat also handles general wellness questions without specific data:

**You:** "What should I focus on to improve my fitness?"  
**You-i:** "Based on general fitness principles, focus on: 1) Consistency in your workouts, 2) Getting 7-9 hours of quality sleep, 3) Staying hydrated, and 4) Balancing cardio and strength training. Would you like me to look at your recent data to give more personalized advice?"

**You:** "Hello!"  
**You-i:** "Hello! I'm You-i, your wellness assistant. I can help you understand your health data, track your progress, and provide personalized wellness guidance. What would you like to know?"

## Tips for Best Results

### Be Specific
✅ "How many steps did I take yesterday?"  
❌ "Steps?"

### Include Time References
✅ "What was my sleep like last week?"  
❌ "Tell me about sleep"

### Ask About Trends
✅ "Am I exercising more this month than last month?"  
✅ "How has my heart rate changed over the past 30 days?"

### Combine Metrics
✅ "Compare my steps and calories burned this week"  
✅ "How do my workouts correlate with my sleep?"

## No Data Available

If you haven't synced health data for the requested period:

**You:** "How many steps did I take last month?"  
**You-i:** "I don't have health data available for October 2025. Have you synced your health data recently? You can sync by going to the Data screen and connecting your health apps."

## Privacy & Data

- All health data stays in your secure Supabase database
- Only you can access your health data
- The AI (Gemini) only sees your data temporarily to generate responses
- No data is stored by Google or third parties
- RAG metadata (what data was retrieved) is stored with each message for transparency

## Frontend Integration

### No Changes Required
The existing chat service (`reactapp/services/chatService.js`) works without modifications:

```javascript
import { sendMessage } from '../services/chatService';

// Send a message - RAG happens automatically in the backend
const result = await sendMessage(conversationId, message, userId);

if (result.success) {
  console.log('AI Response:', result.message);
}
```

### Optional: Display RAG Metadata
If you want to show users what data was used, you can query the message metadata:

```javascript
// Get conversation with messages
const { conversation } = await getConversation(conversationId, userId);

conversation.messages.forEach(msg => {
  if (msg.metadata?.ragContext?.dataRetrieved) {
    console.log('Data used:', msg.metadata.ragContext);
    // Show badge: "Based on your data from last 7 days"
  }
});
```

## Testing

### Test Health Queries
Try these queries to test the RAG system:
1. "How many steps did I take yesterday?"
2. "What was my average sleep last week?"
3. "Show me my workouts this month"
4. "How have I been doing lately?"
5. "What's my current weight?"

### Test General Queries
These should work without retrieving health data:
1. "Hello, how are you?"
2. "What can you help me with?"
3. "Tell me about the importance of sleep"
4. "What are good fitness goals?"

### Check Backend Logs
Monitor the backend console for RAG activity:
```
[RAG] Analyzing query: How many steps did I take yesterday?
[RAG] Query analysis: { needsHealthData: true, timeRange: 'yesterday' }
[Chat] RAG context retrieved: { hasHealthData: true, dataTypes: ['daily_metrics'] }
```

## Troubleshooting

### AI Doesn't Use My Data
**Problem**: AI gives generic advice instead of using your data  
**Solution**: 
- Make sure you've synced health data recently
- Try being more specific with time references
- Check backend logs for RAG errors

### Wrong Time Period
**Problem**: AI shows data from wrong dates  
**Solution**:
- Be explicit with dates: "yesterday" vs "last week"
- Check your device timezone settings
- Report specific examples for improvement

### Slow Responses
**Problem**: Chat takes longer to respond  
**Solution**:
- RAG adds ~0.5-2 seconds for health queries
- This is normal - the system is querying your health database
- General queries (non-health) remain fast

## Future Enhancements

Coming soon:
- 📊 **Visual data**: Charts and graphs in responses
- 🎯 **Goal tracking**: "Am I on track for my 10,000 steps goal?"
- 📈 **Comparisons**: "Compare this week to last week"
- 💡 **Proactive insights**: "You've been sleeping less this week"
- 🔔 **Smart suggestions**: "Based on your data, try..."

## Support

For issues or questions:
1. Check backend logs for errors
2. Verify health data is syncing properly
3. Test with the example queries above
4. Review `backend/RAG_IMPLEMENTATION.md` for technical details

## Summary

The RAG-enhanced chat makes You-i truly personalized by automatically using your health data to answer questions. Just ask naturally about your health metrics, and You-i will provide data-driven insights!

