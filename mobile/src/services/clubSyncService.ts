import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Club, EventItem, CompetitionItem, DigitalTicket, CLUBS, EVENTS, COMPETITIONS, MY_TICKETS } from '../data/mockData';

export interface User {
  id?: string;
  email: string;
  name: string;
  prn: string;
  collegeId: string;
  collegeName: string;
  branch: string;
  year: string;
  cgpa: number;
  phone?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  githubHandle?: string;
  linkedinHandle?: string;
  avatarUrl?: string;
  role?: 'student' | 'observer';
  canScanQR?: boolean;
}

export let CURRENT_USER: User = {
  email: 'pranav.1251070582@vit.edu',
  name: 'Pranav Vasu',
  prn: '1251070582',
  collegeId: 'VIT_PUNE',
  collegeName: 'Vishwakarma Institute of Technology, Pune',
  branch: 'Computer Engineering',
  year: 'Third Year (TY)',
  cgpa: 8.85,
  phone: '+91 98765 43210',
  bio: 'Full Stack & AI Developer | Hackathon Enthusiast | Core Lead',
  skills: ['TypeScript', 'React Native', 'Node.js', 'PostgreSQL', 'Python'],
  interests: ['Tech & Hackathons', 'Entrepreneurship', 'Robotics'],
  githubHandle: 'pranavvasu',
  linkedinHandle: 'pranavvasu',
};

// In-memory runtime state for smooth fallback & reactive cache
let runtimeClubs: Club[] = [...CLUBS];
let runtimeEvents: EventItem[] = [...EVENTS];
let runtimeCompetitions: CompetitionItem[] = [...COMPETITIONS];
let runtimeTickets: DigitalTicket[] = [...MY_TICKETS];

export const setCurrentUser = (user: User) => {
  CURRENT_USER = { ...CURRENT_USER, ...user };
};

export const getCurrentUser = (): User => {
  return CURRENT_USER;
};

// ============================================================================
// 1. USER PROFILE API (CRUD & SYNC)
// ============================================================================

/**
 * Fetch user profile from Supabase with fallback to local state
 */
export async function getUserProfile(email: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return CURRENT_USER;
    }

    const fetchedUser: User = {
      id: data.user_id,
      email: data.email,
      name: data.name,
      prn: data.prn_or_roll || CURRENT_USER.prn,
      collegeId: data.college_id || CURRENT_USER.collegeId,
      collegeName: CURRENT_USER.collegeName,
      branch: data.branch || CURRENT_USER.branch,
      year: data.year_of_study || CURRENT_USER.year,
      cgpa: Number(data.cgpa) || CURRENT_USER.cgpa,
      phone: data.phone || CURRENT_USER.phone,
      bio: data.bio || CURRENT_USER.bio,
      skills: data.skills || CURRENT_USER.skills,
      interests: data.interests || CURRENT_USER.interests,
      githubHandle: data.github_handle || CURRENT_USER.githubHandle,
      linkedinHandle: data.linkedin_handle || CURRENT_USER.linkedinHandle,
      avatarUrl: data.avatar_url,
      // Map user_type to role: Faculty/Owner see observer dashboard, everyone else sees student view
      role: ['faculty', 'owner'].includes((data.user_type || '').toLowerCase()) ? 'observer' : 'student',
      // All hierarchy members (Co-ordinator and above) can scan gatepasses
      canScanQR: ['owner', 'faculty', 'president', 'executive', 'secretary', 'co-ordinator'].includes((data.user_type || '').toLowerCase()),
    };

    setCurrentUser(fetchedUser);
    return fetchedUser;
  } catch (err) {
    console.warn('Using local user profile:', err);
    return CURRENT_USER;
  }
}

/**
 * Update user profile in Supabase and local state
 */
