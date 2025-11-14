/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Orchestrates the RAG flow for chat:
 * 1. Analyze user query to determine if health data is needed
 * 2. Retrieve relevant health data from database
 * 3. Format data as context for AI
 * 4. Return enriched context for prompt augmentation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { analyzeQuery, QueryAnalysis } from './queryAnalyzer';
import {
  getDailyMetrics,
  getHealthEvents,
  getDataSummary,
  getUploadedFileData,
  formatDailyMetricsForContext,
  formatSummaryForContext,
  formatEventsForContext,
  formatUploadedDataForContext,
} from './healthDataRetrieval';

export interface RAGContext {
  hasHealthData: boolean;
  healthContext: string;
  metadata: {
    dataRetrieved: boolean;
    timeRange?: {
      start: string;
      end: string;
      description: string;
    };
    metricsIncluded: string[];
    dataTypes: string[];
  };
}

export interface RAGResult {
  success: boolean;
  context: RAGContext;
  error?: string;
}

/**
 * Main RAG function: Analyze query and retrieve relevant health data
 */
export async function retrieveHealthContext(
  supabase: SupabaseClient,
  genAI: GoogleGenerativeAI,
  userId: string,
  query: string
): Promise<RAGResult> {
  try {
    console.log('[RAG] Analyzing query:', query);

    // Step 1: Analyze the query using local pattern matching
    const analysis = analyzeQuery(query);
    
    console.log('[RAG] Query analysis:', {
      needsHealthData: analysis.needsHealthData,
      timeRange: analysis.timeRange?.description,
      metrics: analysis.metrics,
    });

    // If no health data is needed, return empty context
    if (!analysis.needsHealthData) {
      return {
        success: true,
        context: {
          hasHealthData: false,
          healthContext: '',
          metadata: {
            dataRetrieved: false,
            metricsIncluded: [],
            dataTypes: [],
          },
        },
      };
    }

    // Step 2: Use Gemini to refine the analysis if needed
    // This helps with ambiguous queries or when we need to understand intent better
    const refinedAnalysis = await refineQueryAnalysis(genAI, query, analysis);
    
    // Step 3: Determine time range (use refined or default to last 7 days)
    let timeRange = refinedAnalysis.timeRange || analysis.timeRange;
    
    if (!timeRange) {
      // Default to last 7 days if no time reference found
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      timeRange = {
        startDate,
        endDate,
        description: 'last 7 days (default)',
      };
    }

    console.log('[RAG] Retrieving data for:', {
      timeRange: timeRange.description,
      start: timeRange.startDate.toISOString(),
      end: timeRange.endDate.toISOString(),
    });

    // Step 4: Retrieve health data based on analysis
    const healthContext = await retrieveHealthData(
      supabase,
      userId,
      timeRange.startDate,
      timeRange.endDate,
      refinedAnalysis.metrics.length > 0 ? refinedAnalysis.metrics : analysis.metrics
    );

    if (!healthContext.success) {
      return {
        success: false,
        context: {
          hasHealthData: false,
          healthContext: '',
          metadata: {
            dataRetrieved: false,
            metricsIncluded: [],
            dataTypes: [],
          },
        },
        error: healthContext.error,
      };
    }

    // Step 5: Return the enriched context
    return {
      success: true,
      context: {
        hasHealthData: true,
        healthContext: healthContext.formattedContext,
        metadata: {
          dataRetrieved: true,
          timeRange: {
            start: timeRange.startDate.toISOString(),
            end: timeRange.endDate.toISOString(),
            description: timeRange.description,
          },
          metricsIncluded: refinedAnalysis.metrics.length > 0 ? refinedAnalysis.metrics : analysis.metrics,
          dataTypes: healthContext.dataTypes,
        },
      },
    };
  } catch (error: any) {
    console.error('[RAG] Error in retrieveHealthContext:', error);
    return {
      success: false,
      context: {
        hasHealthData: false,
        healthContext: '',
        metadata: {
          dataRetrieved: false,
          metricsIncluded: [],
          dataTypes: [],
        },
      },
      error: error.message,
    };
  }
}

/**
 * Use Gemini to refine query analysis for ambiguous cases
 */
