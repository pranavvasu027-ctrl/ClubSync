import { supabase } from '../lib/supabase';
import { User, setCurrentUser, getCurrentUser, updateUserProfile } from './clubSyncService';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in using Google OAuth via Supabase
 * Opens a browser window for Google login, then exchanges the session
 */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
  try {
    const redirectTo = makeRedirectUri();

    // Ask Supabase for the Google OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,  // We handle the browser ourselves
      },
    });

    if (error || !data?.url) {
      return { success: false, error: error?.message || 'Failed to get Google login URL' };
    }

    // Open the browser for the user to log in with Google
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success' || !result.url) {
      return { success: false, error: 'Google sign-in was cancelled' };
    }

    // Extract the access_token and refresh_token from the redirect URL
    const url = new URL(result.url);
    
    // Supabase returns tokens in the URL fragment (after #)
    const params = new URLSearchParams(url.hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      return { success: false, error: 'No access token returned from Google' };
    }

    // Set the session in Supabase using the tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError) {
      return { success: false, error: sessionError.message };
    }

    // Check if this is a brand new user (profile might be empty)
    const userId = sessionData.user?.id;
    if (userId) {
      const { data: profile } = await supabase.from('users').select('prn').eq('id', userId).single();
      const isNewUser = !profile?.prn; // If no PRN set, they haven't completed onboarding
      return { success: true, isNewUser };
    }

    return { success: true, isNewUser: true };
  } catch (err: any) {
    console.warn('Google sign in exception:', err);
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Sign in with College Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('Supabase email login error:', error.message);
      return { success: false, error: error.message };
    }

    if (data?.user) {
      // Sync user profile
      const userProfile: Partial<User> = {
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'ClubSync Member',
      };
      await updateUserProfile(userProfile);
      return { success: true, user: getCurrentUser() };
    }

    return { success: false, error: 'Unknown error occurred' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign up with College Email, Password, and Profile metadata
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  profile: { name: string; prn: string; collegeId: string; collegeName: string; branch: string; year: string }
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profile.name,
          prn: profile.prn,
          college_id: profile.collegeId,
          college_name: profile.collegeName,
          branch: profile.branch,
          year: profile.year,
        },
      },
    });

    if (error) {
      console.warn('Supabase email signup error:', error.message);
      return { success: false, error: error.message };
    }

    const newUser: User = {
      email,
      name: profile.name,
      prn: profile.prn,
      collegeId: profile.collegeId,
      collegeName: profile.collegeName,
      branch: profile.branch,
      year: profile.year,
      cgpa: 8.50,
    };

    await updateUserProfile(newUser);
    return { success: true, user: newUser };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign out user session
 */
export async function signOut(): Promise<{ success: boolean }> {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'clubsync://reset-password',
    });

    if (error) {
      console.warn('Supabase reset password error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Check active session
 */
export async function getActiveSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (err) {
    return null;
  }
}
