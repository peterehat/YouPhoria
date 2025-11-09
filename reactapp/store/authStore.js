import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import HealthKitService from '../services/healthKitService';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  needsOnboarding: false,
  onboardingChecked: false,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Initialize auth state
  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        set({ error: error.message, loading: false });
        return;
      }

      HealthKitService.setCurrentUser(session?.user?.id || null);

      if (session) {
        set({ 
          session, 
          user: session.user, 
          isAuthenticated: true,
          loading: false 
        });
        // Check onboarding status after setting authenticated state
        await get().checkOnboardingStatus();
      } else {
        await HealthKitService.disconnect();
        HealthKitService.setCurrentUser(null);
        set({ 
          session: null, 
          user: null, 
          isAuthenticated: false,
          loading: false 
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Check if user needs onboarding
  checkOnboardingStatus: async () => {
    try {
      const { user } = get();
      if (!user) {
        set({ needsOnboarding: false, onboardingChecked: true });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        set({ needsOnboarding: false, onboardingChecked: true });
        return;
      }

      set({ 
        needsOnboarding: !data?.onboarding_completed,
        onboardingChecked: true 
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({ needsOnboarding: false, onboardingChecked: true });
    }
  },

  // Mark onboarding as complete
  completeOnboarding: () => {
    set({ needsOnboarding: false });
  },

  // Allow user to revisit onboarding flow
  startOnboarding: () => {
    set({ needsOnboarding: true, onboardingChecked: true });
  },

  // Sign up with email and password
  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        // Email confirmation required
        set({ loading: false });
        return { success: true, requiresConfirmation: true };
      }

      if (data.session) {
        HealthKitService.setCurrentUser(data.session.user.id);
        set({ 
          session: data.session, 
          user: data.user, 
          isAuthenticated: true,
          loading: false 
        });
        await get().checkOnboardingStatus();
        return { success: true };
      }

      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      HealthKitService.setCurrentUser(data.session.user.id);
      set({ 
        session: data.session, 
        user: data.user, 
        isAuthenticated: true,
        loading: false 
      });
      await get().checkOnboardingStatus();
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      
      // Generate redirect URL based on environment
      let redirectUrl;
      if (isExpoGo) {
        // For Expo Go, use the Expo proxy
        redirectUrl = AuthSession.makeRedirectUri({ 
          useProxy: true,
          scheme: 'youi'
        });
      } else {
        // For standalone builds, use custom scheme
        redirectUrl = AuthSession.makeRedirectUri({ 
          scheme: 'youi', 
          path: 'auth' 
        });
      }

      // TEMP: surface redirect URL for troubleshooting allow-list mismatches
      console.log('Auth redirectUrl (Google):', redirectUrl);
      console.log('Environment:', { isExpoGo, appOwnership: Constants.appOwnership });

      console.log('Starting Google OAuth with redirectUrl:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log('OAuth response data:', data);
      console.log('OAuth response error:', error);

      if (error) {
        console.error('Supabase OAuth error:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.url) {
        console.log('Opening auth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        console.log('WebBrowser result:', result);

        // TEMP: log result for debugging
        console.log('Auth session result (Google):', result.type);

        if (result.type === 'success' && result.url) {
          console.log('Processing OAuth callback URL:', result.url);
          
          // For mobile OAuth, Supabase returns tokens in the URL fragment
          // We need to set the session directly from the URL
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: result.url.split('access_token=')[1]?.split('&')[0],
            refresh_token: result.url.split('refresh_token=')[1]?.split('&')[0],
          });

          console.log('Session data:', sessionData);
          console.log('Session error:', sessionError);

          if (sessionError) {
            console.error('Session creation error:', sessionError);
            set({ error: sessionError.message, loading: false });
            return { success: false, error: sessionError.message };
          }

          if (sessionData.session) {
            console.log('Session created successfully:', sessionData.session.user.email);
          HealthKitService.setCurrentUser(sessionData.session.user.id);
            set({ 
              session: sessionData.session, 
              user: sessionData.session.user, 
              isAuthenticated: true,
              loading: false 
            });
            await get().checkOnboardingStatus();
            return { success: true };
          }
        } else {
          console.log('Auth session was cancelled or failed:', result.type);
        }
      }

      set({ loading: false });
      return { success: false, error: 'Authentication cancelled' };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Sign in with Apple
  signInWithApple: async () => {
    set({ loading: true, error: null });
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      
      // Generate redirect URL based on environment
      let redirectUrl;
      if (isExpoGo) {
        // For Expo Go, use the Expo proxy
        redirectUrl = AuthSession.makeRedirectUri({ 
          useProxy: true,
          scheme: 'youi'
        });
      } else {
        // For standalone builds, try just the scheme without path
        // iOS sometimes needs the exact scheme match
        redirectUrl = 'youi://auth';
        console.log('Using hardcoded redirect URL for Apple:', redirectUrl);
        // Also log what makeRedirectUri would generate for comparison
        const generatedUrl = AuthSession.makeRedirectUri({ 
          scheme: 'youi', 
          path: 'auth' 
        });
        console.log('Generated redirect URL (for comparison):', generatedUrl);
      }

      // Comprehensive logging for Apple OAuth debugging
      console.log('=== APPLE OAUTH DEBUG START ===');
      console.log('Auth redirectUrl (Apple):', redirectUrl);
      console.log('Environment:', { 
        isExpoGo, 
        appOwnership: Constants.appOwnership,
        expoConfig: Constants.expoConfig?.slug,
        scheme: Constants.expoConfig?.scheme
      });
      console.log('Supabase URL:', supabase.supabaseUrl);
      console.log('Starting Apple OAuth with redirectUrl:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log('OAuth response data:', data);
      console.log('OAuth response error:', error);
      console.log('Full OAuth URL:', data?.url);

      if (error) {
        console.error('Supabase OAuth error (Apple):', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.url) {
        console.log('Opening Apple auth URL:', data.url);
        console.log('Expected redirect URL:', redirectUrl);
        
        // Parse the OAuth URL to see what Supabase is sending to Apple
        try {
          const urlObj = new URL(data.url);
          const params = new URLSearchParams(urlObj.search);
          console.log('OAuth URL parameters:', {
            provider: params.get('provider'),
            redirect_to: params.get('redirect_to'),
            allParams: Object.fromEntries(params.entries())
          });
          console.log('Full query string:', urlObj.search);
        } catch (urlError) {
          console.warn('Could not parse OAuth URL:', urlError);
        }
        
        console.log('Opening WebBrowser session...');
        console.log('Auth URL:', data.url);
        console.log('Redirect URL:', redirectUrl);
        
        // Set up a deep link listener as fallback in case WebBrowser doesn't detect the redirect
        let deepLinkListener;
        const deepLinkPromise = new Promise((resolve) => {
          deepLinkListener = Linking.addEventListener('url', (event) => {
            console.log('Deep link received:', event.url);
            if (event.url && event.url.startsWith('youi://')) {
              resolve({ type: 'success', url: event.url });
            }
          });
        });
        
        // Add a timeout to detect if the session hangs
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            resolve({ type: 'timeout', url: null, error: 'Authentication timed out after 5 minutes' });
          }, 5 * 60 * 1000); // 5 minute timeout
        });
        
        const authPromise = WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        // Race between WebBrowser, deep link, and timeout
        const result = await Promise.race([
          authPromise.then(r => {
            console.log('WebBrowser returned:', r);
            if (deepLinkListener) deepLinkListener.remove();
            return r;
          }),
          deepLinkPromise.then(r => {
            console.log('Deep link handler returned:', r);
            if (deepLinkListener) deepLinkListener.remove();
            return r;
          }),
          timeoutPromise
        ]);
        
        // Clean up listener if still active
        if (deepLinkListener) {
          deepLinkListener.remove();
        }
        
        console.log('Auth session returned:', new Date().toISOString());

        // Comprehensive logging of auth session result
        console.log('WebBrowser result:', result);
        console.log('Auth session result type (Apple):', result.type);
        console.log('Auth session result URL:', result.url);
        console.log('Auth session error:', result.error);
        
        if (result.type === 'timeout') {
          console.error('Apple OAuth timed out - user may need to complete sign-in in browser');
          set({ error: 'Authentication timed out. Please try again.', loading: false });
          return { success: false, error: 'Authentication timed out' };
        }

        if (result.type === 'success' && result.url) {
          console.log('Processing Apple OAuth callback URL:', result.url);
          console.log('Callback URL length:', result.url.length);
          console.log('Callback URL preview:', result.url.substring(0, 200) + '...');
          
          // Extract tokens from URL
          const accessTokenMatch = result.url.match(/access_token=([^&]+)/);
          const refreshTokenMatch = result.url.match(/refresh_token=([^&]+)/);
          
          console.log('Token extraction:', {
            hasAccessToken: !!accessTokenMatch,
            hasRefreshToken: !!refreshTokenMatch,
            accessTokenLength: accessTokenMatch?.[1]?.length || 0,
            refreshTokenLength: refreshTokenMatch?.[1]?.length || 0
          });
          
          // For mobile OAuth, Supabase returns tokens in the URL fragment
          // We need to set the session directly from the URL
          const accessToken = accessTokenMatch?.[1] || result.url.split('access_token=')[1]?.split('&')[0];
          const refreshToken = refreshTokenMatch?.[1] || result.url.split('refresh_token=')[1]?.split('&')[0];
          
          console.log('Attempting to set session with tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          console.log('Apple session data:', sessionData);
          console.log('Apple session error:', sessionError);
          if (sessionError) {
            console.error('Apple session creation error details:', {
              message: sessionError.message,
              status: sessionError.status,
              code: sessionError.code,
              fullError: JSON.stringify(sessionError, null, 2)
            });
          }

          if (sessionError) {
            console.error('Apple session creation error:', sessionError);
            set({ error: sessionError.message, loading: false });
            return { success: false, error: sessionError.message };
          }

          if (sessionData.session) {
            console.log('Apple session created successfully:', sessionData.session.user.email);
            console.log('User ID:', sessionData.session.user.id);
            console.log('=== APPLE OAUTH DEBUG END (SUCCESS) ===');
            HealthKitService.setCurrentUser(sessionData.session.user.id);
            set({ 
              session: sessionData.session, 
              user: sessionData.session.user, 
              isAuthenticated: true,
              loading: false 
            });
            await get().checkOnboardingStatus();
            return { success: true };
          } else {
            console.warn('Apple OAuth: No session in sessionData');
            console.log('Session data structure:', Object.keys(sessionData || {}));
          }
        } else {
          console.log('Apple auth session was cancelled or failed:', result.type);
          console.log('Result details:', {
            type: result.type,
            url: result.url,
            error: result.error
          });
          console.log('=== APPLE OAUTH DEBUG END (CANCELLED/FAILED) ===');
        }
      }

      set({ loading: false });
      console.log('=== APPLE OAUTH DEBUG END (NO DATA.URL) ===');
      return { success: false, error: 'Authentication cancelled' };
    } catch (error) {
      console.error('=== APPLE OAUTH DEBUG END (EXCEPTION) ===');
      console.error('Apple OAuth exception:', error);
      console.error('Exception details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    set({ loading: true });
    try {
      // Just clear the current user context, don't delete their stored data
      // This allows users to log back in and have their connections restored
      HealthKitService.setCurrentUser(null);

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      set({ 
        session: null, 
        user: null, 
        isAuthenticated: false,
        loading: false 
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Reset password
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'youi://reset-password',
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useAuthStore;
