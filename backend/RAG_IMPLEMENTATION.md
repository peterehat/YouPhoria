# RAG (Retrieval-Augmented Generation) Implementation

## Overview

The You-i chat system now uses RAG to provide personalized, data-driven health insights. When a user asks a question, the system:

1. **Analyzes** the query to determine if health data is needed
2. **Retrieves** relevant health data from the database based on time references
3. **Augments** the AI prompt with the retrieved data
4. **Generates** a personalized response using Gemini AI

## Architecture

### Components

#### 1. Query Analyzer (`src/utils/queryAnalyzer.ts`)
Parses natural language queries to extract:
- **Time references**: "yesterday", "last week", "past 30 days", etc.
- **Metric types**: steps, sleep, heart rate, calories, etc.
- **Health data need**: Boolean indicating if the query requires health data

**Supported Time References:**
- `today`, `yesterday`
- `this week`, `last week`
- `this month`, `last month`
- `last X days`, `past X days`
- `last X weeks`, `last X months`
- `recently`, `lately` (defaults to last 7 days)

**Supported Metrics:**
- Activity: steps, distance, active_calories, exercise_minutes, flights_climbed
- Heart: avg_heart_rate, resting_heart_rate, heart_rate_variability
- Sleep: sleep_hours
- Body: weight_kg
- Nutrition: protein_g, carbs_g, fat_g, calories_consumed, water_ml
- Workouts: workout_count, total_workout_minutes, strength_sessions, cardio_sessions

#### 2. Health Data Retrieval (`src/utils/healthDataRetrieval.ts`)
Backend service for querying Supabase health data:
- `getDailyMetrics()` - Retrieves aggregated daily health metrics
- `getHealthEvents()` - Retrieves workouts, meals, and other health events
- `getDataSummary()` - Calculates averages, totals, and statistics
- `formatXxxForContext()` - Formats data as natural language for AI

#### 3. RAG Service (`src/utils/ragService.ts`)
Orchestrates the RAG flow:
- `retrieveHealthContext()` - Main RAG function
  - Analyzes query using local pattern matching
  - Refines analysis using Gemini AI for ambiguous cases
  - Retrieves relevant health data from Supabase
  - Formats data as context
- `buildPromptWithContext()` - Constructs the complete AI prompt with health data

#### 4. Chat Controller (`src/controllers/chatController.ts`)
Integrates RAG into the chat endpoint:
- Calls RAG service to retrieve health context
- Builds prompt with health data
- Generates AI response
- Stores RAG metadata with the response

## RAG Flow

```
User Message
    ↓
Save to Database
    ↓
Query Analysis (Local Pattern Matching)
    ↓
AI Refinement (Gemini - for ambiguous queries)
    ↓
Determine Time Range
    ↓
Retrieve Health Data from Supabase
    ├── Daily Metrics (for short periods)
    ├── Summary Statistics (for longer periods)
    └── Health Events (workouts, meals)
    ↓
Format as Natural Language Context
    ↓
Build Complete Prompt
    ├── System Prompt (You-i personality)
    ├── Health Data Context
    ├── Conversation History
    └── Current Message
    ↓
Generate AI Response (Gemini)
    ↓
Save Response with RAG Metadata
    ↓
Return to User
```

## Data Retrieval Strategy

The system uses different retrieval strategies based on the time range:

### Short Periods (1-3 days)
- **Detailed daily metrics** with all available data points
- **Recent events** (workouts, meals) with full details
- Best for: "What did I do yesterday?", "How was my sleep last night?"

### Longer Periods (4+ days)
- **Summary statistics** (averages, totals)
- **Top 10 recent events**
- Best for: "How was my week?", "Show me my progress this month"

### Default Behavior
When no time reference is detected but health data is needed:
- Defaults to **last 7 days**
- Provides a balanced view of recent activity

## RAG Metadata

Each AI response stores metadata about the RAG context:

```json
{
  "ragContext": {
    "dataRetrieved": true,
    "timeRange": {
      "start": "2025-11-06T00:00:00.000Z",
      "end": "2025-11-13T12:34:56.789Z",
      "description": "last 7 days"
    },
    "metricsIncluded": ["steps", "sleep_hours", "exercise_minutes"],
    "dataTypes": ["daily_metrics", "health_events"]
  }
}
```

This metadata enables:
- Debugging and transparency
- Analytics on what data is being used
- Future improvements to RAG logic

## Example Queries

### Health-Related (RAG Enabled)
✅ "How many steps did I take yesterday?"
- Time: yesterday
- Metrics: steps
- Data: Daily metrics for Nov 12

✅ "What was my average sleep last week?"
- Time: last week (Nov 3-10)
- Metrics: sleep_hours
- Data: Summary statistics

