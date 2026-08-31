import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IconChecklist, IconCalendarEvent, IconSearch, IconVideo } from '@tabler/icons-react';
import styles from './StudentDashboard.module.css';
import StatusBadge from '../../components/StatusBadge';

const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [openCycles, setOpenCycles] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [upcomingInterview, setUpcomingInterview] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      supabase.from('users').select('id').eq('auth_user_id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setDbUserId(data.id);
            fetchData(data.id);
          }
        });
    }
  }, [user]);

  const fetchData = async (uid: string) => {
    // Open cycles
    const { data: cyclesData } = await supabase.from('recruitment_cycles').select('*').eq('status', 'open').limit(3);
    if (cyclesData) setOpenCycles(cyclesData);

    // My applications
    const { data: appsData } = await supabase.from('applications')
      .select('*, recruitment_cycles(title, club_name), recruitment_roles(role_name)')
      .eq('student_id', uid)
      .order('applied_at', { ascending: false })
      .limit(3);
    if (appsData) setMyApps(appsData);

    // Upcoming interview
    const { data: interviewsData } = await supabase.from('interviews')
      .select('*, applications!inner(student_id, recruitment_cycles(title, club_name))')
      .eq('applications.student_id', uid)
      .eq('status', 'scheduled')
      .order('interview_date', { ascending: true })
      .limit(1);
    
    if (interviewsData && interviewsData.length > 0) {
      setUpcomingInterview(interviewsData[0]);
    }
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Student Portal</div>
          <h1>Welcome back, {profile?.name?.split(' ')[0]}!</h1>
          <p>Find the best clubs, apply for roles, and track your interviews.</p>
        </div>
      </div>

      {upcomingInterview && (
        <div className={styles.interviewCard}>
          <div className={styles.intIcon}><IconCalendarEvent size={24} /></div>
          <div className={styles.intContent}>
            <h3>Upcoming Interview: {upcomingInterview.applications.recruitment_cycles.club_name}</h3>
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
                <div key={cycle.id} className={styles.cycleCard}>
                  <div className={styles.cycleHeader}>
                    <h4>{cycle.title}</h4>
                    <span className={styles.clubName}>{cycle.club_name}</span>
                  </div>
                  <div className={styles.cycleMeta}>
                    Deadline: {new Date(cycle.application_deadline).toLocaleDateString()}
                  </div>
                  <button className={styles.applyBtn} onClick={() => navigate(`/student/apply/${cycle.id}`)}>Apply Now</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.sectionHeader}>
            <h2>My Recent Applications</h2>
            <button onClick={() => navigate('/student/applications')} className={styles.textBtn}>View All</button>
          </div>
          <div className={styles.appList}>
            {myApps.length === 0 ? (
              <div className={styles.emptyState}>You haven't applied to any clubs yet.</div>
            ) : (
              myApps.map(app => (
                <div key={app.id} className={styles.appCard}>
                  <div>
                    <div className={styles.appTitle}>{app.recruitment_roles?.role_name}</div>
                    <div className={styles.appClub}>{app.recruitment_cycles?.club_name}</div>
                  </div>
                  <StatusBadge status={app.status} size="sm" />
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
