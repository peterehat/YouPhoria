# RAG Blood Work Retrieval Fix

**Date:** November 15, 2024  
**Issue:** RAG system was not retrieving uploaded blood work/lab results when users asked about them  
**Status:** ✅ Fixed

## Problem

When users uploaded blood work PDFs and asked questions like "How has my blood work been recently?", the AI would respond that it didn't have any blood work data, even though the files were successfully uploaded and processed in the database.

### Root Causes

1. **Missing Keywords in Query Analyzer**
   - The `queryAnalyzer.ts` didn't recognize blood work/lab-related terms
   - Queries containing "blood work", "lab results", "cholesterol", "thyroid", etc. were not flagged as needing health data
   - This caused the RAG system to skip data retrieval entirely

2. **Overly Restrictive Date Filtering**
   - The `getUploadedFileData()` function filtered files based on date ranges
   - When users asked about "recent" blood work, it defaulted to last 7 days
   - Lab results from 2024-09-11 or 2018 were excluded because they didn't overlap with the query date range
   - This was too restrictive for medical documents which remain relevant for months/years

## Solution

### 1. Enhanced Query Analyzer Keywords

**File:** `backend/src/utils/queryAnalyzer.ts`

Added comprehensive lab work and medical test keywords to the `needsHealthData()` function:

```typescript
// Lab work and medical tests
'blood work', 'bloodwork', 'lab results', 'lab test', 'labs', 'test results',
'cholesterol', 'glucose', 'a1c', 'hemoglobin', 'thyroid', 'tsh', 'vitamin',
'lipid', 'metabolic', 'cbc', 'cmp', 'bmp', 'panel', 'biomarker', 'biomarkers',
'testosterone', 'estrogen', 'hormone', 'cortisol', 'ferritin', 'iron',
'kidney', 'liver', 'creatinine', 'bun', 'alt', 'ast', 'egfr',
```

This ensures queries about blood work are recognized as health-related and trigger RAG retrieval.

### 2. Improved Date Filtering for Uploaded Files

**File:** `backend/src/utils/healthDataRetrieval.ts`

Modified `getUploadedFileData()` to use a more lenient date filter:

**Before:**
```typescript
// Only included files where date_range overlapped with query range
query = query.or(
  `date_range_start.is.null,and(date_range_start.lte.${endDateStr},date_range_end.gte.${startDateStr})`
);
```

**After:**
```typescript
// Include files where:
// 1. date_range_start is null (no date info) - always include
// 2. date_range overlaps with query range
// 3. OR file was uploaded recently (within 6 months of query end date)
const sixMonthsAgo = new Date(endDate);
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

query = query.or(
  `date_range_start.is.null,and(date_range_start.lte.${endDateStr},date_range_end.gte.${startDateStr}),upload_date.gte.${sixMonthsAgoStr}`
);
```

This ensures recently uploaded files are included even if the lab data is older, which is appropriate for medical records.

### 3. Enhanced Logging

Added detailed logging to help debug RAG retrieval:

```typescript
console.log('[HealthDataRetrieval-getUploadedFileData] Date range:', {
  start: startDate.toISOString(),
  end: endDate.toISOString(),
});

// Log details about what was retrieved
if (data && data.length > 0) {
  console.log('[HealthDataRetrieval-getUploadedFileData] File details:');
  data.forEach((file: any) => {
    console.log(`  - ${file.file_name}: categories=${file.data_categories}, date_range=${file.date_range_start} to ${file.date_range_end}, entries=${file.extracted_data?.entries?.length || 0}`);
  });
}
```

## Testing

### Test Script

Created `test-rag-bloodwork.sh` to diagnose RAG issues:

```bash
./test-rag-bloodwork.sh
```

The script:
1. Queries Supabase for users with uploaded files
2. Checks file metadata (extracted_data, date_ranges, categories)
3. Tests the backend upload API
4. Sends test chat messages about blood work
5. Analyzes backend logs for RAG activity
6. Provides diagnostic summary and recommendations

