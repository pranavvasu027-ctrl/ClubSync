import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import styles from './PresidentDashboard.module.css';
import { IconCalendarEvent, IconMapPin, IconUsers, IconLayoutGrid, IconLayoutKanban, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

type EventData = {
  event_id: string;
  title: string;
  event_date: string;
  venue_name: string;
  expected_count: number;
  status: string;
  [key: string]: any;
};

const EventsDesk: React.FC = () => {
  const { club } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [view, setView] = useState<'cards' | 'kanban'>('kanban');
  const navigate = useNavigate();

  useEffect(() => {
    if (club?.club_id) {
      fetchEvents();
    }
  }, [club]);

  const fetchEvents = async () => {
    if (!club?.club_id) return;
    const { data } = await supabase.from('events')
      .select('*')
      .eq('club_id', club.club_id)
      .eq('is_deleted', false)
      .order('event_date', { ascending: true });
      
    if (data) {
      // Fetch latest remarks for changes_requested or rejected events
      const targetIds = data.filter(e => e.status === 'changes_requested' || e.status === 'rejected').map(e => e.event_id);
      
      let remarksMap: Record<string, string> = {};
      if (targetIds.length > 0) {
        const { data: auditData } = await supabase.from('event_audit_log')
          .select('event_id, reason, created_at')
          .in('event_id', targetIds)
          .in('new_status', ['changes_requested', 'rejected'])
          .order('created_at', { ascending: false });
          
        if (auditData) {
          auditData.forEach(log => {
            if (!remarksMap[log.event_id] && log.reason) {
              remarksMap[log.event_id] = log.reason;
            }
          });
        }
      }

      const enriched = data.map(e => ({
        ...e,
        remarks: remarksMap[e.event_id] || ''
      }));
      setEvents(enriched);
    }
  };

  const submitForApproval = async (eventId: string) => {
    try {
      const { error } = await supabase.rpc('submit_event_for_approval', { p_event_id: eventId });
      if (error) throw error;
      alert('Event submitted for approval!');
      fetchEvents();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const completeEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.rpc('complete_event', { p_event_id: eventId });
      if (error) throw error;
      alert('Event marked as completed!');
      fetchEvents();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!club?.club_id) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>No club assigned</h2>
      </div>
    );
  }

  const columns = [
    { id: 'draft', title: 'Draft' },
    { id: 'changes_requested', title: 'Changes Requested' },
    { id: 'under_review', title: 'In Approval Queue' },
    { id: 'approved', title: 'Approved (Setup)' },
    { id: 'published', title: 'Published / Open' },
    { id: 'live', title: 'Live Event Day' },
    { id: 'rejected', title: 'Rejected' },
    { id: 'completed', title: 'Completed / Past' },
  ];

  const renderActions = (ev: EventData) => {
    switch (ev.status) {
      case 'draft':
        return (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => navigate(`/president/events/new?edit=${ev.event_id}`)} style={{ flex: 1, padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--pres-rule)', background: 'var(--pres-paper)' }}>Edit</button>
            <button onClick={() => submitForApproval(ev.event_id)} style={{ flex: 2, padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: 'none', background: 'var(--pres-ink)', color: 'white' }}>Submit for Approval</button>
          </div>
        );
      case 'changes_requested':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {ev.remarks && (
              <div style={{ fontSize: 11, background: '#fef9c3', color: '#854d0e', padding: '6px 8px', borderRadius: 4, border: '1px solid #fde047' }}>
                <strong>Faculty Remarks:</strong> {ev.remarks}
              </div>
            )}
            <button onClick={() => navigate(`/president/events/new?edit=${ev.event_id}`)} style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--pres-rule)', background: 'var(--pres-paper)' }}>Edit & Resubmit</button>
          </div>
        );
      case 'rejected':
        return (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 4, display: 'inline-block', width: 'fit-content' }}>Rejected</span>
            {ev.remarks && (
              <div style={{ fontSize: 11, color: '#7f1d1d' }}>
                <strong>Reason:</strong> {ev.remarks}
              </div>
            )}
          </div>
        );
      case 'under_review':
        return (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 8px', background: 'var(--pres-card)', border: '1px solid var(--pres-rule)', borderRadius: 4, display: 'inline-block' }}>In Multi-tier Review</span>
          </div>
        );
      case 'approved':
        return (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={async () => {
              try {
                const { error } = await supabase.rpc('publish_event', { p_event_id: ev.event_id });
                if (error) throw error;
                alert('Event Published! Registrations are now open.');
                fetchEvents();
              } catch(err: any) {
                alert(err.message || 'Error publishing event (Are tickets configured?)');
              }
            }} style={{ flex: 1, padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: 'none', background: 'var(--pres-green)', color: 'white' }}>Publish Event</button>
          </div>
        );
      case 'published':
      case 'upcoming':
        return (
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <button style={{ flex: 1, padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--pres-ink)', background: 'var(--pres-paper)', color: 'var(--pres-ink)' }}>Manage Live Ops</button>
            <button onClick={async () => {
              await supabase.from('events').update({ status: 'live' }).eq('event_id', ev.event_id);
              fetchEvents();
            }} style={{ flex: 1, padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--pres-red)', background: 'var(--pres-red)', color: 'white' }}>Start Live Event</button>
          </div>
        );
      case 'live':
        return (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => completeEvent(ev.event_id)} style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--pres-green)', background: 'var(--pres-green-soft)', color: 'var(--pres-green)', width: '100%' }}>Mark Completed</button>
          </div>
        );
      case 'completed':
      case 'settled':
        return (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 8px', background: 'var(--pres-card)', border: '1px solid var(--pres-rule)', borderRadius: 4, display: 'inline-block' }}>{ev.status.toUpperCase()}</span>
          </div>
        );
      default:
        return null;
    }
  };

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
            const colEvents = events.filter(e => {
              if (col.id === 'completed') return e.status === 'completed' || e.status === 'settled';
              return e.status === col.id;
            });
            return (
              <div key={col.id} style={{ flex: '0 0 250px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 12, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, marginBottom: 10, padding: '0 2px' }}>
                  {col.title} <span style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule-strong)', borderRadius: 10, padding: '1px 7px', fontSize: 10.5, color: 'var(--pres-ink-soft)' }}>{colEvents.length}</span>
                </div>
                
                <div style={{ flex: 1, minHeight: 50 }}>
                  {colEvents.map(ev => (
                    <div key={ev.event_id} style={{ background: 'var(--pres-card)', border: '1px solid var(--pres-rule)', borderRadius: 7, padding: '11px 12px', marginBottom: 9, fontSize: 12.5, boxShadow: 'var(--pres-shadow-card)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{ev.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--pres-ink-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconCalendarEvent size={12}/> {ev.event_date && !isNaN(new Date(ev.event_date).getTime()) ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Date TBD'}
                      </div>
                      {renderActions(ev)}
                    </div>
                  ))}
                </div>
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
            if (ev.status === 'under_review') statusClass = styles.stPending;
            if (ev.status === 'draft') statusClass = styles.stDraft;
            if (ev.status === 'changes_requested') statusClass = styles.stDraft;

            return (
              <div key={ev.event_id} className={`${styles.eventCard} ${statusClass}`}>
                <span className={`${styles.stamp} ${statusClass}`}>{ev.status}</span>
                <div className={styles.eventTitle}>{ev.title}</div>
                <div className={styles.eventMeta}>
                  <span><IconCalendarEvent size={14}/> {ev.event_date && !isNaN(new Date(ev.event_date).getTime()) ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Date TBD'}</span>
                  <span><IconMapPin size={14}/> {ev.venue_name || 'TBD'}</span>
                  <span><IconUsers size={14}/> {ev.expected_count || 0}</span>
                </div>
                {renderActions(ev)}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default EventsDesk;
