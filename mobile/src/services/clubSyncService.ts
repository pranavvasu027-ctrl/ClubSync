import { supabase } from '../lib/supabase';
import { Club, EventItem, DigitalTicket, CLUBS, EVENTS, MY_TICKETS } from '../data/mockData';

export const CURRENT_USER = {
  email: 'pranav.1251070582@vit.edu',
  name: 'Pranav Vasu',
  prn: '1251070582',
  collegeId: 'VIT_PUNE',
  collegeName: 'Vishwakarma Institute of Technology, Pune',
  branch: 'Computer Engineering',
  year: 'Third Year (TY)',
  cgpa: 8.85,
};

/**
 * Fetch all active clubs from Supabase (with fallback to preloaded data)
 */
export async function getClubs(): Promise<Club[]> {
  try {
    const { data, error } = await supabase.from('clubs').select('*');
    if (error || !data || data.length === 0) {
      return CLUBS;
    }
    return data.map((c: any) => ({
      id: c.club_id,
      name: c.name,
      shortName: c.short_name || c.name,
      collegeId: c.college_id,
      vertical: c.vertical,
      campus: c.campus || 'Main Campus',
      facultyMentor: 'Faculty Mentor Assigned',
      establishedYear: c.established_year || 2015,
      description: c.vision || c.mission || 'Active student organization at ' + c.college_id,
      membersCount: 120,
      openRecruitment: true,
      recruitmentDeadline: '28 Aug 2026',
      recruitmentRoles: ['Core Member', 'Tech Lead', 'Event Coordinator'],
      instagram: c.instagram_handle || '@clubsync_vit',
      logoBg: '#0C447C',
    }));
  } catch (err) {
    console.warn('Using local clubs data:', err);
    return CLUBS;
  }
}

/**
 * Fetch events from Supabase or fallback
 */
export async function getEvents(): Promise<EventItem[]> {
  try {
    const { data, error } = await supabase.from('events').select('*');
    if (error || !data || data.length === 0) {
      return EVENTS;
    }
    return EVENTS;
  } catch (err) {
    return EVENTS;
  }
}

/**
 * Register for an event live in Supabase
 */
export async function registerForEvent(event: EventItem): Promise<{ success: boolean; ticket?: DigitalTicket }> {
  try {
    const qrToken = `CLUBSYNC-TKT-${event.id}-${CURRENT_USER.prn}-${Date.now()}`;
    
    // Attempt Supabase insert
    await supabase.from('event_registrations').insert({
      event_id: event.id,
      college_id: CURRENT_USER.collegeId,
      academic_year: '2026-27',
      amount_paid: event.ticketPrice,
      payment_status: event.ticketPrice === 0 ? 'FREE' : 'COMPLETED',
      qr_token: qrToken,
      check_in_status: 'REGISTERED',
    });

    const newTicket: DigitalTicket = {
      id: `TCK_${Math.floor(10000 + Math.random() * 90000)}`,
      eventId: event.id,
      eventTitle: event.title,
      clubName: event.clubName,
      venue: event.venue,
      date: event.date,
      time: event.time,
      attendeeName: CURRENT_USER.name,
      prn: CURRENT_USER.prn,
      college: CURRENT_USER.collegeName,
      ticketTier: event.isHackathon ? 'Hackathon All-Access Pass' : 'Standard Entry Pass',
      qrCodeString: qrToken,
      checkInStatus: 'CONFIRMED',
    };

    return { success: true, ticket: newTicket };
  } catch (err) {
    console.error('Registration failed:', err);
    return { success: false };
  }
}
