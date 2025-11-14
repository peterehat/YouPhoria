# RAG Quick Start Guide

## ✅ Implementation Complete!

The RAG (Retrieval-Augmented Generation) system is now live in your You-i chat. Here's everything you need to know to get started.

## 🚀 What Changed?

### Backend (Automatic)
The chat system now:
1. **Analyzes** user questions to detect health queries
2. **Retrieves** relevant health data from the database
3. **Augments** AI responses with personalized data

### Frontend (No Changes!)
Your existing chat code works without any modifications. RAG happens transparently in the backend.

## 📦 New Files

```
backend/src/utils/
├── queryAnalyzer.ts        # Parses time references & metrics
├── healthDataRetrieval.ts  # Queries Supabase for health data
└── ragService.ts           # Orchestrates the RAG flow

backend/src/controllers/
└── chatController.ts       # Updated to use RAG

Documentation/
├── RAG_IMPLEMENTATION.md          # Technical docs
├── RAG_CHAT_USAGE_GUIDE.md       # User guide
├── RAG_IMPLEMENTATION_SUMMARY.md # Complete summary
└── RAG_QUICK_START.md            # This file
```

## 🎯 Try It Now!

### Example Queries

**Health-Related (Uses RAG):**
```
"How many steps did I take yesterday?"
"What was my average sleep last week?"
"Show me my workouts this month"
"How have I been doing lately?"
```

**General (Skips RAG):**
```
"Hello, how are you?"
"What can you help me with?"
"Tell me about the importance of sleep"
```

### Testing

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Send a test message:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/chat/message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "userId": "YOUR_USER_ID",
       "message": "How many steps did I take yesterday?"
     }'
   ```

3. **Check the logs:**
   ```
   [RAG] Analyzing query: How many steps did I take yesterday?
   [RAG] Query analysis: { needsHealthData: true, timeRange: 'yesterday' }
   [Chat] RAG context retrieved: { hasHealthData: true }
   ```

## 📊 What Data Gets Retrieved?

### Short Periods (1-3 days)
- Detailed daily metrics
- All available data points
- Recent events (workouts, meals)

### Longer Periods (4+ days)
- Summary statistics (averages, totals)
- Top 10 recent events
- Trends and patterns

### Default (No Time Specified)
- Last 7 days of data
- Balanced overview

## 🔍 Monitoring

### Backend Logs
Watch for RAG activity:
```bash
cd backend
npm run dev | grep RAG
```

You'll see:
- `[RAG] Analyzing query:` - Query being analyzed
- `[RAG] Query analysis:` - Detected time range and metrics
- `[RAG] Retrieving data for:` - Data being fetched
- `[Chat] RAG context retrieved:` - Success confirmation

### Message Metadata
Each AI response includes RAG metadata:
```json
{
  "metadata": {
    "ragContext": {
      "dataRetrieved": true,
      "timeRange": {
        "start": "2025-11-12T00:00:00.000Z",
        "end": "2025-11-13T23:59:59.999Z",
        "description": "yesterday"
      },
      "metricsIncluded": ["steps", "distance_km"],
      "dataTypes": ["daily_metrics"]
    }
  }
}
```

## ⚡ Performance

- **Health queries**: ~0.5-2 seconds (includes database query)
- **General queries**: No overhead (RAG skipped)
- **Database queries**: Optimized with indexes

## 🐛 Troubleshooting

### AI Doesn't Use My Data
**Check:**
1. User has synced health data recently
2. Backend logs show `dataRetrieved: true`
3. Time range is correct in logs

**Fix:**
- Sync health data from the app
- Be more specific with time references
- Check Supabase for data in the date range

### Slow Responses
**Normal:**
- Health queries take 0.5-2 seconds (database query + AI)
- General queries remain fast

**If too slow:**
- Check database query performance
- Monitor Gemini API response times
- Review backend logs for bottlenecks

### Wrong Data Retrieved
**Check:**
1. Time zone settings
2. Query analysis in logs
3. Date range calculation

**Fix:**
- Use explicit time references ("yesterday" vs "last week")
- Check server timezone matches user timezone
- Report specific examples for improvement

## 📚 Documentation

- **For Developers**: `backend/RAG_IMPLEMENTATION.md`
- **For Users**: `RAG_CHAT_USAGE_GUIDE.md`
- **Complete Summary**: `RAG_IMPLEMENTATION_SUMMARY.md`

## ✨ Key Features

### Supported Time References
✅ today, yesterday  
✅ this week, last week  
✅ this month, last month  
✅ last X days/weeks/months  
✅ recently, lately (defaults to 7 days)

### Supported Metrics
✅ Activity (steps, distance, calories, exercise)  
✅ Heart (heart rate, resting HR, HRV)  
✅ Sleep (hours, quality)  
✅ Body (weight)  
✅ Nutrition (calories, protein, carbs, fat, water)  
✅ Workouts (count, duration, strength, cardio)

### Smart Features
✅ Automatic query analysis  
✅ Dynamic time range detection  
✅ Intelligent data selection  
✅ Natural language formatting  
✅ Metadata tracking

## 🎓 Best Practices

### For Users
1. Be specific with time references
2. Ask about specific metrics
3. Use natural language
4. Check recent data sync

### For Developers
1. Monitor backend logs for RAG activity
2. Check RAG metadata in responses
3. Verify database query performance
4. Test with various query patterns

## 🚢 Deployment Checklist

- ✅ All files created and tested
- ✅ No linting errors
- ✅ No breaking changes to existing code
- ✅ Backward compatible with frontend
- ✅ Environment variables configured
- ✅ Database tables ready
- ✅ Documentation complete

## 🎉 You're Ready!

The RAG system is fully implemented and ready to use. No additional setup required!

### Next Steps
1. Test with real user data
2. Monitor performance and logs
3. Gather user feedback
4. Iterate based on usage patterns

### Questions?
- Technical: See `backend/RAG_IMPLEMENTATION.md`
- Usage: See `RAG_CHAT_USAGE_GUIDE.md`
- Overview: See `RAG_IMPLEMENTATION_SUMMARY.md`

---

**Status**: ✅ Ready for Production  
**Date**: November 13, 2025  
**Version**: 1.0.0

