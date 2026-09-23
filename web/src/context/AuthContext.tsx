import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type CustomProfile = {
  user_id: string;
  user_type: string;
  name: string;
  college_id: string;
};

type ClubInfo = {
  club_id: string;
  name: string;
} | null;

type AuthContextType = {
  user: User | null;
  profile: CustomProfile | null;
  club: ClubInfo;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, club: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomProfile | null>(null);
  const [club, setClub] = useState<ClubInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setClub(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authId: string) => {
    // Fetch user profile (now includes user_id for DB references)
    const { data, error } = await supabase
      .from('users')
      .select('user_id, user_type, name, college_id')
      .eq('auth_user_id', authId)
      .single();
      
    if (!error && data) {
      setProfile(data);
      // Fetch the user's club via memberships
      const { data: membership } = await supabase
        .from('memberships')
        .select('club_id, clubs(club_id, name)')
        .eq('user_id', data.user_id)
        .eq('status', 'ACTIVE')
        .limit(1)
        .single();
      
      if (membership?.clubs) {
        const clubData = membership.clubs as any;
        setClub({ club_id: clubData.club_id, name: clubData.name });
      } else {
        // Fallback: try to get first club for the user's college
        const { data: fallbackClub } = await supabase
          .from('clubs')
          .select('club_id, name')
          .eq('college_id', data.college_id)
          .limit(1)
          .single();
        if (fallbackClub) {
          setClub(fallbackClub);
        }
      }
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, club, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
