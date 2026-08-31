import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ClubEvent } from '../../types/clubData';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconCheck, IconX } from '@tabler/icons-react';

const ApprovalsQueue: React.FC = () => {
  const [events, setEvents] = useState<ClubEvent[]>([]);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase.from('club_events').select('*').eq('status', 'pending');
    if (data) setEvents(data);
  };

  const handleApprove = async (id: string) => {
    await supabase.from('club_events').update({ status: 'approved' }).eq('id', id);
    setEvents(events.filter(e => e.id !== id));
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
        <div className={styles.panelTitle}>Pending Events</div>
        {events.length === 0 ? (
          <div style={{ color: 'var(--fac-text-dim)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No events pending approval.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Proposal</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Date & Location</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Budget Ask</th>
                <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-line)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '11px 10px', fontWeight: 600 }}>{ev.title}</td>
                  <td style={{ padding: '11px 10px', color: 'var(--fac-text-dim)' }}>
                    {new Date(ev.event_date).toLocaleDateString('en-GB')} · {ev.location}
                  </td>
                  <td style={{ padding: '11px 10px', fontFamily: 'monospace', color: 'var(--fac-amber)' }}>₹{ev.budget_allocated.toLocaleString()}</td>
                  <td style={{ padding: '11px 10px', display: 'flex', gap: 8 }}>
                    <button onClick={() => handleApprove(ev.id)} style={{ padding: '5px 10px', borderRadius: 4, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ADE80', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                      <IconCheck size={14}/> Approve
                    </button>
                    <button style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid var(--fac-line-strong)', background: 'transparent', color: 'var(--fac-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                      <IconX size={14}/> Reject
                    </button>
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

export default ApprovalsQueue;
