import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './AdminDashboard.module.css';
import { IconCheck, IconX, IconCoin, IconEdit } from '@tabler/icons-react';

const FinanceVerification: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    // Fetch events that have a budget allocated
    const { data } = await supabase
      .from('events')
      .select('event_id, title, club_name, event_date, budget_allocated')
      .gt('budget_allocated', 0)
      .order('created_at', { ascending: false });
      
    if (data) setEvents(data);
    setLoading(false);
  };

  const loadEventBudgets = async (ev: any) => {
    setSelectedEvent(ev);
    const { data } = await supabase.from('event_budgets').select('*').eq('event_id', ev.event_id);
    if (data) setBudgets(data);
  };

  const handleApprove = async (budgetId: string) => {
    await supabase.from('event_budgets').update({ is_approved: true }).eq('budget_item_id', budgetId);
    setBudgets(budgets.map(b => b.budget_item_id === budgetId ? { ...b, is_approved: true } : b));
  };

  const handleReject = async (budgetId: string) => {
    await supabase.from('event_budgets').delete().eq('budget_item_id', budgetId);
    setBudgets(budgets.filter(b => b.budget_item_id !== budgetId));
  };

  const handleUpdateActual = async (budgetId: string, amountStr: string) => {
    const actual = parseFloat(amountStr) || 0;
    await supabase.from('event_budgets').update({ actual_amount: actual }).eq('budget_item_id', budgetId);
    setBudgets(budgets.map(b => b.budget_item_id === budgetId ? { ...b, actual_amount: actual } : b));
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Finance & Ledger</div>
          <h1>Finance Verification</h1>
          <p>Review event budget requests, approve line items, and audit actual costs.</p>
        </div>
        {selectedEvent && (
          <button className={styles.actionBtn} onClick={() => setSelectedEvent(null)}>
            Back to Event List
          </button>
        )}
      </div>

      {!selectedEvent ? (
        <div className={styles.tableCard} style={{ marginTop: 20 }}>
          {loading ? (
            <div className={styles.emptyState}>Loading financial data...</div>
          ) : events.length === 0 ? (
            <div className={styles.emptyState}>No events with budget requests found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Club</th>
                  <th>Total Budget Ask</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.event_id}>
                    <td style={{ fontWeight: 600 }}>{ev.title}</td>
                    <td>{ev.club_name || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--adm-accent)' }}>₹{ev.budget_allocated}</td>
                    <td>
                      <button 
                        onClick={() => loadEventBudgets(ev)}
                        className={styles.actionBtn} 
                      >
                        Audit Line Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-line)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--adm-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Event</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{selectedEvent.title}</div>
            </div>
            <div style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-line)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--adm-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Total Estimated</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#FBBF24', fontFamily: 'monospace' }}>
                ₹{budgets.reduce((a, b) => a + b.estimated_amount, 0).toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-line)', padding: 20, borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--adm-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Total Actual Cost</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4ADE80', fontFamily: 'monospace' }}>
                ₹{budgets.reduce((a, b) => a + (b.actual_amount || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category & Description</th>
                  <th>Estimated Ask</th>
                  <th>Actual Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => (
                  <tr key={b.budget_item_id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.category}</div>
                      <div style={{ color: 'var(--adm-text-dim)', fontSize: 12 }}>{b.description}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#FBBF24' }}>₹{b.estimated_amount.toLocaleString()}</td>
                    <td>
                      {b.is_approved ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', color: '#4ADE80' }}>₹</span>
                          <input 
                            type="number" 
                            defaultValue={b.actual_amount || ''}
                            onBlur={(e) => handleUpdateActual(b.budget_item_id, e.target.value)}
                            style={{ width: 80, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--adm-line)', color: '#fff', padding: '4px 8px', borderRadius: 4 }}
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--adm-text-faint)' }}>Pending Approval</span>
                      )}
                    </td>
                    <td>
                      {b.is_approved ? (
                        <span className={`${styles.badge} ${styles.badgeopen}`}>APPROVED</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgedraft}`}>PENDING</span>
                      )}
                    </td>
                    <td>
                      {!b.is_approved ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleApprove(b.budget_item_id)} style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Approve</button>
                          <button onClick={() => handleReject(b.budget_item_id)} style={{ background: 'transparent', border: '1px solid var(--adm-line)', color: 'var(--adm-text-dim)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--adm-text-faint)', fontSize: 12 }}>Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default FinanceVerification;
