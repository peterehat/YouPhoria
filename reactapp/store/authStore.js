import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,

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

      if (session) {
        set({ 
          session, 
          user: session.user, 
          isAuthenticated: true,
          loading: false 
        });
      } else {
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
        set({ 
          session: data.session, 
          user: data.user, 
          isAuthenticated: true,
          loading: false 
        });
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

      set({ 
        session: data.session, 
        user: data.user, 
        isAuthenticated: true,
        loading: false 
      });
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
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'youphoria',
        path: 'auth',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            set({ error: sessionError.message, loading: false });
            return { success: false, error: sessionError.message };
          }

          if (sessionData.session) {
            set({ 
              session: sessionData.session, 
              user: sessionData.session.user, 
              isAuthenticated: true,
              loading: false 
            });
            return { success: true };
          }
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
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'youphoria',
        path: 'auth',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            set({ error: sessionError.message, loading: false });
            return { success: false, error: sessionError.message };
          }

          if (sessionData.session) {
            set({ 
              session: sessionData.session, 
              user: sessionData.session.user, 
              isAuthenticated: true,
              loading: false 
            });
            return { success: true };
          }
        }
      }

      set({ loading: false });
      return { success: false, error: 'Authentication cancelled' };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    set({ loading: true });
    try {
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
        redirectTo: 'youphoria://reset-password',
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
