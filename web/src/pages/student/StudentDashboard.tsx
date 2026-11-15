import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconChecklist, IconCalendarEvent, IconSearch, IconVideo, IconTicket, IconQrcode, IconX } from '@tabler/icons-react';
import styles from './StudentDashboard.module.css';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [openCycles, setOpenCycles] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [myPasses, setMyPasses] = useState<any[]>([]);
  const [selectedPass, setSelectedPass] = useState<any | null>(null);
  const [upcomingInterview] = useState<any | null>(null);
  const navigate = useNavigate();

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // 1. Open recruitment cycles
    const { data: cyclesData } = await supabase.from('recruitment_cycles').select('*').eq('status', 'open').limit(3);
    if (cyclesData && cyclesData.length > 0) {
      setOpenCycles(cyclesData);
    } else {
      setOpenCycles([
        {
          cycle_id: 'cycle-101',
          club_id: 'VIT_CSI',
          club_name: 'Computer Society of India (CSI)',
          title: 'CSI Core Technical Committee 2026-27',
          description: 'Hiring full-stack web developers, AI/ML engineers, and design leads.',
          status: 'open',
          open_roles_count: 5,
          deadline: '2026-12-05'
        },
        {
          cycle_id: 'cycle-102',
          club_id: 'VIT_GDG',
          club_name: 'Google Developer Groups VIT Pune',
          title: 'GDG VIT Pune Tech & Community Team',
          description: 'Looking for enthusiastic community managers, Flutter devs, and event planners.',
          status: 'open',
          open_roles_count: 8,
          deadline: '2026-12-10'
        }
      ]);
    }

    const targetUserId = profile?.user_id || user?.id;
    if (targetUserId) {
      // 2. My applications
      const { data: appsData } = await supabase.from('applications')
        .select('*')
        .eq('applicant_id', targetUserId)
        .order('applied_at', { ascending: false })
        .limit(3);
      if (appsData) setMyApps(appsData);

      // 3. My event passes / registrations
      try {
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('*, events(title, club_name, venue_name, event_date, event_time)')
          .eq('user_id', targetUserId)
          .order('registered_at', { ascending: false });

        const localRegs = JSON.parse(localStorage.getItem('clubsync_student_registrations') || '[]');
        const allPasses = [...localRegs, ...(regData || [])];
        const seen = new Set();
        const dedupedPasses = allPasses.filter(p => {
          const key = p.registration_id || p.qr_token || p.event_id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const fallbackPasses = dedupedPasses.length > 0 ? dedupedPasses : [
          {
            registration_id: 'reg-demo-1',
            qr_token: 'QR-PASS-DEVFEST-2026',
            event_id: 'evt-102',
            events: {
              title: 'DevFest 24h National Hackathon',
              club_name: 'GDG VIT Pune',
              venue_name: 'Computer Center, Labs 1-4',
              event_date: '2026-10-28',
              event_time: '09:00 AM'
            }
          }
        ];
        setMyPasses(fallbackPasses);
      } catch (e) {
        console.warn('Error loading passes:', e);
      }
    }

    // 4. Upcoming events
    const { data: eventsData } = await supabase.from('events')
      .select('*')
      .in('status', ['published', 'upcoming'])
      .order('created_at', { ascending: false })
      .limit(6);
    const localPublished = JSON.parse(localStorage.getItem('clubsync_demo_events') || '[]')
      .filter((e: any) => e.status === 'published' || e.status === 'upcoming');
    const allEvents = [...localPublished, ...(eventsData || [])];
    const seenEvents = new Set();
    const dedupedEvents = allEvents.filter(e => {
      if (!e || !e.event_id || seenEvents.has(e.event_id)) return false;
      seenEvents.add(e.event_id);
      return true;
    });
    const fallbackEvents = dedupedEvents.length > 0 ? dedupedEvents : [
      {
        event_id: 'evt-101',
        title: 'Web Dev Bootcamp 2026',
        club_name: 'CSI VIT Pune',
        event_type: 'Workshop',
        event_date: '15 Sep 2026',
        event_time: '10:00 AM',
        venue_name: 'Sharad Arena',
        ticket_price: 150,
        status: 'published'
      },
      {
        event_id: 'evt-102',
        title: 'DevFest 24h Hackathon',
        club_name: 'GDG VIT Pune',
        event_type: 'Hackathon',
        event_date: '28 Oct 2026',
        event_time: '09:00 AM',
        venue_name: 'Computer Center',
        ticket_price: 0,
        status: 'upcoming'
      },
      {
        event_id: 'evt-103',
        title: 'Vishwapreneur 2026 Summit',
        club_name: 'EDC VIT Pune',
        event_type: 'Seminar',
        event_date: '10 Jan 2027',
        event_time: '09:00 AM',
        venue_name: 'Sharad Arena',
        ticket_price: 350,
        status: 'upcoming'
      }
    ];
    setUpcomingEvents(fallbackEvents);
  }, [profile?.user_id, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Student Portal</div>
          <h1>Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!</h1>
          <p>Find the best clubs, RSVP to campus events, and manage your digital gate passes.</p>
        </div>
      </div>

      {upcomingInterview && (
        <div className={styles.interviewCard}>
          <div className={styles.intIcon}><IconCalendarEvent size={24} /></div>
          <div className={styles.intContent}>
            <h3>Upcoming Interview: {upcomingInterview.applications?.recruitment_cycles?.club_name || 'Club'}</h3>
            <p>
              Date: <strong>{new Date(upcomingInterview.interview_date).toLocaleDateString()}</strong> at <strong>{upcomingInterview.interview_time}</strong>
            </p>
            {upcomingInterview.meet_link && (
              <a href={upcomingInterview.meet_link} target="_blank" rel="noreferrer" className={styles.meetBtn}>
                <IconVideo size={16} /> Join Google Meet
              </a>
            )}
          </div>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconTicket size={16}/> Active Gate Passes</div>
          <div className={styles.statValue}>{myPasses.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconChecklist size={16}/> Total Applications</div>
          <div className={styles.statValue}>{myApps.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconSearch size={16}/> Open Opportunities</div>
          <div className={styles.statValue}>{openCycles.length}</div>
        </div>
      </div>

      {/* MY ACTIVE GATE PASSES SECTION */}
      {myPasses.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className={styles.sectionHeader}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTicket size={22} color="#2563eb" /> My Digital Gate Passes & Tickets
            </h2>
            <span style={{ fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
              {myPasses.length} Valid Passes
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {myPasses.map((pass) => {
              const title = pass.events?.title || pass.title || 'Campus Event';
              const club = pass.events?.club_name || pass.club_name || 'ClubSync';
              const venue = pass.events?.venue_name || pass.venue_name || 'Campus Auditorium';
              const date = pass.events?.event_date || pass.event_date;
              return (
                <div 
                  key={pass.registration_id || pass.qr_token || pass.event_id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {pass.ticket_tier || 'Standard Entry Pass'}
                      </span>
                      <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {pass.check_in_status || 'REGISTERED'}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#0f172a' }}>{title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{club} • {venue}</p>
                    {date && (
                      <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                        📅 {new Date(date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPass(pass)}
                    style={{
                      marginTop: 14,
                      padding: '8px 12px',
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <IconQrcode size={16} /> View Gate Pass QR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PASS MODAL */}
      {selectedPass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 99 }}>
                VERIFIED GATE PASS
              </span>
              <button onClick={() => setSelectedPass(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <IconX size={20} />
              </button>
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: 18, color: '#0f172a' }}>
              {selectedPass.events?.title || selectedPass.title || 'Campus Event'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748b' }}>
              {selectedPass.events?.club_name || selectedPass.club_name || 'ClubSync'}
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 12, padding: 24, display: 'inline-block', marginBottom: 16 }}>
              <IconQrcode size={160} color="#0f172a" />
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: '#64748b', letterSpacing: '0.05em' }}>
                {selectedPass.qr_token || 'CS-VALID-GATE-PASS'}
              </div>
            </div>

            <div style={{ textAlign: 'left', background: '#f1f5f9', borderRadius: 8, padding: 12, fontSize: 12, color: '#475569', marginBottom: 16 }}>
              <div><strong>Attendee:</strong> {profile?.name || 'Student'}</div>
              <div><strong>Pass Tier:</strong> {selectedPass.ticket_tier || 'Standard Entry Pass'}</div>
              <div><strong>Check-in:</strong> {selectedPass.check_in_status || 'REGISTERED'}</div>
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      <div className={styles.twoCol}>
        <div className={styles.col}>
          <div className={styles.sectionHeader}>
            <h2>Open Opportunities</h2>
            <button onClick={() => navigate('/student/openings')} className={styles.textBtn}>Browse All</button>
          </div>
          <div className={styles.cycleList}>
            {openCycles.length === 0 ? (
              <div className={styles.emptyState}>No open recruitment cycles right now.</div>
            ) : (
              openCycles.map(cycle => (
                <div key={cycle.id || cycle.cycle_id} className={styles.cycleCard}>
                  <div className={styles.cycleHeader}>
                    <h4>{cycle.title}</h4>
                    <span className={styles.clubName}>{cycle.club_name}</span>
                  </div>
                  <div className={styles.cycleMeta}>
                    Deadline: {new Date(cycle.application_deadline).toLocaleDateString()}
                  </div>
                  <button className={styles.applyBtn} onClick={() => navigate(`/student/apply/${cycle.id || cycle.cycle_id}`)}>Apply Now</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Events</h2>
            <button className={styles.textBtn} onClick={() => navigate('/student')}>View All</button>
          </div>
          <div className={styles.appList}>
            {upcomingEvents.length === 0 ? (
              <div className={styles.emptyState}>No events published right now.</div>
            ) : (
              upcomingEvents.map(ev => (
                <div key={ev.event_id} className={styles.appCard} onClick={() => navigate(`/student/events/${ev.event_id}`)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className={styles.appTitle}>{ev.title}</div>
                    <div className={styles.appClub}>{ev.club_name || 'VIT Pune'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#666' }}><IconCalendarEvent size={12}/> {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBD'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;