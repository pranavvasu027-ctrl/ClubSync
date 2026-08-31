import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { IconLayoutGrid, IconUsers, IconBriefcase, IconChecklist } from '@tabler/icons-react';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ cycles: 0, applicants: 0, selected: 0, members: 0 });
  const [cycles, setCycles] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Basic stats
    const { count: cyclesCount } = await supabase.from('recruitment_cycles').select('*', { count: 'exact', head: true }).eq('status', 'open');
    const { count: appsCount } = await supabase.from('applications').select('*', { count: 'exact', head: true });
    const { count: selCount } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'selected');
    const { count: memCount } = await supabase.from('club_members').select('*', { count: 'exact', head: true });
    
    setStats({
      cycles: cyclesCount || 0,
      applicants: appsCount || 0,
      selected: selCount || 0,
      members: memCount || 0
    });

    // Recent cycles
    const { data: cyclesData } = await supabase.from('recruitment_cycles').select('*').order('created_at', { ascending: false }).limit(5);
    if (cyclesData) setCycles(cyclesData);
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Admin Dashboard</div>
          <h1>Recruitment Control Center</h1>
          <p>Manage all active recruitment cycles and track pipeline progress.</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => navigate('/admin/create-cycle')}>
          Create New Cycle
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cBlue}`}>
          <div className={styles.statLabel}><IconLayoutGrid size={16}/> Active Cycles</div>
          <div className={styles.statValue}>{stats.cycles}</div>
        </div>
        <div className={`${styles.statCard} ${styles.cAmber}`}>
          <div className={styles.statLabel}><IconChecklist size={16}/> Total Applicants</div>
          <div className={styles.statValue}>{stats.applicants}</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGreen}`}>
          <div className={styles.statLabel}><IconBriefcase size={16}/> Candidates Selected</div>
          <div className={styles.statValue}>{stats.selected}</div>
        </div>
        <div className={`${styles.statCard} ${styles.cPurple}`}>
          <div className={styles.statLabel}><IconUsers size={16}/> Total Onboarded</div>
          <div className={styles.statValue}>{stats.members}</div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Recent Cycles</h2>
        <button onClick={() => navigate('/admin/cycles')} className={styles.textBtn}>View All</button>
      </div>

      <div className={styles.tableCard}>
        {cycles.length === 0 ? (
          <div className={styles.emptyState}>No recruitment cycles found. Create one to get started.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Club Name</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map(cycle => (
                <tr key={cycle.id}>
                  <td style={{ fontWeight: 600 }}>{cycle.title}</td>
                  <td>{cycle.club_name}</td>
                  <td>
                    <span className={`${styles.badge} ${styles['badge' + cycle.status]}`}>
                      {cycle.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(cycle.application_deadline).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => navigate('/admin/cycles')} className={styles.actionBtn}>Manage</button>
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

export default AdminDashboard;
