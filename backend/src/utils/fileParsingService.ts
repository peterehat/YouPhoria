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
 */
export async function parseFile(
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<ParseResult> {
  try {
    console.log('[FileParser] Parsing file:', { fileName, mimeType });

    let fileContent: string;
    let isImage = false;

    // Extract content based on file type
    if (mimeType === 'application/pdf') {
      fileContent = await parsePDF(filePath);
    } else if (mimeType.startsWith('image/')) {
      // For images, we'll use Gemini Vision API directly
      isImage = true;
      fileContent = ''; // Will be handled separately
    } else if (mimeType === 'text/plain' || mimeType === 'text/rtf') {
      fileContent = await parseTextFile(filePath);
    } else if (mimeType === 'text/csv') {
      fileContent = await parseCSV(filePath);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      fileContent = await parseExcel(filePath);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      fileContent = await parseWord(filePath);
    } else {
      return {
        success: false,
        error: 'Unsupported file type',
      };
    }

    // Use AI to extract structured health data
    const extractedData = isImage
      ? await extractDataFromImage(filePath)
      : await extractDataFromText(fileContent, fileName);

    if (!extractedData) {
      return {
        success: false,
        error: 'Failed to extract health data from file',
      };
    }

    // Determine data categories
    const categories = categorizeData(extractedData);

    return {
      success: true,
      extractedData,
      dataCategories: categories,
    };
  } catch (error: any) {
    console.error('[FileParser] Error parsing file:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse file',
    };
  }
}

/**
 * Parse PDF file
 */
async function parsePDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
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
 * Extract structured health data from text using AI
 */
async function extractDataFromText(
  content: string,
  fileName: string
): Promise<ExtractedData | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a health data extraction AI. Analyze the following document and extract structured health-related data.

Document: ${fileName}
Content:
${content.substring(0, 10000)} ${content.length > 10000 ? '...(truncated)' : ''}

Extract health data in the following JSON format (respond with ONLY valid JSON, no markdown):
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
  "summary": "Brief summary of the data in 1-2 sentences",
  "confidence": 0.0-1.0
}

Guidelines:
- Extract all health-related metrics (steps, calories, heart rate, sleep, weight, blood pressure, lab values, etc.)
- If dates are present, extract them. If not, set dateRange to null.
- Group related data into entries by date if possible
- Use standard metric names (e.g., "steps", "calories", "heart_rate_bpm", "weight_kg")
- Set confidence based on how clear and structured the data is
- If no health data is found, return confidence: 0 and empty entries array`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean up response (remove markdown code blocks if present)
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedData = JSON.parse(cleanedResponse);
    
    console.log('[FileParser] Extracted data:', {
      dataType: extractedData.dataType,
      entriesCount: extractedData.entries?.length || 0,
      confidence: extractedData.confidence,
    });
    
    return extractedData;
  } catch (error: any) {
    console.error('[FileParser] Error extracting data from text:', error);
    return null;
  }
}

/**
 * Extract structured health data from image using AI Vision
 */
async function extractDataFromImage(filePath: string): Promise<ExtractedData | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read image as base64
    const imageData = fs.readFileSync(filePath);
    const base64Image = imageData.toString('base64');
    
    // Determine mime type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const prompt = `You are a health data extraction AI. Analyze this image and extract any health-related data visible.

This could be:
- Screenshots of fitness apps
- Photos of medical reports or lab results
- Nutrition labels
- Workout logs
- Sleep tracking data
- Vital signs displays
- Any other health metrics

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
      "notes": "any relevant notes"
    }
  ],
  "summary": "Brief summary of what's in the image",
  "confidence": 0.0-1.0
}

If the image contains no health data, return confidence: 0 and empty entries array.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);
    
    const response = result.response.text();
    
    // Clean up response
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extractedData = JSON.parse(cleanedResponse);
    
    console.log('[FileParser] Extracted data from image:', {
      dataType: extractedData.dataType,
      entriesCount: extractedData.entries?.length || 0,
      confidence: extractedData.confidence,
    });
    
    return extractedData;
  } catch (error: any) {
    console.error('[FileParser] Error extracting data from image:', error);
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

