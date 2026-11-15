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

export const DEMO_PROFILES: Record<string, {
  name: string;
  email: string;
  user_type: string;
  role: string;
  clubName: string;
  clubId: string;
}> = {
  president: {
    name: 'Arnav Deshmukh',
    email: 'president.csi@vit.edu',
    user_type: 'President',
    role: 'President',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  secretary: {
    name: 'Priya Sharma',
    email: 'secretary@vit.edu',
    user_type: 'Secretary',
    role: 'Secretary',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  executive: {
    name: 'Rohan Joshi',
    email: 'executive@vit.edu',
    user_type: 'Executive',
    role: 'Executive',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  faculty: {
    name: 'Dr. S. K. Kulkarni (Mentor)',
    email: 'mentor@vit.edu',
    user_type: 'Faculty',
    role: 'Faculty',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  admin: {
    name: 'Prof. V. A. Patil (Admin)',
    email: 'admin@vit.edu',
    user_type: 'Admin',
    role: 'Admin',
    clubName: 'Student Activities Council',
    clubId: 'VIT_CSI'
  },
  recruiter: {
    name: 'Kavita Verma',
    email: 'recruiter@vit.edu',
    user_type: 'Recruiter',
    role: 'Recruiter',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  student: {
    name: 'Rohit Sharma (Student)',
    email: 'rohit.sharma@vit.edu',
    user_type: 'Student',
    role: 'Member',
    clubName: 'Computer Society of India (CSI)',
    clubId: 'VIT_CSI'
  },
  owner: {
    name: 'Platform Super Admin',
    email: 'owner@clubsync.org',
    user_type: 'Owner',
    role: 'Owner',
    clubName: 'ClubSync Central Council',
    clubId: 'VIT_CSI'
  }
};

export type AuthContextType = {
  user: User | null;
  profile: CustomProfile | null;
  club: ClubInfo;
  memberships: MembershipInfo[];
  supervisedClubs: string[];
  loading: boolean;
  hasClubRole: (clubId: string, allowedRoles: string[]) => boolean;
  signOut: () => Promise<void>;
  loginAsDemoRole: (roleKey: string) => void;
  isDemo: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  club: null, 
  memberships: [],
  supervisedClubs: [],
  loading: true, 
  hasClubRole: () => false,
  signOut: async () => {},
  loginAsDemoRole: () => {},
  isDemo: false
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomProfile | null>(null);
  const [club, setClub] = useState<ClubInfo>(null);
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const applyDemoRole = async (roleKey: string) => {
    const key = roleKey.toLowerCase();
    const demo = DEMO_PROFILES[key] || DEMO_PROFILES.student;
    const demoUser = {
      id: `demo-${key}-user`,
      app_metadata: {},
      user_metadata: { name: demo.name },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: demo.email
    } as unknown as User;

    const demoProfile: CustomProfile = {
      user_id: `demo-${key}-user`,
      auth_user_id: `demo-${key}-user`,
      user_type: demo.user_type,
      name: demo.name,
      college_id: 'VIT_PUNE'
    };

    const demoClub: ClubInfo = {
      club_id: demo.clubId,
      name: demo.clubName,
      role: demo.role
    };

    const demoMemberships: MembershipInfo[] = [
      { club_id: demo.clubId, name: demo.clubName, role: demo.role }
    ];

    setUser(demoUser);
    setProfile(demoProfile);
    setClub(demoClub);
    setMemberships(demoMemberships);
    setIsDemo(true);
    localStorage.setItem('clubsync_demo_session', JSON.stringify({
      roleKey: key,
      user: demoUser,
      profile: demoProfile,
      club: demoClub,
      memberships: demoMemberships
    }));

    // In parallel, authenticate live session with Supabase Auth so that all
    // RLS queries and ACID RPCs carry a genuine JWT Bearer token!
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: demo.email,
        password: 'Password@123'
      });
      if (!authErr && authData?.user) {
        setUser(authData.user);
        await fetchProfile(authData.user.id);
      }
    } catch (e) {
      console.warn('Live demo auth sync failed (falling back to offline demo):', e);
    }
  };

  useEffect(() => {
    let resolved = false;

    // Timeout guard so we don't get stuck on loading if remote Supabase fails DNS resolution
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const saved = localStorage.getItem('clubsync_demo_session');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            setUser(data.user);
            setProfile(data.profile);
            setClub(data.club);
            setMemberships(data.memberships || []);
            setIsDemo(true);
          } catch (e) {}
        }
        setLoading(false);
      }
    }, 600);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          const saved = localStorage.getItem('clubsync_demo_session');
          if (saved) {
            try {
              const data = JSON.parse(saved);
              setUser(data.user);
              setProfile(data.profile);
              setClub(data.club);
              setMemberships(data.memberships || []);
              setIsDemo(true);
            } catch (e) {}
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.warn('Supabase auth session fetch failed, falling back to local demo mode:', err);
        const saved = localStorage.getItem('clubsync_demo_session');
        if (saved) {
          try {
            const data = JSON.parse(saved);
            setUser(data.user);
            setProfile(data.profile);
            setClub(data.club);
            setMemberships(data.memberships || []);
            setIsDemo(true);
          } catch (e) {}
        }
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemo(false);
        fetchProfile(session.user.id);
      } else {
        const saved = localStorage.getItem('clubsync_demo_session');
        if (!saved) {
          setProfile(null);
          setClub(null);
          setMemberships([]);
          setIsDemo(false);
          setLoading(false);
        }
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, auth_user_id, user_type, name, college_id')
        .eq('auth_user_id', authId)
        .single();
        
      if (!error && data) {
        setProfile(data);
        
        let memList: MembershipInfo[] = [];
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
        }

        setMemberships(memList);

        if (memList.length > 0) {
          const primary = memList[0];
          setClub({ club_id: primary.club_id, name: primary.name || primary.club_id, role: primary.role });
        } else {
          const { data: fallbackClub } = await supabase
            .from('clubs')
            .select('club_id, name')
            .eq('college_id', data.college_id)
            .limit(1)
            .single();
          if (fallbackClub) {
            setClub({ ...fallbackClub, role: data.user_type });
          }
        }
      }
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
    setLoading(false);
  };

  const supervisedClubs = useMemo(() => {
    if (!profile) return [];
    return memberships.map(m => m.club_id);
  }, [profile, memberships]);

  const hasClubRole = (targetClubId: string, allowedRoles: string[]) => {
    const normType = profile?.user_type?.toLowerCase() || '';
    if (['owner', 'super_admin', 'platform_admin', 'admin', 'dean_admin'].some(r => normType.includes(r))) return true;

    const normAllowed = allowedRoles.map(r => r.toLowerCase());
    return memberships.some(m => 
      m.club_id === targetClubId && (
        normAllowed.includes((m.role || '').toLowerCase()) ||
        (normAllowed.includes('faculty') && (m.role || '').toLowerCase().includes('faculty')) ||
        (normAllowed.includes('president') && (m.role || '').toLowerCase().includes('president'))
      )
    ) || (
      club?.club_id === targetClubId && (
        normAllowed.includes((club.role || '').toLowerCase()) ||
        (normAllowed.includes('faculty') && (club.role || '').toLowerCase().includes('faculty')) ||
        (normAllowed.includes('president') && (club.role || '').toLowerCase().includes('president'))
      )
    );
  };

  const signOut = async () => {
    localStorage.removeItem('clubsync_demo_session');
    setUser(null);
    setProfile(null);
    setClub(null);
    setMemberships([]);
    setIsDemo(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      club, 
      memberships, 
      supervisedClubs, 
      loading, 
      hasClubRole, 
      signOut,
      loginAsDemoRole: applyDemoRole,
      isDemo
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
