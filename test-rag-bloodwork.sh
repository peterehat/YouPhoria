#!/bin/bash

# Test RAG Blood Work Retrieval
# This script tests the RAG system's ability to retrieve uploaded blood work data

set -e

echo "=========================================="
echo "RAG Blood Work Data Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f backend/.env ]; then
    echo "✅ Loading backend environment variables..."
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo "❌ backend/.env file not found"
    exit 1
fi

# Check required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables"
    echo "   SUPABASE_URL: ${SUPABASE_URL:0:20}..."
    echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+set}"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   Supabase URL: ${SUPABASE_URL}"
echo ""

# Step 1: Query Supabase directly for users with uploaded files
echo "=========================================="
echo "Step 1: Finding users with uploaded files"
echo "=========================================="
echo ""

echo "Querying uploaded_file_data table via Supabase REST API..."

# Query for distinct user IDs with uploaded files
USERS_RESPONSE=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/uploaded_file_data?select=user_id,file_name,upload_date&order=upload_date.desc&limit=10" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json")

echo "Response from Supabase:"
echo "$USERS_RESPONSE" | jq '.'
echo ""

# Extract the first user_id
USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.[0].user_id // empty')

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ No users found with uploaded files${NC}"
    echo "Please upload a file first through the app"
    exit 1
fi

echo -e "${GREEN}✅ Found test user: $USER_ID${NC}"
echo ""

# Step 2: Get detailed information about this user's uploaded files
echo "=========================================="
echo "Step 2: Checking uploaded files for user"
echo "=========================================="
echo ""

FILES_RESPONSE=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/uploaded_file_data?user_id=eq.${USER_ID}&select=*&order=upload_date.desc" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json")

echo -e "${BLUE}Uploaded Files for user $USER_ID:${NC}"
echo ""

FILE_COUNT=$(echo "$FILES_RESPONSE" | jq '. | length')

if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No files found for this user${NC}"
    exit 1
fi

