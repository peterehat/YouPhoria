/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints.
 * Automatically switches between development and production backends.
 * 
 * Priority:
 * 1. Environment variable (EXPO_PUBLIC_API_URL)
 * 2. app.json extra.apiUrl
 * 3. Default based on __DEV__ flag
 */

import Constants from 'expo-constants';

/**
 * Get the API base URL based on environment
 * @returns {string} The API base URL
 */
const getApiUrl = () => {
  // Debug: Log what Constants has
  console.log('[API Config] Debug - Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
  console.log('[API Config] Debug - process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('[API Config] Debug - __DEV__:', __DEV__);
  
  // Check environment variable first (allows override)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[API Config] Using EXPO_PUBLIC_API_URL');
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Check app.json
  if (Constants.expoConfig?.extra?.apiUrl) {
    console.log('[API Config] Using app.json extra.apiUrl');
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Default based on development mode
  if (__DEV__) {
    console.log('[API Config] Using __DEV__ localhost');
    // Development: use localhost
    return 'http://localhost:3000/api/v1';
  } else {
    console.log('[API Config] Using production Railway');
    // Production: use Railway backend
    return 'https://you-i-api-production.up.railway.app/api/v1';
  }
};

// Resolve the API URL
export const API_BASE_URL = getApiUrl();

// Helper flags for environment detection
export const isProduction = API_BASE_URL.includes('https://');
export const isLocalhost = API_BASE_URL.includes('localhost');
export const isLocalIP = API_BASE_URL.match(/192\.168\.|10\.|172\./) !== null;

// Log API configuration on module load
console.log('[API Config] Configuration:', {
  environment: __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION',
  apiUrl: API_BASE_URL,
  isLocalhost,
  isLocalIP,
  isProduction,
});

// Warn if using development URL in production build
if (!__DEV__ && (isLocalhost || isLocalIP)) {
  console.warn('⚠️ [API Config] WARNING: Production build is configured with a development/local API URL!');
  console.warn('⚠️ [API Config] Current API URL:', API_BASE_URL);
  console.warn('⚠️ [API Config] Please update app.json extra.apiUrl to your production backend URL');
}

// Export the function for testing/debugging purposes
export { getApiUrl };

