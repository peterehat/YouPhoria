/**
 * File Parsing Service
 * 
 * Handles parsing of various file types and extracting health-related data using AI.
 * Supports: PDF, images (JPG, PNG), text files, CSV, Excel, Word documents.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ExtractedData {
  dataType: 'lab_results' | 'nutrition_log' | 'exercise_log' | 'medical_report' | 'sleep_log' | 'vitals' | 'other';
  dateRange?: {
    start: string;
    end: string;
  };
  entries: Array<{
    date?: string;
    category: string;
    metrics: { [key: string]: any };
    notes?: string;
  }>;
  summary: string;
  confidence: number;
}

export interface ParseResult {
  success: boolean;
  extractedData?: ExtractedData;
  dataCategories?: string[];
  error?: string;
}

/**
 * Main function to parse a file and extract health data
 * Now uses Gemini AI for ALL file types for consistent, accurate extraction
 */
export async function parseFile(
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<ParseResult> {
  try {
    console.log('[FileParser] Parsing file:', { fileName, mimeType });

    // Determine if file can be sent directly to Gemini or needs preprocessing
    const canSendDirectly = canSendFileDirectlyToGemini(mimeType);
    
    if (canSendDirectly) {
      // Send file directly to Gemini (PDFs, images)
      console.log('[FileParser] Sending file directly to Gemini Vision API');
      const extractedData = await extractDataWithGeminiVision(filePath, mimeType, fileName);
      
      if (!extractedData) {
        return {
          success: false,
          error: 'Failed to extract health data from file',
        };
      }

      const categories = categorizeData(extractedData);
      return {
        success: true,
        extractedData,
        dataCategories: categories,
      };
    } else {
      // For text-based formats (CSV, Excel, TXT), extract content first then send to Gemini
      console.log('[FileParser] Extracting content from text-based file');
      const fileContent = await extractFileContent(filePath, mimeType);
      
      console.log('[FileParser] Extracted content length:', fileContent?.length || 0, 'characters');
      console.log('[FileParser] Content preview:', fileContent?.substring(0, 200));

      // Send extracted content to Gemini for intelligent parsing
      const extractedData = await extractDataWithGeminiText(fileContent, fileName, mimeType);
      
      if (!extractedData) {
        return {
          success: false,
          error: 'Failed to extract health data from file',
        };
      }

      const categories = categorizeData(extractedData);
      return {
        success: true,
        extractedData,
        dataCategories: categories,
      };
    }
  } catch (error: any) {
    console.error('[FileParser] Error parsing file:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse file',
    };
  }
}

/**
 * Determine if a file can be sent directly to Gemini Vision API
 */
function canSendFileDirectlyToGemini(mimeType: string): boolean {
  const directSupportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  
  return directSupportedTypes.includes(mimeType) || mimeType.startsWith('image/');
}

/**
 * Extract content from text-based files (CSV, Excel, TXT, etc.)
 */
async function extractFileContent(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain' || mimeType === 'text/rtf') {
    return await parseTextFile(filePath);
  } else if (mimeType === 'text/csv') {
    return await parseCSV(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return await parseExcel(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return await parseWord(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}


/**
 * Parse text file
 */
async function parseTextFile(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse CSV file
 */
async function parseCSV(filePath: string): Promise<string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Convert CSV to readable format
  const lines = content.split('\n');
  const headers = lines[0]?.split(',') || [];
  
  let formatted = 'CSV Data:\n';
  formatted += `Headers: ${headers.join(', ')}\n\n`;
  
  for (let i = 1; i < Math.min(lines.length, 101); i++) { // Limit to 100 rows
    const values = lines[i]?.split(',') || [];
    if (values.length > 0) {
      formatted += `Row ${i}: ${values.join(', ')}\n`;
    }
  }
  
  return formatted;
}

/**
 * Parse Excel file
 */
async function parseExcel(filePath: string): Promise<string> {
  const workbook = XLSX.readFile(filePath);
  let formatted = 'Excel Data:\n\n';
  
  // Process each sheet
  workbook.SheetNames.forEach((sheetName) => {
    formatted += `Sheet: ${sheetName}\n`;
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Limit to first 100 rows
    const limitedData = jsonData.slice(0, 100);
    limitedData.forEach((row: any, index: number) => {
      formatted += `Row ${index + 1}: ${row.join(', ')}\n`;
    });
    formatted += '\n';
  });
  
  return formatted;
}

/**
 * Parse Word document (basic text extraction)
 */
async function parseWord(filePath: string): Promise<string> {
  // For Word docs, we'll treat them as binary and let AI handle it
  // Or use a library like mammoth for better extraction
  // For now, return a placeholder
  return 'Word document content (requires additional processing)';
}

/**
 * Extract structured health data from text content using Gemini AI
 * Used for CSV, Excel, TXT files after content extraction
 */
async function extractDataWithGeminiText(
  content: string,
  fileName: string,
  mimeType: string
): Promise<ExtractedData | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Determine file type for better context
    let fileTypeDescription = 'document';
    if (mimeType === 'text/csv') {
      fileTypeDescription = 'CSV spreadsheet';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      fileTypeDescription = 'Excel spreadsheet';
    } else if (mimeType === 'text/plain') {
      fileTypeDescription = 'text file';
    } else if (mimeType.includes('word')) {
      fileTypeDescription = 'Word document';
    }

    const prompt = `You are a health data extraction AI. Analyze this ${fileTypeDescription} and extract ALL health and wellness information.

Document: ${fileName}
Type: ${fileTypeDescription}
Content:
${content.substring(0, 20000)} ${content.length > 20000 ? '...(truncated)' : ''}

This could contain:
- Lab results and blood test data
- Nutrition logs (calories, macros, meals)
- Exercise logs (workouts, steps, distance)
- Sleep data (duration, quality, stages)
- Vital signs (heart rate, blood pressure, temperature)
- Weight and body composition tracking
- Medication logs
- Symptom tracking
- Any other health metrics

IMPORTANT:
- Extract EVERY piece of health data you find
- Parse dates carefully and convert to YYYY-MM-DD format
- For CSV/Excel: understand the column structure and extract all rows
- Convert all measurements to standard units
- Be thorough - don't miss any data points

Extract data in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "dataType": "lab_results|nutrition_log|exercise_log|medical_report|sleep_log|vitals|other",
  "dateRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "category": "nutrition|exercise|sleep|vitals|medical|other",
      "metrics": {
        "key": "value"
      },
      "notes": "any relevant notes"
    }
  ],
  "summary": "Comprehensive summary of ALL data found",
  "confidence": 0.0-1.0
}

Guidelines:
- Extract ALL health-related metrics (steps, calories, heart rate, sleep, weight, blood pressure, lab values, etc.)
- Parse dates from any format and convert to YYYY-MM-DD
- Create separate entries for each date or distinct data point
- Use standard metric names (e.g., "steps", "calories", "heart_rate_bpm", "weight_lbs", "distance_mi", "water_oz", "glucose_mg_dl")
- Set confidence to at least 0.8 if you can extract clear health data
- Set confidence to 0.5-0.7 for partial or unclear data
- Include row counts and data ranges in the summary`;

    console.log(`[FileParser] Sending ${fileTypeDescription} content to Gemini for extraction`);
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean up response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedData = JSON.parse(cleanedResponse);
    
    console.log('[FileParser] Extracted data from', fileTypeDescription, ':', {
      dataType: extractedData.dataType,
      entriesCount: extractedData.entries?.length || 0,
      confidence: extractedData.confidence,
    });
    
    return extractedData;
  } catch (error: any) {
    console.error('[FileParser] Error extracting data with Gemini text:', error);
    return null;
  }
}

/**
 * Extract structured health data using Gemini Vision API
 * Handles PDFs (text-based and scanned) and all image formats with OCR
 */
async function extractDataWithGeminiVision(
  filePath: string,
  mimeType: string,
  fileName: string
): Promise<ExtractedData | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read file as base64
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    
    // Determine the actual mime type to send to Gemini
    let visionMimeType = mimeType;
    if (mimeType === 'application/pdf') {
      visionMimeType = 'application/pdf'; // Gemini supports PDF directly
    } else if (!mimeType.startsWith('image/')) {
      // For images without proper mime type, determine from extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (ext === 'png') visionMimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') visionMimeType = 'image/jpeg';
      else if (ext === 'webp') visionMimeType = 'image/webp';
      else visionMimeType = 'image/jpeg'; // default
    }

    const fileType = mimeType === 'application/pdf' ? 'PDF document' : 'image';
    
    const prompt = `You are a health data extraction AI with advanced OCR capabilities. Analyze this ${fileType} and extract ALL text and health-related information.

Document: ${fileName}
Type: ${fileType}

This could be:
- Lab results and blood test reports (Quest, LabCorp, hospital labs)
- Screenshots of fitness apps (Apple Health, Fitbit, Strava, MyFitnessPal)
- Photos of medical reports, prescriptions, or doctor's notes
- Nutrition labels or food tracking logs
- Workout logs or exercise tracking data
- Sleep tracking data (duration, quality, stages)
- Vital signs displays (blood pressure, temperature, SpO2, heart rate)
- Wearable device data exports (Garmin, Whoop, Oura)
- Body composition reports (weight, BMI, body fat %)
- Medical imaging reports
- Vaccination records
- Any other health metrics or wellness information

CRITICAL INSTRUCTIONS: 
- Use OCR to read ALL visible text, numbers, tables, and data from the ${fileType}
- Extract EVERY piece of health-related information - be exhaustive
- Read tables carefully, extracting all rows and columns
- Parse dates from any format (MM/DD/YYYY, DD-MM-YYYY, etc.) and convert to YYYY-MM-DD
- Convert measurements to standard units (mg/dL, kg, bpm, etc.)
- For scanned documents, read carefully as if doing professional OCR
- Don't miss any metrics, dates, values, or notes
- If you see ranges (e.g., "120-140"), extract both values

Extract the data in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "dataType": "lab_results|nutrition_log|exercise_log|medical_report|sleep_log|vitals|other",
  "dateRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "entries": [
    {
      "date": "YYYY-MM-DD",
      "category": "nutrition|exercise|sleep|vitals|medical|other",
      "metrics": {
        "key": "value"
      },
      "notes": "any relevant notes or text from the document"
    }
  ],
  "summary": "Comprehensive summary of ALL information found in the ${fileType}",
  "confidence": 0.0-1.0
}

Guidelines:
- Extract ALL visible text, numbers, dates, tables, and data
- Create separate entries for different dates or categories
- Use standard metric names (e.g., "steps", "calories", "heart_rate_bpm", "weight_lbs", "distance_mi", "water_oz", "glucose_mg_dl", "cholesterol_total_mg_dl")
- Set confidence to 0.9+ if you can read clear, structured health data
- Set confidence to 0.7-0.8 for readable but less structured data
- Set confidence to 0.5-0.6 for partially readable or unclear data
- Include as much detail as possible in the summary
- List all metrics found, even if some values are unclear`;

    console.log(`[FileParser] Sending ${fileType} to Gemini Vision API for OCR and extraction`);
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: visionMimeType,
          data: base64Data,
        },
      },
    ]);
    
    const response = result.response.text();
    
    console.log('[FileParser] Gemini Vision response received, length:', response.length);
    
    // Clean up response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedData = JSON.parse(cleanedResponse);
    
    console.log('[FileParser] Extracted data from', fileType, ':', {
      dataType: extractedData.dataType,
      entriesCount: extractedData.entries?.length || 0,
      confidence: extractedData.confidence,
      summaryLength: extractedData.summary?.length || 0,
    });
    
    return extractedData;
  } catch (error: any) {
    console.error('[FileParser] Error extracting data with Gemini Vision:', error);
    console.error('[FileParser] Error details:', error.message);
    return null;
  }
}

