import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconChecklist, IconBuilding, IconWallet, IconReceipt2, IconAlertTriangle, IconArrowUpRight, IconCheck, IconFileText, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

const FacultyDashboard: React.FC = () => {
  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  
  const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
  const [needsSignoff, setNeedsSignoff] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentApprovals();
    fetchNeedsSignoff();
    fetchAuditLogs();
  }, []);

  const fetchStats = async () => {
    // Pending
    const { count: pendCount } = await supabase
      .from('event_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('decision', 'PENDING')
      .eq('approver_level', 'FACULTY_MENTOR');
    if (pendCount !== null) setPendingCount(pendCount);

    // Approved
    const { count: appCount } = await supabase
      .from('event_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('decision', 'APPROVED')
      .eq('approver_level', 'FACULTY_MENTOR');
    if (appCount !== null) setApprovedCount(appCount);

    // Rejected
    const { count: rejCount } = await supabase
      .from('event_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('decision', 'REJECTED')
      .eq('approver_level', 'FACULTY_MENTOR');
    if (rejCount !== null) setRejectedCount(rejCount);
  };

  const fetchRecentApprovals = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select('*, events(title, club_name, status)')
      .eq('decision', 'APPROVED')
      .eq('approver_level', 'FACULTY_MENTOR')
      .order('decision_timestamp', { ascending: false })
      .limit(5);
    if (data) setRecentApprovals(data);
  };

  const fetchNeedsSignoff = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select('*, events(title, club_name)')
      .eq('decision', 'PENDING')
      .eq('approver_level', 'FACULTY_MENTOR')
      .order('created_at', { ascending: true })
      .limit(3);
    if (data) setNeedsSignoff(data);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase
      .from('event_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setAuditLogs(data);
  };

  const getTimeElapsed = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h pending`;
    return `${Math.floor(hours / 24)}d pending`;
  };

  const getLogTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'less than an hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('SUBMITTED')) return <IconFileText size={16} />;
    if (action.includes('APPROVED')) return <IconCheck size={16} />;
    if (action.includes('REJECTED')) return <IconUsers size={16} />;
    return <IconAlertTriangle size={16} />;
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good morning, Advisor</div>
          <h1>Registrar's desk</h1>
          <p>{pendingCount} proposals awaiting sign-off · Review queue promptly</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.mono} style={{ fontSize: 12, color: 'var(--fac-ink-faint)' }}>{getDay()}</div>
          <div style={{ fontSize: 11, color: 'var(--fac-ink-faint)' }}>Academic Year 2026–27</div>
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={`${styles.statCard} ${styles.cRed}`}>
          <div className={styles.statIcon}><IconChecklist size={20} /></div>
          <div className={styles.statLabel}>Pending Approvals</div>
          <div className={styles.statValue}>{String(pendingCount).padStart(2, '0')}</div>
          <div className={`${styles.statFoot} ${pendingCount > 0 ? styles.warn : styles.flat}`}>
            {pendingCount > 0 ? <IconAlertTriangle size={14}/> : null} {pendingCount} awaiting review
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.cGreen}`}>
          <div className={styles.statIcon}><IconChecklist size={20} /></div>
          <div className={styles.statLabel}>Total Approved</div>
          <div className={styles.statValue}>{String(approvedCount).padStart(2, '0')}</div>
          <div className={`${styles.statFoot} ${styles.up}`}>All time</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGold}`}>
          <div className={styles.statIcon}><IconAlertTriangle size={20} /></div>
          <div className={styles.statLabel}>Total Rejected</div>
          <div className={styles.statValue}>{String(rejectedCount).padStart(2, '0')}</div>
          <div className={`${styles.statFoot} ${styles.warn}`}>All time</div>
        </div>
        <div className={`${styles.statCard} ${styles.cSapphire}`}>
          <div className={styles.statIcon}><IconBuilding size={20} /></div>
          <div className={styles.statLabel}>Total Events Handled</div>
          <div className={styles.statValue}>{String(pendingCount + approvedCount + rejectedCount).padStart(2, '0')}</div>
          <div className={`${styles.statFoot} ${styles.flat}`}>Under your purview</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Needs your sign-off</div>
              <div className={styles.panelSub}>Ranked by time pending</div>
            </div>
            <Link to="/faculty/approvals" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>Open queue</Link>
          </div>
          <div className={styles.panelBody} style={{ padding: 0 }}>
            {needsSignoff.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--fac-ink-faint)', fontSize: 13, textAlign: 'center' }}>No proposals pending.</div>
            ) : (
              needsSignoff.map(item => (
                <div key={item.approval_id} className={styles.approvalCard}>
                  <div className={styles.approvalThumb}><IconArrowUpRight size={24} /></div>
                  <div className={styles.approvalMain}>
                    <div className={styles.approvalTop}>
                      <div className={styles.approvalTitle}>{item.events?.title}</div>
                      <span className={styles.slaFlag}><IconAlertTriangle size={12} /> {getTimeElapsed(item.created_at)}</span>
                    </div>
                    <div className={styles.approvalMeta}>
                      <span><IconBuilding size={14} /> {item.events?.club_name}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}><div className={styles.panelTitle}>Recent activity</div></div>
          <div className={styles.panelBody} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {auditLogs.length === 0 ? (
               <div style={{ color: 'var(--fac-ink-faint)', fontSize: 13, textAlign: 'center' }}>No recent activity.</div>
            ) : (
              auditLogs.map(log => {
                const isApprove = log.action.includes('APPROVED');
                const isReject = log.action.includes('REJECTED');
                let colorClass = 'var(--fac-ink-soft)';
                let bgClass = 'var(--fac-ink-faint)';
                if (isApprove) {
                  colorClass = 'var(--fac-green)';
                  bgClass = 'var(--fac-green-soft)';
                } else if (isReject) {
                  colorClass = 'var(--fac-red)';
                  bgClass = 'var(--fac-red-soft)';
                } else {
                  colorClass = 'var(--fac-sapphire)';
                  bgClass = 'var(--fac-sapphire-soft)';
                }

                return (
                  <div key={log.log_id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: bgClass, color: colorClass, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                      {getActionIcon(log.action)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.3, fontWeight: 600, color: 'var(--fac-navy)' }}>{log.action}</div>
                      <div style={{ fontSize: 10.8, color: 'var(--fac-ink-faint)' }}>{getLogTime(log.created_at)} by {log.performer_role}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyDashboard;