# Display file information
echo "$FILES_RESPONSE" | jq -r '.[] | "📄 File: \(.file_name)
   ID: \(.id)
   Categories: \(.data_categories // [])
   Summary: \(.summary // "N/A")
   Date Range: \(.date_range_start // "N/A") to \(.date_range_end // "N/A")
   Upload Date: \(.upload_date)
   Has Extracted Data: \(if .extracted_data then "YES" else "NO" end)
   Entry Count: \(if .extracted_data.entries then (.extracted_data.entries | length) else 0 end)
"'

echo ""
echo -e "${GREEN}Total files: $FILE_COUNT${NC}"
echo ""

# Step 3: Show sample extracted data
echo "=========================================="
echo "Step 3: Sample Extracted Data"
echo "=========================================="
echo ""

SAMPLE_DATA=$(echo "$FILES_RESPONSE" | jq '.[0]')
HAS_EXTRACTED=$(echo "$SAMPLE_DATA" | jq -r '.extracted_data != null')

if [ "$HAS_EXTRACTED" = "true" ]; then
    echo -e "${GREEN}✅ File has extracted data${NC}"
    echo ""
    echo "Sample entries:"
    echo "$SAMPLE_DATA" | jq -r '.extracted_data.entries[0:3] // [] | .[] | "  • Date: \(.date // "N/A")
    Metrics: \(.metrics)
    Notes: \(.notes // "N/A")
"'
else
    echo -e "${RED}❌ File has NO extracted data${NC}"
    echo "This is the problem! Files need extracted_data to be used by RAG."
fi
echo ""

# Step 4: Test the backend API
echo "=========================================="
echo "Step 4: Testing Backend Upload API"
echo "=========================================="
echo ""

BACKEND_URL="http://localhost:3000"

# Check if backend is running
if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend server not running on $BACKEND_URL${NC}"
    echo ""
    echo "To start the backend:"
    echo "  cd backend && npm run dev"
    echo ""
    echo "Skipping backend API tests..."
    BACKEND_RUNNING=false
else
    echo -e "${GREEN}✅ Backend server is running${NC}"
    BACKEND_RUNNING=true
    echo ""
    
    # Test upload files endpoint
    echo "Testing GET /api/v1/upload/files..."
    
    UPLOAD_API_RESPONSE=$(curl -s -X GET \
        "$BACKEND_URL/api/v1/upload/files?userId=$USER_ID" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json")
    
    echo "Response:"
    echo "$UPLOAD_API_RESPONSE" | jq '.'
    echo ""
    
    API_FILE_COUNT=$(echo "$UPLOAD_API_RESPONSE" | jq '.files | length // 0')
    if [ "$API_FILE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Upload API returned $API_FILE_COUNT files${NC}"
    else
        echo -e "${RED}❌ Upload API returned no files${NC}"
    fi
    echo ""
fi

# Step 5: Test RAG retrieval
echo "=========================================="
echo "Step 5: Testing RAG with Blood Work Query"
echo "=========================================="
echo ""

if [ "$BACKEND_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  Skipping RAG test (backend not running)${NC}"
else
    echo "Sending chat message: 'How has my blood work been recently?'"
    echo ""
    
    # Create a timestamp for tracking logs
    TEST_TIMESTAMP=$(date +%s)
    
    CHAT_RESPONSE=$(curl -s -X POST \
        "$BACKEND_URL/api/v1/chat/message" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"userId\": \"$USER_ID\",
            \"message\": \"How has my blood work been recently?\"
        }")
    
    echo "Chat API Response:"
    echo "$CHAT_RESPONSE" | jq '.'
    echo ""
    
    # Check if response was successful
    if echo "$CHAT_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ Chat API call successful${NC}"
        
        MESSAGE=$(echo "$CHAT_RESPONSE" | jq -r '.message')
        
        # Check if response mentions blood work
        if echo "$MESSAGE" | grep -qi "blood\|lab\|test\|result\|cholesterol\|glucose\|hemoglobin"; then
            echo -e "${GREEN}✅ Response mentions blood work/lab data${NC}"
        else
            echo -e "${YELLOW}⚠️  Response doesn't reference blood work data${NC}"
            echo "   This suggests RAG may not be retrieving uploaded file data"
        fi
        
        # Check if response says no data
        if echo "$MESSAGE" | grep -qi "don't see\|couldn't\|no.*data\|not.*available"; then
            echo -e "${RED}❌ AI says it doesn't have blood work data${NC}"
            echo "   This confirms RAG is not retrieving uploaded files"
        fi
        
        echo ""
        echo -e "${BLUE}AI Response:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$MESSAGE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo -e "${RED}❌ Chat API call failed${NC}"
        ERROR_MSG=$(echo "$CHAT_RESPONSE" | jq -r '.error // "Unknown error"')
        echo "Error: $ERROR_MSG"
    fi
    echo ""
fi

# Step 6: Check backend logs
echo "=========================================="
echo "Step 6: Backend Logs Analysis"
echo "=========================================="
echo ""

if [ -f backend/logs/combined.log ]; then
    echo -e "${BLUE}Recent RAG-related log entries:${NC}"
    echo ""
    
    # Show last 100 lines and filter for RAG activity
    tail -100 backend/logs/combined.log | grep -i "RAG\|uploaded.*file\|retrieve.*health\|getUploadedFileData" | tail -20 || echo "No RAG logs found in recent entries"
    echo ""
else
    echo "⚠️  No backend logs found at backend/logs/combined.log"
fi

# Step 7: Diagnostic summary
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""

echo "Test User ID: $USER_ID"
echo "Files in Supabase: $FILE_COUNT"
echo ""

# Check for common issues
echo -e "${BLUE}Diagnostic Checks:${NC}"
echo ""

# Check 1: Extracted data
if [ "$HAS_EXTRACTED" = "true" ]; then
    echo -e "${GREEN}✅ Files have extracted_data populated${NC}"
else
    echo -e "${RED}❌ Files missing extracted_data${NC}"
    echo "   → This is likely the root cause"
    echo "   → Files need to be processed by Gemini AI during upload"
fi

# Check 2: Date ranges
DATE_RANGE_CHECK=$(echo "$FILES_RESPONSE" | jq -r '.[0].date_range_start // "null"')
if [ "$DATE_RANGE_CHECK" != "null" ]; then
    echo -e "${GREEN}✅ Files have date_range_start/end${NC}"
else
    echo -e "${YELLOW}⚠️  Files missing date ranges${NC}"
    echo "   → This could limit RAG retrieval"
fi

# Check 3: Categories
CATEGORIES_CHECK=$(echo "$FILES_RESPONSE" | jq -r '.[0].data_categories // [] | length')
if [ "$CATEGORIES_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ Files have data_categories${NC}"
else
    echo -e "${YELLOW}⚠️  Files missing data_categories${NC}"
fi

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. If extracted_data is missing:"
echo "   → Check upload controller logs during file upload"
echo "   → Verify Gemini API is processing files correctly"
echo "   → Re-upload a test file and watch backend logs"
echo ""
echo "2. If date ranges are missing:"
echo "   → RAG may not retrieve files without date context"
echo "   → Update query logic to include files with null dates"
echo ""
echo "3. Test with curl directly:"
echo "   → Use the commands below to test Supabase queries"
echo ""

# Provide curl commands for manual testing
echo -e "${BLUE}Manual Test Commands:${NC}"
echo ""
echo "# Query uploaded files:"
echo "curl -X GET \\"
echo "  '${SUPABASE_URL}/rest/v1/uploaded_file_data?user_id=eq.${USER_ID}&select=*' \\"
echo "  -H 'apikey: ${SUPABASE_SERVICE_ROLE_KEY}' \\"
echo "  -H 'Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}' | jq"
echo ""
echo "# Test chat endpoint:"
echo "curl -X POST \\"
echo "  'http://localhost:3000/api/v1/chat/message' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"userId\": \"${USER_ID}\", \"message\": \"What blood work data do you have for me?\"}' | jq"
echo ""

echo -e "${GREEN}✅ Test complete${NC}"
