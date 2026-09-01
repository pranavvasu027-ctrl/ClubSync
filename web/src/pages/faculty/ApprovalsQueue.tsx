import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconCheck, IconX } from '@tabler/icons-react';

const ApprovalsQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select(`
        *,
        events (*)
      `)
      .eq('approver_level', 'FACULTY_MENTOR')
      .eq('decision', 'PENDING');
      
    if (data) setApprovals(data);
  };

  const handleDecision = async (approvalId: string, eventId: string, decision: 'APPROVED' | 'REJECTED') => {
    // 1. Update the approval record
    await supabase
      .from('event_approvals')
      .update({ decision, decision_timestamp: new Date().toISOString() })
      .eq('approval_id', approvalId);

    // 2. If approved, update the event status to 'upcoming' (or advance to next approval tier)
    if (decision === 'APPROVED') {
      await supabase.from('events').update({ status: 'upcoming' }).eq('event_id', eventId);
    } else {
      await supabase.from('events').update({ status: 'cancelled' }).eq('event_id', eventId);
    }

    setApprovals(approvals.filter(a => a.approval_id !== approvalId));
  };

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Approvals Queue</h1>
          <div className={layoutStyles.sub}>Review and sign off on proposals submitted by the executive committee.</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelTitle}>Pending Events (Level 1)</div>
        {approvals.length === 0 ? (
          <div style={{ color: 'var(--fac-text-dim)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No events pending approval.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Proposal</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Date & Location</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Type</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map(app => {
                const ev = app.events;
                if (!ev) return null;
                return (
                  <tr key={app.approval_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '11px 10px', fontWeight: 600 }}>{ev.title}</td>
                    <td style={{ padding: '11px 10px', color: 'var(--fac-text-dim)' }}>
                      {ev.event_date || 'TBD'} · {ev.venue_name || 'TBA'}
                    </td>
                    <td style={{ padding: '11px 10px', fontFamily: 'monospace', color: 'var(--fac-amber)' }}>{ev.event_type}</td>
                    <td style={{ padding: '11px 10px', display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDecision(app.approval_id, ev.event_id, 'APPROVED')} style={{ padding: '5px 10px', borderRadius: 4, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ADE80', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                        <IconCheck size={14}/> Approve
                      </button>
                      <button onClick={() => handleDecision(app.approval_id, ev.event_id, 'REJECTED')} style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid var(--fac-line-strong)', background: 'transparent', color: 'var(--fac-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                        <IconX size={14}/> Reject
                      </button>
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

export default ApprovalsQueue;
