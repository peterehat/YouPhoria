# PDF OCR Testing Guide

Quick guide to test the enhanced PDF processing with automatic OCR fallback.

## Quick Test

### 1. Restart Backend

```bash
cd backend
npm run dev
```

### 2. Test with Different PDF Types

#### Test A: Text-based PDF (Fast Path)
1. Create a simple text PDF or use any digital document
2. Upload via app
3. Should process in 2-5 seconds
4. Check logs for: `[FileParser] Successfully extracted text from PDF`

#### Test B: Scanned PDF (OCR Path)
1. Take a photo of a health document
2. Convert to PDF (or use the problematic PDF from the screenshot)
3. Upload via app
4. Should process in 5-15 seconds
5. Check logs for: `[FileParser] Using AI Vision for OCR`
6. Verify data is extracted (not "0 data entries")

### 3. Check Backend Logs

```bash
# Watch logs in real-time
tail -f backend/logs/combined.log

# Look for these indicators:
# - "Successfully extracted text from PDF" = Fast path
# - "Using AI Vision for OCR" = OCR path
# - "Sending PDF document to Gemini Vision API" = Vision processing
# - "Extracted data from PDF document" = Success
```

## Detailed Testing

### Test Case 1: Blood Test Results (Scanned)

**File:** Blood-Test-SPG_KONICA_24091312140.pdf (from your screenshot)

**Expected Behavior:**
1. Upload the file
2. Backend detects no text via pdf-parse
3. Automatically sends to Gemini Vision
4. Gemini performs OCR
5. Extracts all visible metrics
6. Returns structured data

**Success Criteria:**
- ✅ Upload completes without error
- ✅ Summary shows extracted information
- ✅ More than 0 data entries found
- ✅ Can ask questions about the data

**How to Test:**
```javascript
// In the app, upload the file and check the response
// Should see something like:

{
  "success": true,
  "extractedData": {
    "dataType": "lab_results",
    "entries": [
      {
        "date": "2024-09-13",
        "category": "medical",
        "metrics": {
          "glucose_mg_dl": 95,
          // ... more metrics
        }
      }
    ],
    "summary": "Blood test results showing...",
    "confidence": 0.85
  }
}
```

### Test Case 2: Fitness App Screenshot

**File:** Screenshot of Apple Health, Fitbit, etc.

**Steps:**
1. Take screenshot of health app
2. Save as PDF
3. Upload
4. Verify steps, calories, etc. are extracted

### Test Case 3: Prescription Document

**File:** Photo of prescription

**Steps:**
1. Take photo of prescription
2. Convert to PDF
3. Upload
4. Verify medication names and dosages extracted

### Test Case 4: Mixed Content PDF

**File:** PDF with both text and images

**Steps:**
1. Create PDF with text + embedded images
2. Upload
3. Verify both text and image content extracted

## Verification Checklist

### Backend Verification

- [ ] Backend starts without errors
- [ ] GEMINI_API_KEY is set in .env
- [ ] File upload endpoint responds
- [ ] Logs show processing steps
- [ ] Vision API is called for scanned PDFs
- [ ] Extracted data is saved to database

### Frontend Verification

- [ ] Upload button works
- [ ] File picker opens
- [ ] Upload progress shows
- [ ] Success message displays
- [ ] Summary shows extracted data
- [ ] Can ask questions about uploaded data

### Data Verification

- [ ] Check Supabase `uploaded_file_data` table
- [ ] Verify `extracted_data` JSONB field has content
- [ ] Check `data_categories` array
- [ ] Verify `summary` field is populated
- [ ] Confirm `confidence` score is reasonable (>0.5)

## Common Issues

### Issue: "Failed to extract data from file"

**Debug Steps:**
1. Check backend logs for errors
2. Verify GEMINI_API_KEY is valid
3. Test with a simple text PDF first
4. Check file size (must be under 10MB)
5. Ensure network connectivity

**Log Commands:**
```bash
# Check for errors
grep "Error extracting data" backend/logs/error.log

# Check Vision API calls
grep "Gemini Vision" backend/logs/combined.log

# Check PDF processing
grep "PDF" backend/logs/combined.log
```

### Issue: Still getting "0 data entries"

**Possible Causes:**
1. PDF is completely blank
2. Image quality too poor for OCR
3. Text is handwritten (OCR struggles)
4. API key invalid or rate limited