async function refineQueryAnalysis(
  genAI: GoogleGenerativeAI,
  query: string,
  initialAnalysis: QueryAnalysis
): Promise<QueryAnalysis> {
  try {
    // Only use AI refinement for ambiguous queries
    // If we already have clear time range and metrics, skip this step
    if (initialAnalysis.timeRange && initialAnalysis.metrics.length > 0) {
      return initialAnalysis;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const analysisPrompt = `Analyze this health-related query and extract structured information.

Query: "${query}"

Respond with JSON only (no markdown, no explanation):
{
  "needsHealthData": true/false,
  "timeReference": "today|yesterday|this week|last week|last 7 days|last 30 days|last 90 days|null",
  "metrics": ["steps", "sleep_hours", "heart_rate", etc] or []
}

Rules:
- Set needsHealthData to true only if the query asks about specific health metrics or data
- Extract the most specific time reference mentioned
- List only metrics explicitly mentioned or strongly implied
- Return empty array for metrics if none are specifically mentioned`;

    const result = await model.generateContent(analysisPrompt);
    const response = result.response.text();
    
    // Parse the JSON response
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiAnalysis = JSON.parse(cleanedResponse);
    
    console.log('[RAG] AI refined analysis:', aiAnalysis);

    // Merge AI analysis with initial analysis
    return {
      needsHealthData: aiAnalysis.needsHealthData ?? initialAnalysis.needsHealthData,
      timeRange: initialAnalysis.timeRange, // Keep the parsed time range
      metrics: aiAnalysis.metrics && aiAnalysis.metrics.length > 0 
        ? aiAnalysis.metrics 
        : initialAnalysis.metrics,
      rawQuery: query,
    };
  } catch (error) {
    console.error('[RAG] Error in AI refinement, using initial analysis:', error);
    return initialAnalysis;
  }
}

/**
 * Retrieve and format health data based on query analysis
 */
async function retrieveHealthData(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date,
  metrics: string[]
): Promise<{
  success: boolean;
  formattedContext: string;
  dataTypes: string[];
  error?: string;
}> {
  try {
    const dataTypes: string[] = [];
    let formattedContext = '';

    // Determine what data to retrieve based on date range
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For short periods (1-3 days), show daily details
    // For longer periods, show summary
    const useDetailedView = daysDiff <= 3;

    if (useDetailedView) {
      // Get daily metrics with details
      const dailyResult = await getDailyMetrics(supabase, userId, startDate, endDate);
      
      if (dailyResult.success && dailyResult.data.length > 0) {
        formattedContext += formatDailyMetricsForContext(dailyResult.data);
        dataTypes.push('daily_metrics');
      }

      // Get recent events
      const eventsResult = await getHealthEvents(supabase, userId, startDate, endDate);
      
      if (eventsResult.success && eventsResult.data.length > 0) {
        formattedContext += formatEventsForContext(eventsResult.data);
        dataTypes.push('health_events');
      }
    } else {
      // Get summary for longer periods
      const summaryResult = await getDataSummary(supabase, userId, startDate, endDate);
      
      if (summaryResult.success && summaryResult.summary) {
        formattedContext += formatSummaryForContext(summaryResult.summary);
        dataTypes.push('summary');
      }

      // Get recent events (last 10)
      const eventsResult = await getHealthEvents(supabase, userId, startDate, endDate);
      
      if (eventsResult.success && eventsResult.data.length > 0) {
        formattedContext += formatEventsForContext(eventsResult.data.slice(0, 10));
        dataTypes.push('health_events');
      }
    }

    // Get uploaded file data (always retrieve, regardless of date range)
    const uploadedResult = await getUploadedFileData(supabase, userId, startDate, endDate);
    
    if (uploadedResult.success && uploadedResult.data.length > 0) {
      formattedContext += formatUploadedDataForContext(uploadedResult.data);
      dataTypes.push('uploaded_files');
      console.log('[RAG] Retrieved', uploadedResult.data.length, 'uploaded files');
    }

    // If no data was retrieved, provide a helpful message
    if (formattedContext === '') {
      formattedContext = `No health data available for the period ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}. The user may not have synced their health data yet.`;
    }

    return {
      success: true,
      formattedContext,
      dataTypes,
    };
  } catch (error: any) {
    console.error('[RAG] Error retrieving health data:', error);
    return {
      success: false,
      formattedContext: '',
      dataTypes: [],
      error: error.message,
    };
  }
}

/**
 * Build the complete prompt with RAG context
 */
export function buildPromptWithContext(
  systemPrompt: string,
  ragContext: RAGContext,
  conversationHistory: Array<{ role: string; content: string }>,
  currentMessage: string
): string {
  let fullPrompt = systemPrompt + '\n\n';

  // Add health data context if available
  if (ragContext.hasHealthData && ragContext.healthContext) {
    fullPrompt += '=== USER HEALTH DATA CONTEXT ===\n';
    fullPrompt += ragContext.healthContext;
    fullPrompt += '\n=== END HEALTH DATA ===\n\n';
    fullPrompt += 'Use the above health data to provide personalized, data-driven responses. Reference specific metrics and dates when relevant.\n\n';
  }

  // Add conversation history
  if (conversationHistory.length > 0) {
    fullPrompt += 'Previous conversation:\n';
    conversationHistory.forEach((msg) => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'You-i'}: ${msg.content}\n`;
    });
    fullPrompt += '\n';
  }

  // Add current message
  fullPrompt += `User: ${currentMessage}\n\nYou-i:`;

  return fullPrompt;
}

export default {
  retrieveHealthContext,
  buildPromptWithContext,
};

