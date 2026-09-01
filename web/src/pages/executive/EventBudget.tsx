import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './TaskBoard.module.css'; // Reusing TaskBoard styles for layout
import { IconCurrencyRupee, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react';

const EventBudget: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'Equipment', description: '', amount: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchBudgets(selectedEventId);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    // Organizers can plan budget for their events
    const { data } = await supabase.from('events').select('event_id, title').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].event_id);
    }
  };

  const fetchBudgets = async (eventId: string) => {
    const { data } = await supabase.from('event_budgets').select('*').eq('event_id', eventId);
    if (data) setBudgets(data);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !newItem.description || !newItem.amount) return;

    const reqItem = {
      event_id: selectedEventId,
      category: newItem.category,
      description: newItem.description,
      estimated_amount: parseFloat(newItem.amount)
    };

    const { data, error } = await supabase.from('event_budgets').insert([reqItem]).select().single();
    
    if (data && !error) {
      setBudgets([...budgets, data]);
      setIsModalOpen(false);
      setNewItem({ category: 'Equipment', description: '', amount: '' });
      
      // Update the event's total budget ask
      const total = budgets.reduce((acc, b) => acc + b.estimated_amount, 0) + parseFloat(newItem.amount);
      await supabase.from('events').update({ budget_allocated: total }).eq('event_id', selectedEventId);
    }
  };

  const handleDelete = async (budgetId: string) => {
    await supabase.from('event_budgets').delete().eq('budget_item_id', budgetId);
    const updated = budgets.filter(b => b.budget_item_id !== budgetId);
    setBudgets(updated);
    
    const total = updated.reduce((acc, b) => acc + b.estimated_amount, 0);
    await supabase.from('events').update({ budget_allocated: total }).eq('event_id', selectedEventId);
  };

  const totalEstimated = budgets.reduce((acc, b) => acc + b.estimated_amount, 0);
  const totalApproved = budgets.filter(b => b.is_approved).reduce((acc, b) => acc + b.estimated_amount, 0);

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Plan & Request</div>
          <h1>Event Budget Planner</h1>
          <p>Estimate costs and request funds for upcoming events.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--exec-panel-2)', color: '#fff', border: '1px solid var(--exec-line)' }}
          >
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
          <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
            + Add Line Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Total Estimated Ask</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--exec-amber)', fontFamily: 'monospace' }}>₹{totalEstimated.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Total Approved Funds</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--exec-lime)', fontFamily: 'monospace' }}>₹{totalApproved.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ background: 'var(--exec-panel-2)', border: '1px solid var(--exec-line)', borderRadius: 12, padding: 20 }}>
        {budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--exec-text-dim)' }}>No budget items planned for this event yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingBottom: 12, borderBottom: '1px solid var(--exec-line)', color: 'var(--exec-text-dim)' }}>Category</th>
                <th style={{ textAlign: 'left', paddingBottom: 12, borderBottom: '1px solid var(--exec-line)', color: 'var(--exec-text-dim)' }}>Description</th>
                <th style={{ textAlign: 'left', paddingBottom: 12, borderBottom: '1px solid var(--exec-line)', color: 'var(--exec-text-dim)' }}>Estimated Cost</th>
                <th style={{ textAlign: 'left', paddingBottom: 12, borderBottom: '1px solid var(--exec-line)', color: 'var(--exec-text-dim)' }}>Status</th>
                <th style={{ textAlign: 'left', paddingBottom: 12, borderBottom: '1px solid var(--exec-line)', color: 'var(--exec-text-dim)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.budget_item_id}>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{b.category}</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{b.description}</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'monospace' }}>₹{b.estimated_amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {b.is_approved ? (
                      <span style={{ background: 'rgba(163,230,53,0.1)', color: '#A3E635', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>APPROVED</span>
                    ) : (
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--exec-text-dim)', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {!b.is_approved && (
                      <button onClick={() => handleDelete(b.budget_item_id)} style={{ background: 'transparent', border: 'none', color: 'var(--exec-coral)', cursor: 'pointer' }}>
                        <IconTrash size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add Budget Item</h2>
            <form onSubmit={handleAddItem}>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  <option>Equipment</option>
                  <option>Venue</option>
                  <option>Materials</option>
                  <option>Prizes</option>
                  <option>Refreshments</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input type="text" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="e.g. 50 T-shirts for volunteers" required />
              </div>
              <div className={styles.formGroup}>
                <label>Estimated Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} placeholder="0.00" required />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createBtn}>Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EventBudget;
