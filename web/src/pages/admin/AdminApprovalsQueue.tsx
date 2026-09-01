import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminDashboard.module.css';
import { IconCheck, IconX, IconClock, IconAlertCircle } from '@tabler/icons-react';

const AdminApprovalsQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    // Fetch all pending approvals for Admin levels (2, 3, 4)
    const { data } = await supabase
      .from('event_approvals')
      .select(`
        *,
        events (*)
      `)
      .in('approver_level', ['RESOURCE_INCHARGE', 'VERTICAL_COORDINATOR', 'DEAN_ADMIN'])
      .eq('decision', 'PENDING')
      .order('created_at', { ascending: true });
      
    if (data) setApprovals(data);
    setLoading(false);
  };

  const handleDecision = async (approvalId: string, eventId: string, decision: 'APPROVED' | 'REJECTED' | 'CONDITIONAL_APPROVAL', nextLevel?: string) => {
    // 1. Update the approval record
    await supabase
      .from('event_approvals')
      .update({ decision, decision_timestamp: new Date().toISOString() })
      .eq('approval_id', approvalId);

    if (decision === 'REJECTED') {
      await supabase.from('events').update({ status: 'cancelled' }).eq('event_id', eventId);
    } else if (decision === 'APPROVED' && nextLevel) {
      // Create the next tier approval
      await supabase.from('event_approvals').insert([{
        event_id: eventId,
        approver_id: '00000000-0000-0000-0000-000000000000', // Need dynamic resolution in a real app
        approver_level: nextLevel,
        decision: 'PENDING'
      }]);
    } else if (decision === 'APPROVED' && !nextLevel) {
      // Final approval (Dean)
      await supabase.from('events').update({ status: 'upcoming' }).eq('event_id', eventId);
    }

    setApprovals(approvals.filter(a => a.approval_id !== approvalId));
  };

  const getNextLevel = (currentLevel: string) => {
    if (currentLevel === 'RESOURCE_INCHARGE') return 'VERTICAL_COORDINATOR';
    if (currentLevel === 'VERTICAL_COORDINATOR') return 'DEAN_ADMIN';
    return null; // Dean is final
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Compliance & Approvals</div>
          <h1>Multi-tier Approvals Queue</h1>
          <p>Review event proposals escalated from Faculty Mentors. Ensure budget and venue compliance.</p>
        </div>
      </div>

      <div className={styles.tableCard} style={{ marginTop: 20 }}>
        {loading ? (
          <div className={styles.emptyState}>Loading pending approvals...</div>
        ) : approvals.length === 0 ? (
          <div className={styles.emptyState}>No events currently require administrative approval.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Level</th>
                <th>Event Title</th>
                <th>Club</th>
                <th>Date & Venue</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map(app => {
                const ev = app.events;
                if (!ev) return null;
                
                let badgeClass = styles.badge;
                let levelName = 'Unknown';
                
                if (app.approver_level === 'RESOURCE_INCHARGE') {
                  badgeClass = `${styles.badge} ${styles.badgeopen}`;
                  levelName = 'L2: Resource';
                } else if (app.approver_level === 'VERTICAL_COORDINATOR') {
                  badgeClass = `${styles.badge} ${styles.badgeclosed}`;
                  levelName = 'L3: Vertical';
                } else if (app.approver_level === 'DEAN_ADMIN') {
                  badgeClass = `${styles.badge} ${styles.badgedraft}`;
                  levelName = 'L4: Dean Admin';
                }

                return (
                  <tr key={app.approval_id}>
                    <td>
                      <span className={badgeClass}>{levelName}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ev.title}</td>
                    <td>{ev.club_name || 'N/A'}</td>
                    <td>{ev.event_date || 'TBD'} @ {ev.venue_name || 'TBA'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          onClick={() => handleDecision(app.approval_id, ev.event_id, 'APPROVED', getNextLevel(app.approver_level))}
                          className={styles.actionBtn} 
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: 'none' }}
                        >
                          <IconCheck size={14}/> {getNextLevel(app.approver_level) ? 'Escalate' : 'Final Approve'}
                        </button>
                        <button 
                          onClick={() => handleDecision(app.approval_id, ev.event_id, 'REJECTED')}
                          className={styles.actionBtn} 
                          style={{ color: 'var(--exec-text-dim)' }}
                        >
                          <IconX size={14}/> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AdminApprovalsQueue;
