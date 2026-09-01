import { supabase } from '../lib/supabase';
import { User, setCurrentUser, getCurrentUser, updateUserProfile } from './clubSyncService';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Helper function to validate if a user's database role matches their selected UI role
const isValidRole = (selectedRole: string, userTypeStr: string | null): boolean => {
  if (!selectedRole || selectedRole === 'User') return true; // Anyone can login as User
  const userType = (userTypeStr || '').toLowerCase();
  
  if (selectedRole === 'President') return ['president', 'club_lead'].includes(userType);
  if (selectedRole === 'Executive') return ['executive', 'vertical_coordinator', 'co-ordinator'].includes(userType);
  if (selectedRole === 'Secretary') return ['secretary'].includes(userType);
  if (selectedRole === 'Owner') return ['owner', 'faculty', 'faculty_mentor', 'dean_admin', 'super_admin'].includes(userType);
  
  return false;
};

/**
 * Sign in using Google OAuth via Supabase
 * Opens a browser window for Google login, then exchanges the session
 */
export async function signInWithGoogle(selectedRole: string = 'User'): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
  try {
    const redirectTo = makeRedirectUri({ scheme: 'clubsync', path: 'auth/callback' });

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

    // Parse the redirect URL manually (React Native URL polyfill can be buggy with custom schemes)
    const queryString = result.url.split('#')[1] || result.url.split('?')[1];
    
    if (!queryString) {
      return { success: false, error: 'Invalid redirect format: ' + result.url };
    }

    // Convert query string to object
    const params = queryString.split('&').reduce((acc, current) => {
      const [key, value] = current.split('=');
      if (key) acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {} as Record<string, string>);

    if (params.error_description || params.error) {
      return { success: false, error: params.error_description || params.error };
    }

    let sessionData;
    
    if (params.access_token) {
      // Flow 1: Implicit Flow (returns access_token in fragment)
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token || '',
      });
      if (error) return { success: false, error: error.message };
      sessionData = data;
    } else if (params.code) {
      // Flow 2: PKCE Flow (returns code in query parameters)
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) return { success: false, error: error.message };
      sessionData = data;
    } else {
      return { success: false, error: 'Auth failed. Raw URL: ' + result.url };
    }

    // Check if this is a brand new user and validate their role
    const userId = sessionData.user?.id;
    if (userId) {
      const { data: profile } = await supabase.from('users').select('prn, user_type').eq('id', userId).single();
      
      // Role validation
      if (!isValidRole(selectedRole, profile?.user_type)) {
        await supabase.auth.signOut();
        return { success: false, error: `Unauthorized: You do not have permission to access the ${selectedRole} role.` };
      }

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
export async function signInWithEmail(email: string, password: string, selectedRole: string = 'User'): Promise<{ success: boolean; error?: string; user?: User }> {
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
      // Fetch user profile to validate role
      const { data: profile } = await supabase.from('users').select('user_type').eq('id', data.user.id).single();
      
      if (!isValidRole(selectedRole, profile?.user_type)) {
        await supabase.auth.signOut();
        return { success: false, error: `Unauthorized: You do not have permission to access the ${selectedRole} role.` };
      }

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
