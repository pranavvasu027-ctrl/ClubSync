import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconCheck, IconX, IconEye } from '@tabler/icons-react';

const ApprovalsQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

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
    if (decision === 'REJECTED' && !remarks.trim()) {
      setError('Remarks are required when rejecting a proposal.');
      return;
    }

    // 1. Update the approval record
    await supabase
      .from('event_approvals')
      .update({ decision, remarks, decision_timestamp: new Date().toISOString() })
      .eq('approval_id', approvalId);

    // 2. Update the event status
    if (decision === 'APPROVED') {
      await supabase.from('events').update({ status: 'approved' }).eq('event_id', eventId);
    } else {
      await supabase.from('events').update({ status: 'rejected' }).eq('event_id', eventId);
    }

    setApprovals(approvals.filter(a => a.approval_id !== approvalId));
    setSelectedEvent(null);
    setRemarks('');
    setError('');
  };

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Approvals Queue</h1>
          <div className={layoutStyles.sub}>Review and sign off on proposals submitted by the executive committee.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className={styles.panel} style={{ flex: 1 }}>
          <div className={styles.panelTitle}>Pending Events (Level 1)</div>
          {approvals.length === 0 ? (
            <div style={{ color: 'var(--fac-text-dim)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No events pending approval.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Proposal</th>
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Type</th>
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(app => {
                  const ev = app.events;
                  if (!ev) return null;
                  return (
                    <tr key={app.approval_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedEvent?.approval_id === app.approval_id ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td style={{ padding: '11px 10px', fontWeight: 600 }}>{ev.title}</td>
                      <td style={{ padding: '11px 10px', fontFamily: 'monospace', color: 'var(--fac-amber)' }}>{ev.event_type}</td>
                      <td style={{ padding: '11px 10px', display: 'flex', gap: 8 }}>
                        <button onClick={() => setSelectedEvent(app)} style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid var(--fac-line-strong)', background: 'transparent', color: 'var(--fac-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                          <IconEye size={14}/> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selectedEvent && (
          <div className={styles.panel} style={{ flex: 1 }}>
            <div className={styles.panelTitle}>Proposal Details</div>
            
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Title</strong>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedEvent.events.title}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Type</strong>
                  <div>{selectedEvent.events.event_type}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Scope</strong>
                  <div>{selectedEvent.events.scope}</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Date & Time</strong>
                  <div>{selectedEvent.events.event_date} ({selectedEvent.events.event_time})</div>
                </div>
                <div>
                  <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Venue</strong>
                  <div>{selectedEvent.events.venue_name}</div>
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Description / Outline</strong>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--fac-text-dim)', marginTop: 4 }}>{selectedEvent.events.description || 'N/A'}</div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Objectives</strong>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--fac-text-dim)', marginTop: 4 }}>{selectedEvent.events.objectives || 'N/A'}</div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-text-faint)', fontSize: 11, textTransform: 'uppercase' }}>Expected Outcomes</strong>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--fac-text-dim)', marginTop: 4 }}>{selectedEvent.events.expected_outcomes || 'N/A'}</div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--fac-line)' }}>
              {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
              
              <textarea 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks (Required for rejection)"
                rows={2}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--fac-line-strong)', borderRadius: 6, color: 'var(--fac-text)', fontSize: 13, marginBottom: 12 }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleDecision(selectedEvent.approval_id, selectedEvent.events.event_id, 'APPROVED')} style={{ flex: 1, padding: '8px', borderRadius: 4, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ADE80', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  <IconCheck size={16}/> Approve
                </button>
                <button onClick={() => handleDecision(selectedEvent.approval_id, selectedEvent.events.event_id, 'REJECTED')} style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #EF4444', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                  <IconX size={16}/> Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ApprovalsQueue;