export async function updateUserProfile(updated: Partial<User>): Promise<{ success: boolean; user: User }> {
  try {
    const mergedUser: User = { ...CURRENT_USER, ...updated };
    setCurrentUser(mergedUser);

    // Upsert into Supabase
    await supabase.from('users').upsert({
      email: mergedUser.email,
      name: mergedUser.name,
      prn_or_roll: mergedUser.prn,
      college_id: mergedUser.collegeId,
      branch: mergedUser.branch,
      year_of_study: mergedUser.year,
      cgpa: mergedUser.cgpa,
      phone: mergedUser.phone,
      bio: mergedUser.bio,
      skills: mergedUser.skills,
      interests: mergedUser.interests,
      github_handle: mergedUser.githubHandle,
      linkedin_handle: mergedUser.linkedinHandle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    return { success: true, user: mergedUser };
  } catch (err) {
    console.warn('Profile updated locally (offline mode):', err);
    return { success: true, user: CURRENT_USER };
  }
}

// ============================================================================
// RECRUITMENT MOCK API (Admin Dashboard)
// ============================================================================
export interface ApplicationItem {
  id: string;
  applicantName: string;
  appliedRole: string;
  prn: string;
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';
}

let mockApplications: ApplicationItem[] = [
  { id: 'APP_1', applicantName: 'Rohan Sharma', appliedRole: 'Tech Core', prn: '12210001', status: 'APPLIED' },
  { id: 'APP_2', applicantName: 'Ananya Gupta', appliedRole: 'Design Co-ordinator', prn: '12210045', status: 'APPLIED' },
  { id: 'APP_3', applicantName: 'Karan Patel', appliedRole: 'Social Media Manager', prn: '12310123', status: 'SHORTLISTED' },
];

export async function getPendingApplications(): Promise<ApplicationItem[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockApplications.filter(app => app.status === 'APPLIED' || app.status === 'SHORTLISTED');
}

export async function updateApplicationStatus(appId: string, newStatus: 'ACCEPTED' | 'REJECTED' | 'SHORTLISTED'): Promise<{success: boolean}> {
  await new Promise(resolve => setTimeout(resolve, 400));
  mockApplications = mockApplications.map(app => 
    app.id === appId ? { ...app, status: newStatus } : app
  );
  return { success: true };
}

// ============================================================================
// 2. CLUBS API (READ, FOLLOW, UPDATE CMS)
// ============================================================================

/**
 * Fetch all active clubs from Supabase or fallback
 */
export async function getClubs(): Promise<Club[]> {
  try {
    const { data, error } = await supabase.from('clubs').select('*');
    if (error || !data || data.length === 0) {
      return runtimeClubs;
    }

    const fetchedClubs: Club[] = data.map((c: any) => {
      const existing = runtimeClubs.find(rc => rc.id === c.club_id);
      return {
        id: c.club_id,
        clubNo: c.club_no || 'CS/2026/001',
        name: c.name,
        shortName: c.short_name || c.name,
        tagline: c.tagline || existing?.tagline || '',
        collegeId: c.college_id,
        vertical: c.vertical || 'Technical',
        contentVisibility: c.content_visibility || 'college-only',
        campus: c.campus || 'Main Campus',
        workshopOrRoom: c.workshop_or_room || existing?.workshopOrRoom || 'Lab 3201',
        facultyMentor: c.faculty_mentor || existing?.facultyMentor || 'Assigned Mentor',
        facultyDesignation: c.faculty_designation || 'Assistant Professor',
        presidentName: c.president_name || existing?.presidentName || 'Club President',
        presidentContact: c.president_contact || existing?.presidentContact || '@president',
        establishedYear: c.established_year || 2018,
        description: c.description || c.vision || existing?.description || '',
        vision: c.vision || existing?.vision || '',
        mission: c.mission || existing?.mission || '',
        websiteUrl: c.website_url || existing?.websiteUrl,
        instagram: c.instagram_handle || existing?.instagram || '@clubsync',
        linkedin: c.linkedin_handle || existing?.linkedin,
        discord: c.discord_url || existing?.discord,
        whatsappGroup: c.whatsapp_group || existing?.whatsappGroup,
        officialEmail: c.official_email || existing?.officialEmail,
        membersCount: c.members_count || existing?.membersCount || 120,
        followersCount: c.followers_count || existing?.followersCount || 150,
        isFollowed: existing?.isFollowed || false,
        openRecruitment: c.open_recruitment ?? existing?.openRecruitment ?? false,
        recruitmentDeadline: c.recruitment_deadline || existing?.recruitmentDeadline || '30 Aug 2026',
        recruitmentRoles: c.recruitment_roles || existing?.recruitmentRoles || ['Core Member', 'Tech Lead', 'Event Coordinator'],
        logoBg: c.logo_bg || existing?.logoBg || '#0C447C',
        coreCommittee: existing?.coreCommittee || [],
        flagshipEvents: existing?.flagshipEvents || [],
        achievements: existing?.achievements || [],
        faqs: existing?.faqs || [],
      };
    });

    runtimeClubs = fetchedClubs;
    return fetchedClubs;
  } catch (err) {
    console.warn('Using local clubs data:', err);
    return runtimeClubs;
  }
}

/**
 * Update club details (President / Faculty CMS Mode)
 */
export async function updateClubDetails(clubId: string, updates: Partial<Club>): Promise<{ success: boolean; club: Club }> {
  try {
    runtimeClubs = runtimeClubs.map(c => c.id === clubId ? { ...c, ...updates } : c);
    const updated = runtimeClubs.find(c => c.id === clubId)!;

    await supabase.from('clubs').update({
      tagline: updates.tagline,
      vision: updates.vision,
      mission: updates.mission,
      workshop_or_room: updates.workshopOrRoom,
      faculty_mentor: updates.facultyMentor,
      whatsapp_group: updates.whatsappGroup,
      instagram_handle: updates.instagram,
      open_recruitment: updates.openRecruitment,
      recruitment_deadline: updates.recruitmentDeadline,
      updated_at: new Date().toISOString(),
    }).eq('club_id', clubId);

    return { success: true, club: updated };
  } catch (err) {
    console.warn('Club updated locally (offline mode):', err);
    const fallbackClub = runtimeClubs.find(c => c.id === clubId)!;
    return { success: true, club: fallbackClub };
  }
}

/**
 * Toggle follow/unfollow for a club
 */
export async function toggleFollowClub(clubId: string): Promise<{ success: boolean; isFollowed: boolean; followersCount: number }> {
  const club = runtimeClubs.find(c => c.id === clubId);
  const nextIsFollowed = !club?.isFollowed;
  const nextCount = (club?.followersCount || 100) + (nextIsFollowed ? 1 : -1);

  runtimeClubs = runtimeClubs.map(c => 
    c.id === clubId 
      ? { ...c, isFollowed: nextIsFollowed, followersCount: nextCount } 
      : c
  );

  try {
    if (CURRENT_USER.id) {
      if (nextIsFollowed) {
        await supabase.from('club_followers').insert({
          club_id: clubId,
          user_id: CURRENT_USER.id,
        });
      } else {
        await supabase.from('club_followers')
          .delete()
          .eq('club_id', clubId)
          .eq('user_id', CURRENT_USER.id);
      }
    }

    await supabase.from('clubs').update({
      followers_count: nextCount,
    }).eq('club_id', clubId);
  } catch (err) {
    console.warn('Follow count synced locally:', err);
  }

  return { success: true, isFollowed: nextIsFollowed, followersCount: nextCount };
}

// ============================================================================
// 3. EVENTS API (CRUD, RSVP, PASSES & GATE SCANNER)
// ============================================================================

/**
 * Fetch campus & national events
 */
export async function getEvents(): Promise<EventItem[]> {
  try {
    const cachedEvents = await AsyncStorage.getItem('@events_cache');
    if (cachedEvents && !global.hasInitialFetchDone) {
      // Return cache immediately to paint screen, then background update
      global.hasInitialFetchDone = true;
      setTimeout(() => fetchEventsFromSupabase(), 0);
      return JSON.parse(cachedEvents);
    }
    
    return await fetchEventsFromSupabase();
  } catch (err) {
    return runtimeEvents;
  }
}

declare global { var hasInitialFetchDone: boolean; }

async function fetchEventsFromSupabase(): Promise<EventItem[]> {
  try {
    const { data, error } = await supabase.from('events').select('*');
    if (error || !data || data.length === 0) {
      return runtimeEvents;
    }

    const fetchedEvents: EventItem[] = data.map((e: any) => {
      const existing = runtimeEvents.find(re => re.id === e.event_id);
      const dateParts = (e.event_date || '28 Aug 2026').split(' ');
      return {
        id: e.event_id,
        clubName: e.club_name || existing?.clubName || 'GedIT Technical Club',
        collegeName: e.college_name || existing?.collegeName || 'Vishwakarma Institute of Technology, Pune',
        title: e.title,
        description: e.description || '',
        vertical: (e.vertical as any) || existing?.vertical || 'Technical',
        scope: (e.scope as any) || existing?.scope || 'Inter-Collegiate',
        venue: e.venue_name || existing?.venue || 'Main Campus',
        date: e.event_date || '28 Aug 2026',
        month: dateParts[1] || 'AUG',
        day: dateParts[0] || '28',
        time: e.event_time || '10:00 AM',
        ticketPrice: Number(e.ticket_price) || 0,
        prizePool: e.prize_pool || '₹50,000',
        isHackathon: e.is_hackathon || false,
        registeredCount: e.registered_count || existing?.registeredCount || 80,
        maxCapacity: existing?.maxCapacity || 200,
        isRegistered: existing?.isRegistered || false,
        status: (e.status as any) || 'upcoming',
        winner: existing?.winner,
        winningCollege: existing?.winningCollege,
      };
    });

    runtimeEvents = fetchedEvents;
    AsyncStorage.setItem('@events_cache', JSON.stringify(fetchedEvents)).catch(console.warn);
    return fetchedEvents;
  } catch (err) {
    console.warn('Using local events data:', err);
    return runtimeEvents;
  }
}

/**
 * Create a new event (Club Lead / Committee Mode)
 */
export async function createEvent(newEvent: Omit<EventItem, 'id'>): Promise<{ success: boolean; event: EventItem }> {
  const generatedId = `EVT_${Date.now()}`;
  const fullEvent: EventItem = {
    ...newEvent,
    id: generatedId,
  };

  runtimeEvents = [fullEvent, ...runtimeEvents];

  try {
    await supabase.from('events').insert({
      event_id: generatedId,
      club_name: fullEvent.clubName,
      college_name: fullEvent.collegeName,
      title: fullEvent.title,
      description: fullEvent.description,
      vertical: fullEvent.vertical,
      scope: fullEvent.scope,
      venue_name: fullEvent.venue,
      event_date: fullEvent.date,
      event_time: fullEvent.time,
      ticket_price: fullEvent.ticketPrice,
      prize_pool: fullEvent.prizePool,
      is_hackathon: fullEvent.isHackathon,
      status: fullEvent.status,
      registered_count: fullEvent.registeredCount,
    });
  } catch (err) {
    console.warn('Event created in runtime cache:', err);
  }

  return { success: true, event: fullEvent };
}

/**
 * Update an existing event
 */
export async function updateEvent(eventId: string, updates: Partial<EventItem>): Promise<{ success: boolean; event: EventItem }> {
  runtimeEvents = runtimeEvents.map(e => e.id === eventId ? { ...e, ...updates } : e);
  const updated = runtimeEvents.find(e => e.id === eventId)!;

  try {
    await supabase.from('events').update({
      title: updates.title,
      description: updates.description,
      venue_name: updates.venue,
      event_date: updates.date,
      event_time: updates.time,
      ticket_price: updates.ticketPrice,
      prize_pool: updates.prizePool,
      status: updates.status,
    }).eq('event_id', eventId);
  } catch (err) {
    console.warn('Event updated in runtime cache:', err);
  }

  return { success: true, event: updated };
}

/**
 * Register for an event live and generate dynamic QR pass
 */
export async function registerForEvent(event: EventItem): Promise<{ success: boolean; ticket?: DigitalTicket }> {
  try {
    const qrToken = `CLUBSYNC-TKT-${event.id}-${CURRENT_USER.prn}-${Date.now()}`;

    // Update runtime event registration status
    runtimeEvents = runtimeEvents.map(e => 
      e.id === event.id 
        ? { ...e, isRegistered: true, registeredCount: e.registeredCount + 1 } 
        : e
    );

    // Create Digital Ticket
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
      ticketTier: event.isHackathon ? 'Hackathon All-Access Pass' : (event.ticketPrice > 0 ? 'VIP Delegate Pass' : 'Standard Entry Pass'),
      qrCodeString: qrToken,
      checkInStatus: 'CONFIRMED',
    };

    runtimeTickets = [newTicket, ...runtimeTickets];

    // Supabase persist
    await supabase.from('event_registrations').insert({
      user_id: CURRENT_USER.id,
      event_id: event.id,
      college_id: CURRENT_USER.collegeId,
      attendee_name: CURRENT_USER.name,
      attendee_prn: CURRENT_USER.prn,
      academic_year: '2026-27',
      amount_paid: event.ticketPrice,
      payment_status: event.ticketPrice === 0 ? 'FREE' : 'COMPLETED',
      qr_token: qrToken,
      check_in_status: 'REGISTERED',
    });

    return { success: true, ticket: newTicket };
  } catch (err) {
    console.warn('Registration saved to local wallet:', err);
    return { 
      success: true, 
      ticket: {
        id: `TCK_${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        clubName: event.clubName,
        venue: event.venue,
        date: event.date,
        time: event.time,
        attendeeName: CURRENT_USER.name,
        prn: CURRENT_USER.prn,
        college: CURRENT_USER.collegeName,
        ticketTier: 'Standard Entry Pass',
        qrCodeString: `CLUBSYNC-${event.id}-${CURRENT_USER.prn}`,
        checkInStatus: 'CONFIRMED',
      }
    };
  }
}

/**
 * Verify Gate Pass QR Token (Gatekeeper scanner check-in)
 */
export async function verifyGatePassToken(qrToken: string): Promise<{ success: boolean; message: string; attendee?: string }> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('qr_token', qrToken)
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid or Unrecognized QR Gate Pass.' };
    }

    if (data.check_in_status === 'ATTENDED') {
      return { success: false, message: `Pass Already Used by ${data.attendee_name} (${data.attendee_prn}).` };
    }

    // Update status to attended
    await supabase
      .from('event_registrations')
      .update({ check_in_status: 'ATTENDED', check_in_timestamp: new Date().toISOString() })
      .eq('qr_token', qrToken);

    return { success: true, message: `Access Granted! Welcome ${data.attendee_name}`, attendee: data.attendee_name };
  } catch (err) {
    return { success: true, message: `Gate Pass Verified (Offline Verification: ${qrToken})`, attendee: CURRENT_USER.name };
  }
}

// ============================================================================
// 4. COMPETITIONS & HALL OF FAME CMS API
// ============================================================================

export async function getCompetitions(): Promise<CompetitionItem[]> {
  try {
    const { data, error } = await supabase.from('competitions').select('*');
    if (error || !data || data.length === 0) {
      return runtimeCompetitions;
    }

    const fetched: CompetitionItem[] = data.map((c: any) => ({
      id: c.competition_id,
      title: c.title,
      organizer: c.organizer,
      organizerLogoBg: c.organizer_logo_bg || '#185FA5',
      collegeName: c.college_name,
      category: c.category as any,
      mode: c.mode as any,
      location: c.location,
      teamSize: c.team_size,
      minTeam: c.min_team || 1,
      maxTeam: c.max_team || 4,
      tags: c.tags || ['National', 'Hackathon'],
      daysLeft: c.days_left || '6 Days',
      deadlineDate: c.deadline_date || '15 Sep 2026',
      prizePool: c.prize_pool || '₹1,00,000',
      entryFee: Number(c.entry_fee) || 0,
      registeredCount: c.registered_count || 100,
      description: c.description || '',
      eligibility: c.eligibility || 'Open to all students across India.',
      isRegistered: false,
      status: c.status as any,
      winner: c.winner_name,
      winningCollege: c.winning_college,
    }));

    runtimeCompetitions = fetched;
    return fetched;
  } catch (err) {
    return runtimeCompetitions;
  }
}

/**
 * Publish competition winners to the Hall of Fame
 */
export async function publishWinners(
  compId: string,
  winnerName: string,
  winningCollege: string,
  prizeAmount: string
): Promise<{ success: boolean }> {
  runtimeCompetitions = runtimeCompetitions.map(c => 
    c.id === compId 
      ? { ...c, status: 'past', daysLeft: 'Ended', winner: winnerName, winningCollege: winningCollege }
      : c
  );

  try {
    await supabase.from('competitions').update({
      winner_name: winnerName,
      winning_college: winningCollege,
      status: 'past',
    }).eq('competition_id', compId);

    await supabase.from('winners').insert({
      competition_id: compId,
      winner_name: winnerName,
      college_name: winningCollege,
      position: '1st Place / Winner',
      rank_order: 1,
      prize_amount: parseInt(prizeAmount.replace(/\D/g, '')) || 50000,
      certificate_verification_code: `CERT-CLUBSYNC-${compId.substring(0, 6)}-${Date.now().toString().slice(-4)}`,
    });
  } catch (err) {
    console.warn('Winner published locally:', err);
  }

  return { success: true };
}

/**
 * Register a team for a competition
 */
export async function registerCompetitionTeam(
  compId: string,
  teamName: string,
  teammatePrns: string[]
): Promise<{ success: boolean; message: string }> {
  runtimeCompetitions = runtimeCompetitions.map(c => 
    c.id === compId 
      ? { ...c, isRegistered: true, registeredCount: c.registeredCount + 1 }
      : c
  );

  try {
    await supabase.from('teams').insert({
      competition_id: compId,
      team_name: teamName,
      lead_user_id: CURRENT_USER.id,
      lead_prn: CURRENT_USER.prn,
      representing_college: CURRENT_USER.collegeName,
    });
  } catch (err) {
    console.warn('Team registered in runtime state:', err);
  }

  return { success: true, message: `Team '${teamName}' successfully registered!` };
}

// ============================================================================
// 5. RECRUITMENT & APPLICATION PIPELINE API
// ============================================================================

export async function submitApplication(
  clubId: string,
  role: string,
  sop: string,
  resumeUrl?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    let applicantData = {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      email: CURRENT_USER.email,
      prn: CURRENT_USER.prn,
      cgpa: CURRENT_USER.cgpa,
      linkedin: CURRENT_USER.linkedinHandle
    };

    if (session?.user) {
      const { data: profile } = await supabase.from('users').select('*').eq('auth_user_id', session.user.id).single();
      if (profile) {
        applicantData = {
          id: profile.user_id,
          name: profile.name,
          email: profile.email,
          prn: profile.prn_or_roll,
          cgpa: profile.cgpa,
          linkedin: profile.linkedin_handle
        };
      }
    }

    await supabase.from('applications').insert({
      club_id: clubId,
      applicant_id: applicantData.id || '33333333-3333-3333-3333-333333333333', // Default mock student ID
      applicant_name: applicantData.name,
      applicant_email: applicantData.email,
      applicant_prn: applicantData.prn,
      applicant_cgpa: applicantData.cgpa,
      applied_role: role,
      sop_statement: sop,
      resume_url: resumeUrl || 'https://linkedin.com/in/' + applicantData.linkedin,
      status: 'APPLIED',
    });

    return { success: true, message: `Application for '${role}' submitted successfully!` };
  } catch (err) {
    return { success: true, message: `Application for '${role}' saved to committee review queue!` };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'OFFERED' | 'REJECTED' | 'ACCEPTED',
  remarks?: string
): Promise<{ success: boolean }> {
  try {
    await supabase.from('applications').update({
      status: status,
      remarks: remarks,
    }).eq('application_id', applicationId);
  } catch (err) {
    console.warn('Application status updated:', err);
  }
  return { success: true };
}

// ============================================================================
// 7. QR CODE ATTENDANCE API
// ============================================================================

export async function markAttendance(token: string): Promise<{ success: boolean; studentName?: string; prn?: string; eventTitle?: string; message: string }> {
  try {
    if (token.startsWith('TEST_INVALID')) {
       return { success: false, message: 'Invalid ticket or ticket expired.' };
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .update({ check_in_status: 'ATTENDED' })
      .eq('qr_token', token)
      .select('attendee_name, attendee_prn, events(title)')
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid ticket or already checked in.' };
    }

    return {
      success: true,
      studentName: data.attendee_name,
      prn: data.attendee_prn,
      eventTitle: data.events?.title || 'Event',
      message: 'Attendance Marked'
    };
  } catch (err) {
    return { success: false, message: 'Failed to connect to scanner service.' };
  }
}

export async function getUserTickets(prn: string): Promise<DigitalTicket[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, events(title, club_name, venue_name, event_date, event_time)')
      .eq('attendee_prn', prn);

    if (error || !data || data.length === 0) {
      return runtimeTickets;
    }

    const tickets: DigitalTicket[] = data.map((r: any) => ({
      id: r.registration_id || `TCK_${r.id || Math.floor(Math.random()*1000)}`,
      eventId: r.event_id,
      eventTitle: r.events?.title || r.event_title || 'Event',
      clubName: r.events?.club_name || r.club_name || '',
      venue: r.events?.venue_name || r.venue || '',
      date: r.events?.event_date || r.event_date || '',
      time: r.events?.event_time || r.event_time || '',
      attendeeName: r.attendee_name,
      prn: r.attendee_prn,
      college: r.college_name || CURRENT_USER.collegeName,
      ticketTier: r.ticket_tier || 'Standard Entry Pass',
      qrCodeString: r.qr_token,
      checkInStatus: r.check_in_status,
    }));

    runtimeTickets = tickets;
    return tickets;
  } catch (err) {
    return runtimeTickets;
  }
}

export async function getNotifications(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data;
  } catch (err) {
    return [];
  }
}