✅ "Show me my workout progress this month"
- Time: this month (Nov 1-13)
- Metrics: workout_count, exercise_minutes
- Data: Summary + recent events

✅ "How have I been doing lately?"
- Time: last 7 days (default)
- Metrics: all
- Data: Summary statistics

### General Conversation (RAG Skipped)
❌ "Hello, how are you?"
- No health data needed
- Direct AI response

❌ "Tell me a joke"
- No health data needed
- Direct AI response

❌ "What can you help me with?"
- No health data needed
- Direct AI response about capabilities

## Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
- `GEMINI_API_KEY` - For AI analysis and response generation
- `SUPABASE_URL` - For health data queries
- `SUPABASE_SERVICE_ROLE_KEY` - For backend Supabase access

### Performance Considerations

**Query Analysis:**
- Local pattern matching: ~1ms
- AI refinement (when needed): ~500-1000ms
- Only used for ambiguous queries

**Data Retrieval:**
- Daily metrics query: ~50-200ms
- Events query: ~50-200ms
- Summary calculation: ~100-300ms

**Total RAG Overhead:**
- Simple queries: ~100-500ms
- Complex queries with AI refinement: ~1-2s

## Testing

### Unit Tests
Run the query analyzer tests:
```bash
cd backend
npx ts-node src/utils/testQueryAnalyzer.ts
```

### Integration Testing
Test the full RAG flow by sending messages through the chat API:

```bash
# Example: Health-related query
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "message": "How many steps did I take yesterday?"
  }'

# Example: General query (should skip RAG)
curl -X POST http://localhost:3000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "message": "Hello, how are you?"
  }'
```

### Monitoring
Check backend logs for RAG activity:
```
[RAG] Analyzing query: How many steps did I take yesterday?
[RAG] Query analysis: { needsHealthData: true, timeRange: 'yesterday', metrics: ['steps'] }
[RAG] Retrieving data for: { timeRange: 'yesterday', start: '2025-11-12', end: '2025-11-13' }
[Chat] RAG context retrieved: { hasHealthData: true, dataTypes: ['daily_metrics'], timeRange: 'yesterday' }
```

## Future Enhancements

### Potential Improvements
1. **Semantic Search**: Use embeddings for better metric matching
2. **Caching**: Cache recent RAG results for similar queries
3. **User Preferences**: Remember user's preferred time ranges
4. **Multi-turn Context**: Track what data was shown in previous messages
5. **Proactive Insights**: Suggest interesting patterns in the data
6. **Comparative Analysis**: "Compare this week to last week"
7. **Goal Tracking**: Integrate with user goals and targets

### Database Optimizations
- Add indexes for common RAG queries
- Consider materialized views for frequently accessed summaries
- Implement query result caching

## Troubleshooting

### RAG Not Retrieving Data
**Symptom**: AI responds without specific health data
**Possible Causes:**
1. Query not detected as health-related
   - Check query analyzer patterns in `queryAnalyzer.ts`
   - Add more keywords if needed
2. No data in database for the time range
   - Verify user has synced health data
   - Check date range calculation
3. Database query error
   - Check backend logs for Supabase errors
   - Verify RLS policies allow access

### Incorrect Time Range
**Symptom**: Wrong dates retrieved
**Solution:**
- Check `parseTimeReference()` function
- Verify timezone handling
- Test with `testQueryAnalyzer.ts`

### AI Refinement Failing
**Symptom**: Errors in RAG service
**Solution:**
- Check Gemini API key is valid
- Verify API quota not exceeded
- System falls back to local analysis if AI refinement fails

## API Changes

### Request (No Changes)
The chat message endpoint remains the same:
```
POST /api/v1/chat/message
{
  "userId": "string",
  "message": "string",
  "conversationId": "string" (optional)
}
```

### Response (Enhanced Metadata)
The response now includes RAG metadata in the database:
```
{
  "success": true,
  "conversationId": "uuid",
  "message": "AI response text"
}
```

The `chat_messages` table stores:
```json
{
  "metadata": {
    "ragContext": {
      "dataRetrieved": true,
      "timeRange": {...},
      "metricsIncluded": [...],
      "dataTypes": [...]
    }
  }
}
```

## Maintenance

### Regular Tasks
1. Monitor RAG performance metrics
2. Review false positives/negatives in query detection
3. Update metric patterns as new data types are added
4. Optimize slow queries identified in logs

### When Adding New Health Metrics
1. Add to `METRIC_METADATA` in metric registry
2. Update `extractMetrics()` patterns in `queryAnalyzer.ts`
3. Update formatting functions in `healthDataRetrieval.ts`
4. Test with new query patterns

## Credits

Implemented: November 2025
Architecture: RAG with dynamic time-based retrieval
AI Models: Google Gemini 2.5 Flash
Database: Supabase (PostgreSQL)

