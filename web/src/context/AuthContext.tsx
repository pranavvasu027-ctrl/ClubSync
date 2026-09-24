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
  role?: string;
} | null;

type AuthContextType = {
  user: User | null;
  profile: CustomProfile | null;
  club: ClubInfo;
  loading: boolean;
  hasClubRole: (clubId: string, allowedRoles: string[]) => boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  club: null, 
  loading: true, 
  hasClubRole: () => false,
  signOut: async () => {} 
});

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
    const { data, error } = await supabase
      .from('users')
      .select('user_id, user_type, name, college_id')
      .eq('auth_user_id', authId)
      .single();
      
    if (!error && data) {
      setProfile(data);
      // Fetch ALL active memberships
      const { data: memberships } = await supabase
        .from('memberships')
        .select('club_id, role, clubs(club_id, name)')
        .eq('user_id', data.user_id)
        .eq('status', 'ACTIVE');
      
      if (memberships && memberships.length > 0) {
        // Set the primary club to the first one for backwards compatibility
        const primary = memberships[0];
        const clubData = primary.clubs as any;
        setClub({ club_id: clubData.club_id, name: clubData.name, role: primary.role });
      } else {
        // Fallback for mock environment
        const { data: fallbackClub } = await supabase
          .from('clubs')
          .select('club_id, name')
          .eq('college_id', data.college_id)
          .limit(1)
          .single();
        if (fallbackClub) {
          setClub({ ...fallbackClub, role: data.user_type }); // Fallback maps global role to club role
        }
      }
    }
    setLoading(false);
  };

  const hasClubRole = (targetClubId: string, allowedRoles: string[]) => {
    // In a full implementation, we'd check the exact membership array.
    // For now, check the primary club and fallback to global platform owner role.
    if (profile?.user_type === 'Owner' || profile?.user_type === 'Admin') return true;
    if (club?.club_id === targetClubId && allowedRoles.map(r => r.toLowerCase()).includes(club.role?.toLowerCase() || '')) return true;
    return false;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, club, loading, hasClubRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
