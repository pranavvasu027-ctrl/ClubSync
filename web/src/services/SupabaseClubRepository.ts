import { supabase } from '../lib/supabase';
import { IClubRepository, Club, ClubEvent } from './ClubService';

export class SupabaseClubRepository implements IClubRepository {
  async getClubDetails(clubId: string): Promise<Club | null> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('club_id', clubId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching club details:', error);
      return null;
    }
    
    return {
      club_id: data.club_id,
      name: data.name,
      short_name: data.short_name,
      vertical: data.vertical,
      description: data.description || '',
    };
  }

  async getClubEvents(clubId: string): Promise<ClubEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', clubId)
      .in('status', ['live', 'completed']);
    
    if (error || !data) {
      console.error('Error fetching club events:', error);
      return [];
    }
    
    return data.map(e => ({
      event_id: e.event_id,
      club_id: e.club_id,
      name: e.title,
      description: e.description || '',
      event_date: e.event_date,
      status: e.status,
      venue: e.venue || 'TBA',
    }));
  }

  async getAllClubs(): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'ACTIVE');
      
    if (error || !data) return [];
    
    return data.map(c => ({
      club_id: c.club_id,
      name: c.name,
      short_name: c.short_name,
      vertical: c.vertical,
      description: c.description || '',
    }));
  }
}
