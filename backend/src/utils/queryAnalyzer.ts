/**
 * Query Analyzer Utility
 * 
 * Parses natural language queries to extract:
 * - Time references (last week, yesterday, this month, etc.)
 * - Metric types mentioned (steps, sleep, heart rate, etc.)
 * - Whether health data is needed
 */

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface QueryAnalysis {
  needsHealthData: boolean;
  timeRange: TimeRange | null;
  metrics: string[];
  rawQuery: string;
}

/**
 * Parse natural language time references into Date objects
 * Supports: today, yesterday, this week, last week, this month, last month,
 * last X days, past X days, last X weeks, last X months, etc.
 */
export function parseTimeReference(query: string): TimeRange | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lowerQuery = query.toLowerCase();
  
  // Today
  if (lowerQuery.includes('today')) {
    return {
      startDate: today,
      endDate: now,
      description: 'today',
    };
  }
  
  // Yesterday
  if (lowerQuery.includes('yesterday')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    return {
      startDate: yesterday,
      endDate: yesterdayEnd,
      description: 'yesterday',
    };
  }
  
  // This week (Monday to today)
  if (lowerQuery.match(/this week/)) {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(monday.getDate() - daysFromMonday);
    return {
      startDate: monday,
      endDate: now,
      description: 'this week',
    };
  }
  
  // Last week (previous Monday to Sunday)
  if (lowerQuery.match(/last week|past week|previous week/)) {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastSunday = new Date(today);
    lastSunday.setDate(lastSunday.getDate() - daysFromMonday - 1);
    lastSunday.setHours(23, 59, 59, 999);
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastMonday.getDate() - 6);
    lastMonday.setHours(0, 0, 0, 0);
    return {
      startDate: lastMonday,
      endDate: lastSunday,
      description: 'last week',
    };
  }
  
  // This month
  if (lowerQuery.match(/this month/)) {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: firstDay,
      endDate: now,
      description: 'this month',
    };
  }
  
  // Last month
  if (lowerQuery.match(/last month|past month|previous month/)) {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return {
      startDate: firstDayLastMonth,
      endDate: lastDayLastMonth,
      description: 'last month',
    };
  }
  
  // Last/Past X days
  const daysMatch = lowerQuery.match(/(?:last|past|previous)\s+(\d+)\s+days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    return {
      startDate,
      endDate: now,
      description: `last ${days} days`,
    };
  }
  
  // Last/Past X weeks
  const weeksMatch = lowerQuery.match(/(?:last|past|previous)\s+(\d+)\s+weeks?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7));
    return {
      startDate,
      endDate: now,
      description: `last ${weeks} weeks`,
    };
  }
  
  // Last/Past X months
  const monthsMatch = lowerQuery.match(/(?:last|past|previous)\s+(\d+)\s+months?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);
    return {
      startDate,
      endDate: now,
      description: `last ${months} months`,
    };
  }
  
  // Default: last 7 days if no specific time reference found
  // but only if the query seems to be asking about recent data
  if (lowerQuery.match(/recent|lately|currently|now/)) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    return {
      startDate,
      endDate: now,
      description: 'last 7 days (default)',
    };
  }
  
  return null;
}

/**
 * Extract metric types mentioned in the query
 * Maps natural language to database column names
 */
export function extractMetrics(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const metrics: string[] = [];
  
  // Metric mappings: natural language -> database column
  const metricPatterns: { [key: string]: RegExp } = {
    steps: /\b(steps?|walking|walked)\b/,
    distance_mi: /\b(distance|miles?|mi)\b/,
    active_calories: /\b(active calories|calories burned|energy)\b/,
    resting_calories: /\b(resting calories|basal|bmr)\b/,
    exercise_minutes: /\b(exercise|active minutes?|activity time|workout time)\b/,
    flights_climbed: /\b(flights?|stairs?|climbed)\b/,
    avg_heart_rate: /\b(heart rate|hr|bpm|pulse)\b/,
    resting_heart_rate: /\b(resting heart rate|resting hr|rhr)\b/,
    heart_rate_variability: /\b(hrv|heart rate variability|variability)\b/,
    sleep_hours: /\b(sleep|slept|sleeping|rest)\b/,
    weight_lbs: /\b(weight|weigh|pounds?|lbs?)\b/,
    protein_g: /\b(protein)\b/,
    carbs_g: /\b(carbs?|carbohydrates?)\b/,
    fat_g: /\b(fat|fats)\b/,
    calories_consumed: /\b(calories consumed|ate|eaten|food|nutrition|diet)\b/,
    water_oz: /\b(water|hydration|fluid|ounces?|oz)\b/,
    workout_count: /\b(workouts?|training sessions?|exercises?)\b/,
    total_workout_minutes: /\b(workout minutes|training time|exercise duration)\b/,
    strength_sessions: /\b(strength|weights?|lifting|resistance)\b/,
    cardio_sessions: /\b(cardio|running|cycling|aerobic)\b/,
  };
  
  for (const [metric, pattern] of Object.entries(metricPatterns)) {
    if (pattern.test(lowerQuery)) {
      metrics.push(metric);
    }
  }
  
  return metrics;
}

/**
 * Determine if a query needs health data
 * Uses keyword matching to identify health-related questions
 */
export function needsHealthData(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Health-related keywords
  const healthKeywords = [
    // Metrics
    'steps', 'sleep', 'heart rate', 'calories', 'weight', 'exercise',
    'workout', 'distance', 'activity', 'nutrition', 'protein', 'carbs',
    'water', 'hydration', 'hrv', 'variability', 'flights', 'stairs',
    
    // Lab work and medical tests
    'blood work', 'bloodwork', 'lab results', 'lab test', 'labs', 'test results',
    'cholesterol', 'glucose', 'a1c', 'hemoglobin', 'thyroid', 'tsh', 'vitamin',
    'lipid', 'metabolic', 'cbc', 'cmp', 'bmp', 'panel', 'biomarker', 'biomarkers',
    'testosterone', 'estrogen', 'hormone', 'cortisol', 'ferritin', 'iron',
    'kidney', 'liver', 'creatinine', 'bun', 'alt', 'ast', 'egfr',
    
    // Questions about data
    'how much', 'how many', 'how long', 'how often',
    'what was', 'what were', 'what is', 'what are',
    'did i', 'have i', 'am i',
    
    // Analysis requests
    'average', 'total', 'summary', 'trend', 'pattern', 'compare',
    'progress', 'improvement', 'change', 'difference',
    
    // Time-based queries
    'today', 'yesterday', 'week', 'month', 'days', 'recently', 'lately',
    
    // Health status
    'health', 'fitness', 'wellness', 'performance', 'recovery',
  ];
  
  // Check if query contains health-related keywords
  const containsHealthKeyword = healthKeywords.some(keyword => 
    lowerQuery.includes(keyword)
  );
  
  // Questions that typically need data
  const isDataQuestion = /^(how|what|did|have|show|tell|give|display|list)/i.test(query.trim());
  
  return containsHealthKeyword || (isDataQuestion && lowerQuery.length > 20);
}

/**
 * Analyze a query to determine if health data is needed and what data to retrieve
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const needsData = needsHealthData(query);
  const timeRange = needsData ? parseTimeReference(query) : null;
  const metrics = needsData ? extractMetrics(query) : [];
  
  return {
    needsHealthData: needsData,
    timeRange,
    metrics,
    rawQuery: query,
  };
}

export default {
  analyzeQuery,
  parseTimeReference,
  extractMetrics,
  needsHealthData,
};