### Test Results

**Before Fix:**
```
User: "How has my blood work been recently?"
AI: "I don't see any specific information about your blood work results..."
```

**After Fix:**
```
User: "How has my blood work been recently?"
AI: "Based on the information I have, your most recent lab results are from 
September 11, 2024... Here's a summary of what we see:

Good News First!
- Thyroid Function: Your TSH (1.370 UIU/mL) and Free T4 (1.68 ng/dL) 
  levels were both comfortably within the normal ranges...
- Lipid Panel: Your cholesterol levels looked excellent! Your Total 
  Cholesterol (165 mg/dL), Triglycerides (88 mg/dL)..."
```

### Manual Testing Commands

```bash
# Test blood work query
curl -X POST 'http://localhost:3000/api/v1/chat/message' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "YOUR_USER_ID", "message": "How has my blood work been recently?"}' | jq

# Test cholesterol query
curl -X POST 'http://localhost:3000/api/v1/chat/message' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "YOUR_USER_ID", "message": "What were my cholesterol levels?"}' | jq

# Test TSH query
curl -X POST 'http://localhost:3000/api/v1/chat/message' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "YOUR_USER_ID", "message": "Show me my TSH levels"}' | jq
```

## Impact

### What Works Now

✅ Users can ask about blood work using natural language:
- "How has my blood work been recently?"
- "What were my cholesterol levels?"
- "Show me my TSH levels"
- "What do my lab results show?"
- "How is my thyroid?"

✅ RAG retrieves uploaded lab results even if:
- The lab data is from several months ago
- The user asks about "recent" data (defaults to 7 days but includes uploads from last 6 months)
- Files have older date ranges (2018, 2024, etc.)

✅ AI provides detailed, personalized responses:
- References specific lab values
- Compares to reference ranges
- Highlights abnormal results
- Provides context and recommendations

### Data Retrieved

The RAG system now successfully retrieves:
- Lab result PDFs (LabCorp, Intermountain, etc.)
- Extracted data with specific values
- Categories (lab_results, thyroid_panel, lipid_panel, etc.)
- Date ranges and summaries
- All entries from uploaded files

## Related Files

- `backend/src/utils/queryAnalyzer.ts` - Query keyword matching
- `backend/src/utils/healthDataRetrieval.ts` - Data retrieval logic
- `backend/src/utils/ragService.ts` - RAG orchestration
- `backend/src/controllers/chatController.ts` - Chat endpoint
- `test-rag-bloodwork.sh` - Diagnostic test script

## Future Improvements

1. **Smarter Date Filtering**
   - Consider lab result type (some stay relevant longer than others)
   - Allow users to specify time ranges explicitly
   - Show most recent results first

2. **Enhanced Context**
   - Compare current results to previous results
   - Track trends over time
   - Flag significant changes

3. **Better Categorization**
   - Automatically categorize lab tests by system (thyroid, lipid, metabolic, etc.)
   - Group related tests together
   - Prioritize abnormal results

4. **User Feedback**
   - Add ability to ask follow-up questions about specific results
   - Allow users to mark results as important
   - Support annotations and notes

## Deployment Notes

- Changes are backward compatible
- No database migrations required
- Restart backend server to apply changes
- Test with existing uploaded files

## Support

If users still report issues with blood work retrieval:

1. Check backend logs for RAG activity:
   ```bash
   tail -f backend/logs/combined.log | grep RAG
   ```

2. Verify file has extracted_data:
   ```bash
   curl -X GET "${SUPABASE_URL}/rest/v1/uploaded_file_data?user_id=eq.USER_ID&select=*" \
     -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" | jq
   ```

3. Run diagnostic script:
   ```bash
   ./test-rag-bloodwork.sh
   ```

4. Check query analyzer recognizes the keywords:
   - Add console.log in `queryAnalyzer.ts` `needsHealthData()` function
   - Verify `needsHealthData` returns true for blood work queries

