import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { IconChecklist, IconCalendarEvent, IconTrophy, IconArrowRight } from '@tabler/icons-react';
import styles from './RecruiterDashboard.module.css';
import StatusBadge from '../../components/StatusBadge';

const RecruiterDashboard = () => {
  const [stats, setStats] = useState({ totalApps: 0, shortlisted: 0, interviewsToday: 0, selected: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { count: appsCount } = await supabase.from('applications').select('*', { count: 'exact', head: true });
    const { count: shortCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted');
    const { count: selCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['selected', 'onboarded']);
    
    // interviews today
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: intCount } = await supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('interview_date', todayStr);
    
    setStats({
      totalApps: appsCount || 0,
      shortlisted: shortCount || 0,
      interviewsToday: intCount || 0,
      selected: selCount || 0
    });

    // Recent applications
    const { data: recent } = await supabase.from('applications')
      .select('*, recruitment_cycles(title), recruitment_roles(role_name)')
      .order('applied_at', { ascending: false })
      .limit(5);
    
    if (recent) setRecentApps(recent);
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Recruiter Hub</div>
          <h1>Recruitment Pipeline</h1>
          <p>Track, screen, and evaluate candidates across all active cycles.</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => navigate('/recruiter/shortlisting')}>
          Go to Shortlisting <IconArrowRight size={16}/>
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconChecklist size={16}/> Total Applications</div>
          <div className={styles.statValue}>{stats.totalApps}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconChecklist size={16}/> Shortlisted</div>
          <div className={styles.statValue}>{stats.shortlisted}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconCalendarEvent size={16}/> Interviews Today</div>
          <div className={styles.statValue}>{stats.interviewsToday}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}><IconTrophy size={16}/> Selected</div>
          <div className={styles.statValue}>{stats.selected}</div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Recent Applications</h2>
        <button onClick={() => navigate('/recruiter/applications')} className={styles.textBtn}>View All</button>
      </div>

      <div className={styles.tableCard}>
        {recentApps.length === 0 ? (
          <div className={styles.emptyState}>No applications received yet.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Role</th>
                <th>Cycle</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.student_name}</td>
                  <td>{app.recruitment_roles?.role_name}</td>
                  <td>{app.recruitment_cycles?.title}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={app.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default RecruiterDashboard;
