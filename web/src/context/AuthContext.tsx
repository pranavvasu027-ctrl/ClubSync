import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type CustomProfile = {
  user_id: string;
  auth_user_id: string;
  user_type: string;
  name: string;
  college_id: string;
};

export type MembershipInfo = {
  club_id: string;
  name?: string;
  role: string;
};

export type ClubInfo = {
  club_id: string;
  name: string;
  role?: string;
} | null;

export type AuthContextType = {
  user: User | null;
  profile: CustomProfile | null;
  club: ClubInfo;
  memberships: MembershipInfo[];
  supervisedClubs: string[];
  loading: boolean;
  hasClubRole: (clubId: string, allowedRoles: string[]) => boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  club: null, 
  memberships: [],
  supervisedClubs: [],
  loading: true, 
  hasClubRole: () => false,
  signOut: async () => {} 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomProfile | null>(null);
  const [club, setClub] = useState<ClubInfo>(null);
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
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
        setMemberships([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, auth_user_id, user_type, name, college_id')
      .eq('auth_user_id', authId)
      .single();
      
    if (!error && data) {
      setProfile(data);
      
      let memList: MembershipInfo[] = [];
      // Fetch ALL active memberships
      // Query memberships table: try role_id and fallback to role for backward compatibility
      const { data: memData, error: memError } = await supabase
        .from('memberships')
        .select('club_id, role_id, clubs(club_id, name)')
        .eq('user_id', data.user_id)
        .eq('status', 'ACTIVE');
      
      if (!memError && memData && memData.length > 0) {
        memList = memData.map((m: any) => ({
          club_id: m.club_id,
          name: m.clubs?.name,
          role: m.role_id || 'MEMBER',
        }));
      } else {
        const { data: legacyMemData } = await supabase
          .from('memberships')
          .select('club_id, role, clubs(club_id, name)')
          .eq('user_id', data.user_id)
          .eq('status', 'ACTIVE');
        if (legacyMemData && legacyMemData.length > 0) {
          memList = legacyMemData.map((m: any) => ({
            club_id: m.club_id,
            name: m.clubs?.name,
            role: m.role || 'MEMBER',
          }));
        }
      }

      setMemberships(memList);

      if (memList.length > 0) {
        // Set primary club to the first active membership
        const primary = memList[0];
        setClub({ club_id: primary.club_id, name: primary.name || primary.club_id, role: primary.role });
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

  const supervisedClubs = useMemo(() => {
    if (!profile) return [];
    // Returns active club IDs the user is associated with
    return memberships.map(m => m.club_id);
  }, [profile, memberships]);

  const hasClubRole = (targetClubId: string, allowedRoles: string[]) => {
    const normType = profile?.user_type?.toLowerCase() || '';
    if (['owner', 'super_admin', 'platform_admin', 'admin'].includes(normType)) return true;

    const normAllowed = allowedRoles.map(r => r.toLowerCase());
    return memberships.some(m => 
      m.club_id === targetClubId && normAllowed.includes((m.role || '').toLowerCase())
    ) || (club?.club_id === targetClubId && normAllowed.includes((club.role || '').toLowerCase()));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, club, memberships, supervisedClubs, loading, hasClubRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