**Debug:**
```bash
# Check if Vision API was called
grep "Sending PDF document to Gemini Vision" backend/logs/combined.log

# Check response
grep "Gemini Vision response received" backend/logs/combined.log

# Look for extraction results
grep "Extracted data from PDF document" backend/logs/combined.log
```

### Issue: Extraction is slow

**Expected Times:**
- Text PDF: 2-5 seconds ✅
- Scanned PDF (1-2 pages): 5-15 seconds ✅
- Large PDF (10+ pages): 15-30 seconds ⚠️

**If slower:**
- Check network speed
- Verify Gemini API status
- Consider splitting large PDFs

## Manual Test Script

Run this to test the upload endpoint directly:

```bash
# Test with a PDF file
curl -X POST http://localhost:3000/api/v1/upload/file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test.pdf" \
  -F "userId=YOUR_USER_ID"
```

Expected response:
```json
{
  "success": true,
  "fileId": "...",
  "fileName": "test.pdf",
  "extractedData": {
    "dataType": "...",
    "entries": [...],
    "summary": "...",
    "confidence": 0.85
  },
  "dataCategories": ["..."],
  "message": "File uploaded and analyzed successfully"
}
```

## Performance Testing

### Test Different File Sizes

| File Size | Expected Time | Status |
|-----------|---------------|--------|
| < 1MB | 5-10s | ✅ |
| 1-5MB | 10-20s | ✅ |
| 5-10MB | 20-30s | ⚠️ |
| > 10MB | Rejected | ❌ |

### Test Different Page Counts

| Pages | Expected Time | Status |
|-------|---------------|--------|
| 1 page | 5-10s | ✅ |
| 2-5 pages | 10-20s | ✅ |
| 6-10 pages | 20-40s | ⚠️ |
| > 10 pages | 40s+ | ⚠️ Consider splitting |

## Success Metrics

### What to Measure

1. **Success Rate**: % of uploads that extract data
   - Target: >90% for readable documents

2. **Accuracy**: Correctness of extracted data
   - Target: >85% accuracy for clear scans

3. **Speed**: Time to process
   - Target: <15s for typical scanned PDFs

4. **User Satisfaction**: Can users find their data?
   - Target: Users can ask questions and get answers

## Rollback Plan

If issues occur:

### Quick Rollback

```bash
cd backend/src/utils
git checkout HEAD~1 fileParsingService.ts
npm run build
# Restart backend
```

### Symptoms Requiring Rollback

- ❌ All PDF uploads failing
- ❌ Vision API errors for all files
- ❌ Significantly increased processing time
- ❌ Cost spike from Vision API

## Monitoring

### What to Watch

1. **Backend Logs**
   ```bash
   tail -f backend/logs/combined.log | grep "FileParser"
   ```

2. **Error Rate**
   ```bash
   grep "Error extracting data" backend/logs/error.log | wc -l
   ```

3. **Vision API Usage**
   ```bash
   grep "Sending PDF document to Gemini Vision" backend/logs/combined.log | wc -l
   ```

4. **Success Rate**
   ```bash
   grep "File uploaded and analyzed successfully" backend/logs/combined.log | wc -l
   ```

## Next Steps After Testing

1. ✅ Verify scanned PDFs work
2. ✅ Check extraction accuracy
3. ✅ Monitor performance
4. ✅ Gather user feedback
5. 📊 Track Vision API costs
6. 🔧 Tune confidence thresholds if needed
7. 📈 Consider specialized parsers for common formats

## Support

If you encounter issues:

1. **Check this guide first**
2. **Review backend logs**
3. **Test with simple files**
4. **Verify environment variables**
5. **Check Gemini API status**

## Quick Reference

### Key Log Messages

| Message | Meaning |
|---------|---------|
| `Successfully extracted text from PDF` | Fast path (text extraction) |
| `Using AI Vision for OCR` | OCR path (scanned PDF) |
| `Sending PDF document to Gemini Vision` | Vision API call |
| `Extracted data from PDF document` | Success |
| `Error extracting data from PDF/image` | Failure |

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Test Files Needed

- ✅ Text-based PDF (digital document)
- ✅ Scanned PDF (photo of document)
- ✅ Image file (JPEG/PNG)
- ✅ Multi-page PDF
- ✅ Poor quality scan (edge case)

---

**Ready to Test?**

1. Start backend: `cd backend && npm run dev`
2. Open app
3. Upload a scanned PDF
4. Check logs: `tail -f backend/logs/combined.log`
5. Verify extraction works!


