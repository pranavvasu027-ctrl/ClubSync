import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconChecklist, IconCalendarEvent, IconSearch, IconVideo } from '@tabler/icons-react';
import styles from './StudentDashboard.module.css';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [openCycles, setOpenCycles] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [upcomingInterview] = useState<any | null>(null);
  const navigate = useNavigate();

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // Open cycles
    const { data: cyclesData } = await supabase.from('recruitment_cycles').select('*').eq('status', 'open').limit(3);
    if (cyclesData) setOpenCycles(cyclesData);

    const targetUserId = profile?.user_id || user?.id;
    if (targetUserId) {
      // My applications: query applications table with applicant_id and internal user_id
      const { data: appsData } = await supabase.from('applications')
        .select('*')
        .eq('applicant_id', targetUserId)
        .order('applied_at', { ascending: false })
        .limit(3);
      if (appsData) setMyApps(appsData);
    }

    // Upcoming events (PHASE 1)
    const { data: eventsData } = await supabase.from('events')
      .select('*')
      .in('status', ['published', 'upcoming'])
      .order('created_at', { ascending: false })
      .limit(3);
    if (eventsData) setUpcomingEvents(eventsData);
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
          <p>Find the best clubs, apply for roles, and track your interviews.</p>
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
          <div className={styles.statLabel}><IconChecklist size={16}/> Total Applications</div>
          <div className={styles.statValue}>{myApps.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconSearch size={16}/> Open Opportunities</div>
          <div className={styles.statValue}>{openCycles.length}</div>
        </div>
      </div>

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
