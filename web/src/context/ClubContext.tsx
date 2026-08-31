import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClubData, initialClubData } from '../lib/secretaryData';
import { supabase } from '../lib/supabase';

interface ClubContextType {
  clubData: ClubData;
  setClubData: React.Dispatch<React.SetStateAction<ClubData>>;
  updateClubData: (updates: Partial<ClubData>) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clubData, setClubData] = useState<ClubData>(initialClubData);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('club_profiles').select('id, page_data').eq('college_id', 'default_college').single();
      if (data && data.page_data) {
        setProfileId(data.id);
        // Fallback to initialClubData structure to ensure we don't break the UI if the JSON is malformed
        setClubData({ ...initialClubData, ...(data.page_data as any) });
      }
    };
    fetchProfile();
  }, []);

  const updateClubData = async (updates: Partial<ClubData>) => {
    setClubData(prev => {
      const newState = { ...prev, ...updates };
      
      // Fire-and-forget sync to Supabase
      if (profileId) {
        supabase.from('club_profiles').update({ page_data: newState }).eq('id', profileId).then();
      }
      
      return newState;
    });
  };

  return (
    <ClubContext.Provider value={{ clubData, setClubData, updateClubData }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