/**
 * Categorize extracted data into categories for filtering
 */
function categorizeData(data: ExtractedData): string[] {
  const categories = new Set<string>();
  
  // Add main data type
  if (data.dataType !== 'other') {
    categories.add(data.dataType);
  }
  
  // Add categories from entries
  data.entries.forEach((entry) => {
    if (entry.category && entry.category !== 'other') {
      categories.add(entry.category);
    }
    
    // Infer categories from metrics
    const metrics = Object.keys(entry.metrics);
    if (metrics.some(m => ['steps', 'distance', 'calories', 'exercise'].some(k => m.includes(k)))) {
      categories.add('exercise');
    }
    if (metrics.some(m => ['protein', 'carbs', 'fat', 'nutrition'].some(k => m.includes(k)))) {
      categories.add('nutrition');
    }
    if (metrics.some(m => ['sleep', 'rem', 'deep'].some(k => m.includes(k)))) {
      categories.add('sleep');
    }
    if (metrics.some(m => ['heart_rate', 'blood_pressure', 'temperature', 'spo2'].some(k => m.includes(k)))) {
      categories.add('vitals');
    }
    if (metrics.some(m => ['lab', 'test', 'glucose', 'cholesterol'].some(k => m.includes(k)))) {
      categories.add('medical');
    }
  });
  
  return Array.from(categories);
}

export default {
  parseFile,
};

