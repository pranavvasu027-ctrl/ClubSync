import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import { 
  IconChecklist, 
  IconBuilding, 
  IconAlertTriangle, 
  IconArrowUpRight, 
  IconCheck, 
  IconFileText, 
  IconUsers,
  IconArrowRight,
  IconX
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventStore } from '../../services/eventStore';

const FacultyDashboard: React.FC = () => {
  const { profile, supervisedClubs } = useAuth();
  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  
  const [needsSignoff, setNeedsSignoff] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    // Read from eventStore + Supabase
    const all = eventStore.getAllEvents();
    setPendingCount(all.filter(e => e.status === 'under_review').length);
    setApprovedCount(all.filter(e => e.status === 'approved' || e.status === 'published' || e.status === 'completed').length);
    setRejectedCount(all.filter(e => e.status === 'rejected').length);

    const pending = all.filter(e => e.status === 'under_review').slice(0, 4);
    setNeedsSignoff(pending);
  }, [supervisedClubs]);

  const fetchAuditLogs = async () => {
    const { data } = await supabase
      .from('event_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setAuditLogs(data);
  };

  useEffect(() => {
    fetchStats();
    fetchAuditLogs();

    const handleUpdate = () => {
      fetchStats();
    };
    window.addEventListener('clubsync:event_updated', handleUpdate);
    return () => window.removeEventListener('clubsync:event_updated', handleUpdate);
  }, [fetchStats]);

  const getActionIcon = (action: string) => {
    if (action.includes('SUBMITTED')) return <IconFileText size={16} />;
    if (action.includes('APPROVED')) return <IconCheck size={16} />;
    if (action.includes('REJECTED')) return <IconX size={16} />;
    return <IconAlertTriangle size={16} />;
  };

  return (
    <>
      {/* Hero Header */}
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Faculty Advisor Desk · Dr. S. K. Kulkarni</div>
          <h1>Faculty Review & Sanctions Desk</h1>
          <p>{pendingCount} proposals awaiting your review & venue conflict evaluation</p>
        </div>
        <div className={styles.heroDate}>
          <strong>{getDay()}</strong>
          Academic Year 2026–27
        </div>
      </div>

      {/* Modern Stat Cards (Student UI style) */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Pending Proposals</span>
            <div className={`${styles.statIconBox} ${styles.amber}`}>
              <IconChecklist size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {String(pendingCount).padStart(2, '0')}
          </div>
          <div className={`${styles.statFoot} ${pendingCount > 0 ? styles.warning : styles.positive}`}>
            {pendingCount > 0 ? `${pendingCount} awaiting mentor sanction` : 'All caught up'}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Sanctioned</span>
            <div className={`${styles.statIconBox} ${styles.green}`}>
              <IconCheck size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {String(approvedCount).padStart(2, '0')}
          </div>
          <div className={`${styles.statFoot} ${styles.positive}`}>
            Approved for student publication
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Revisions / Rejected</span>
            <div className={`${styles.statIconBox} ${styles.red}`}>
              <IconAlertTriangle size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {String(rejectedCount).padStart(2, '0')}
          </div>
          <div className={styles.statFoot}>
            Returned with remarks
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Total Lifecycle Events</span>
            <div className={`${styles.statIconBox} ${styles.blue}`}>
              <IconBuilding size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {String(pendingCount + approvedCount + rejectedCount).padStart(2, '0')}
          </div>
          <div className={styles.statFoot}>
            Under departmental purview
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Column: Proposals Waiting */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Needs Your Sign-Off</div>
              <div className={styles.panelSub}>Proposals in the Faculty Review Queue</div>
            </div>
            <Link to="/faculty/approvals" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
              Open Review Queue <IconArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.panelBody} style={{ padding: 0 }}>
            {needsSignoff.length === 0 ? (
              <div style={{ padding: '28px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                🎉 No proposals pending review. All student submissions are up to date!
              </div>
            ) : (
              needsSignoff.map(ev => (
                <div key={ev.event_id} className={styles.approvalCard}>
                  <div className={styles.approvalThumb}>
                    <IconArrowUpRight size={20} />
                  </div>
                  <div className={styles.approvalMain}>
                    <div className={styles.approvalTop}>
                      <div className={styles.approvalTitle}>{ev.title}</div>
                      <span className={styles.slaFlag}>
                        <IconAlertTriangle size={12} /> Awaiting Review
                      </span>
                    </div>
                    <div className={styles.approvalMeta}>
                      <span><IconBuilding size={14} /> {ev.club_name}</span>
                      <span><IconUsers size={14} /> {ev.expected_count || 100} students</span>
                      <span>📍 {ev.venue_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Recent Governance Activity</div>
              <div className={styles.panelSub}>Audit notes and decision stamps</div>
            </div>
          </div>
          <div className={styles.panelBody}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
                <IconCheck size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Sanction Granted: HackVIT 2026</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Labs 1–4 approved with high-speed uplink</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--blue-soft)', color: 'var(--blue)', display: 'grid', placeItems: 'center' }}>
                <IconFileText size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Budget Sanctioned: AI Bootcamp</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>₹15,000 honorarium verified within norms</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--amber-soft)', color: 'var(--amber)', display: 'grid', placeItems: 'center' }}>
                <IconAlertTriangle size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Revisions Requested: RoboWars Arena</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Safety shield specification documentation requested</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyDashboard;
