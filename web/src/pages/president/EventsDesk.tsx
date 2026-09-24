import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ReactSortable } from 'react-sortablejs';
import styles from './PresidentDashboard.module.css';
import { IconCalendarEvent, IconMapPin, IconUsers, IconLayoutGrid, IconLayoutKanban, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// ReactSortable requires items to have an `id` property
type SortableEvent = {
  id: string; // mapped from event_id
  event_id: string;
  title: string;
  event_date: string;
  venue_name: string;
  expected_count: number;
  status: string;
  [key: string]: any;
};

const EventsDesk: React.FC = () => {
  const [events, setEvents] = useState<SortableEvent[]>([]);
  const [view, setView] = useState<'cards' | 'kanban'>('kanban');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (data) {
      // Map event_id -> id for ReactSortable compatibility
      setEvents(data.map((e: any) => ({ ...e, id: e.event_id })));
    }
  };

  const updateEventStatus = async (newColEvents: SortableEvent[], status: string) => {
    setEvents(prev => {
      const otherEvents = prev.filter(e => e.status !== status);
      const updatedEvents = newColEvents.map(e => ({ ...e, status }));
      return [...otherEvents, ...updatedEvents];
    });

    for (const ev of newColEvents) {
      if (ev.status !== status) {
        await supabase.from('events').update({ status }).eq('event_id', ev.event_id);
      }
    }
  };

  const columns = [
    { id: 'draft', title: 'Draft' },
    { id: 'proposed', title: 'Submitted / Pending' },
    { id: 'approved', title: 'Approved' },
    { id: 'live', title: 'Published / Live' },
    { id: 'past', title: 'Completed' },
  ];

  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>Events desk</h1>
          <p>Every proposal, live run, and archive — one paper trail.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 8, padding: 3, gap: 2 }}>
            <button 
              onClick={() => setView('cards')}
              style={{ border: 'none', background: view === 'cards' ? 'var(--pres-card)' : 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: view === 'cards' ? 'var(--pres-ink)' : 'var(--pres-ink-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: view === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              <IconLayoutGrid size={14}/> Cards
            </button>
            <button onClick={() => setView('kanban')} style={{ border: 'none', background: view === 'kanban' ? 'var(--pres-card)' : 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: view === 'kanban' ? 'var(--pres-ink)' : 'var(--pres-ink-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              <IconLayoutKanban size={14}/> Board
            </button>
          </div>
          <button onClick={() => navigate('/president/events/new')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', cursor: 'pointer', background: 'var(--pres-red)', color: '#fff', boxShadow: '0 2px 0 #9C3620' }}>
            <IconPlus size={16}/> New event
          </button>
        </div>
      </div>

      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
          {columns.map(col => {
            const colEvents = events.filter(e => e.status === col.id);
            return (
              <div key={col.id} style={{ flex: '0 0 250px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '0 2px' }}>
                  {col.title} <span style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule-strong)', borderRadius: 10, padding: '1px 7px', fontSize: 10.5, color: 'var(--pres-ink-soft)' }}>{colEvents.length}</span>
                </div>
                
                <ReactSortable
                  list={colEvents}
                  setList={(newList) => updateEventStatus(newList, col.id)}
                  group="events"
                  animation={150}
                  style={{ flex: 1, minHeight: 50 }}
                >
                  {colEvents.map(ev => (
                    <div key={ev.id} style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule)', borderRadius: 7, padding: '11px 12px', marginBottom: 9, cursor: 'grab', fontSize: 12.5, boxShadow: 'var(--pres-shadow-card)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{ev.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--pres-ink-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconCalendarEvent size={12}/> {ev.event_date && !isNaN(new Date(ev.event_date).getTime()) ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}
                      </div>
                    </div>
                  ))}
                </ReactSortable>
              </div>
            );
          })}
        </div>
      )}

      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {events.map(ev => {
            let statusClass = '';
            if (ev.status === 'live') statusClass = styles.stLive;
            if (ev.status === 'proposed') statusClass = styles.stPending;
            if (ev.status === 'approved') statusClass = styles.stApproved;
            if (ev.status === 'draft') statusClass = styles.stDraft;

            return (
              <div key={ev.id} className={`${styles.eventCard} ${statusClass}`}>
                <span className={`${styles.stamp} ${statusClass}`}>{ev.status}</span>
                <div className={styles.eventTitle}>{ev.title}</div>
                <div className={styles.eventMeta}>
                  <span><IconCalendarEvent size={14}/> {ev.event_date && !isNaN(new Date(ev.event_date).getTime()) ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}</span>
                  <span><IconMapPin size={14}/> {ev.venue_name || 'TBD'}</span>
                  <span><IconUsers size={14}/> {ev.expected_count || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default EventsDesk;
