import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './PresidentDashboard.module.css';
import { 
  IconCalendarEvent, 
  IconMapPin, 
  IconUsers, 
  IconLayoutGrid, 
  IconLayoutKanban, 
  IconPlus, 
  IconFileText, 
  IconCheck,
  IconQrcode,
  IconReceipt2
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { eventStore } from '../../services/eventStore';
import type { EventRecord } from '../../services/eventStore';
import SanctionNoteModal from '../../components/SanctionNoteModal';
import GateScannerModal from '../../components/GateScannerModal';
import SettlementModal from '../../components/SettlementModal';

const EventsDesk: React.FC = () => {
  const { club } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [view, setView] = useState<'cards' | 'kanban'>('kanban');
  const [selectedNoteEvent, setSelectedNoteEvent] = useState<EventRecord | null>(null);
  const [scannerEvent, setScannerEvent] = useState<EventRecord | null>(null);
  const [settlementEvent, setSettlementEvent] = useState<EventRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadEvents = () => {
    const list = eventStore.getAllEvents();
    setEvents(list);
  };

  useEffect(() => {
    loadEvents();
    eventStore.syncWithSupabase().then(() => loadEvents());

    const handleUpdate = () => {
      loadEvents();
    };

    window.addEventListener('clubsync:event_updated', handleUpdate);
    return () => {
      window.removeEventListener('clubsync:event_updated', handleUpdate);
    };
  }, [club]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePublish = async (eventId: string, title: string) => {
    const published = await eventStore.publishEvent(eventId);
    if (published) {
      showToast(`🚀 "${title}" is now PUBLISHED and live on the Student Portal!`);
      loadEvents();
    } else {
      showToast(`⚠️ Cannot publish: Event must be faculty-sanctioned and date must not be in the past.`);
    }
  };

  const submitForApproval = async (eventId: string) => {
    await eventStore.updateEvent(eventId, {}, true);
    showToast('Event submitted for Faculty Review & Sanction!');
    loadEvents();
  };

  const columns = [
    { id: 'draft', title: 'Draft' },
    { id: 'under_review', title: 'Faculty Review Queue' },
    { id: 'changes_requested', title: 'Changes Requested' },
    { id: 'approved', title: 'Approved (Ready to Publish)' },
    { id: 'published', title: 'Published / Live' },
    { id: 'completed', title: 'Completed / Past' },
  ];

  const renderActions = (ev: EventRecord) => {
    return (
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Sanction Note Document Action */}
        <button
          onClick={() => setSelectedNoteEvent(ev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--soft)',
            color: 'var(--ink)',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          title="Inspect Official Collegiate Sanction Note"
        >
          <IconFileText size={14} color="var(--blue)" /> View Sanction Note
        </button>

        {ev.status === 'draft' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={() => navigate(`/president/new-event?edit=${ev.event_id}`)} 
              style={{ flex: 1, padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
            >
              Edit
            </button>
            <button 
              onClick={() => submitForApproval(ev.event_id)} 
              style={{ flex: 2, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: 'none', background: 'var(--blue)', color: 'white' }}
            >
              Submit for Sanction
            </button>
          </div>
        )}

        {ev.status === 'under_review' && (
          <div style={{ background: 'var(--amber-soft)', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, color: '#92400e' }}>
            ⏳ <strong>Pending Faculty Sanction</strong>
            <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 2 }}>Faculty Advisor reviewing budget & objectives</div>
          </div>
        )}

        {ev.status === 'changes_requested' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11.5, background: 'var(--amber-soft)', color: '#854d0e', padding: '7px 10px', borderRadius: 8, border: '1px solid #fde047' }}>
              <strong>Faculty Remarks:</strong> {ev.faculty_remarks || 'Revisions requested by faculty mentor.'}
            </div>
            <button 
              onClick={() => navigate(`/president/new-event?edit=${ev.event_id}`)} 
              style={{ padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, border: '1px solid #f59e0b', background: '#fef3c7', color: '#92400e' }}
            >
              ✏️ Edit & Resubmit Proposal
            </button>
          </div>
        )}

        {ev.status === 'approved' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ background: 'var(--green-soft)', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, color: 'var(--green)' }}>
              ✅ <strong>Sanction Approved!</strong>
              {ev.faculty_remarks && <div style={{ fontSize: 10.5, marginTop: 2 }}>"{ev.faculty_remarks}"</div>}
            </div>
            <button 
              onClick={() => handlePublish(ev.event_id, ev.title)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px', 
                fontSize: 12.5, 
                fontWeight: 600, 
                cursor: 'pointer', 
                borderRadius: 8, 
                border: 'none', 
                background: 'var(--blue)', 
                color: 'white',
                boxShadow: '0 2px 6px rgba(11, 99, 246, 0.25)'
              }}
            >
              🚀 Publish Event to Students
            </button>
          </div>
        )}

        {(ev.status === 'published' || ev.status === 'live') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11.5, padding: '6px 10px', background: 'var(--green-soft)', color: 'var(--green)', border: '1px solid #bbf7d0', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={14} color="var(--green)" /> Live on Student Portal
            </div>
            {ev.pending_version && (
              <div style={{ fontSize: 10.5, padding: '4px 8px', background: 'var(--amber-soft)', color: '#b45309', border: '1px solid #fde68a', borderRadius: 6 }}>
                ℹ️ Revision Under Review
              </div>
            )}
            <button
              onClick={() => setScannerEvent(ev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 10px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                background: 'var(--ink)',
                color: '#fff',
                cursor: 'pointer'
              }}
              title="Launch Live Door QR Gate Scanner"
            >
              <IconQrcode size={14} /> ⚡ Live Gate Scanner
            </button>
            <button
              onClick={() => setSettlementEvent(ev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
              title="Post-Event Bill Settlement & Audit"
            >
              <IconReceipt2 size={14} /> Settle Financial Expenses
            </button>
          </div>
        )}

        {ev.status === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, padding: '5px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid var(--line)', borderRadius: 8, display: 'inline-block', fontWeight: 600 }}>
              ✅ COMPLETED & SETTLED
            </span>
            {ev.settlement && (
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                Audited: ₹{ev.settlement.actual_expenditure.toLocaleString()} ({ev.settlement.invoices_count} bills)
              </div>
            )}
          </div>
        )}

        {ev.status === 'rejected' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11.5, padding: '5px 10px', background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid #fecaca', borderRadius: 8, display: 'inline-block', fontWeight: 600 }}>
              Proposal Rejected
            </span>
            {ev.faculty_remarks && (
              <div style={{ fontSize: 11, color: 'var(--red)' }}>
                <strong>Reason:</strong> {ev.faculty_remarks}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'var(--ink)',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(10,20,49,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span>{notification}</span>
        </div>
      )}

      {/* Sanction Note Document Modal */}
      {selectedNoteEvent && (
        <SanctionNoteModal 
          event={selectedNoteEvent} 
          onClose={() => setSelectedNoteEvent(null)} 
        />
      )}

      {/* Live Gate Scanner Modal */}
      {scannerEvent && (
        <GateScannerModal
          event={scannerEvent}
          onClose={() => setScannerEvent(null)}
        />
      )}

      {/* Financial Settlement Modal */}
      {settlementEvent && (
        <SettlementModal
          event={settlementEvent}
          onClose={() => setSettlementEvent(null)}
          onSettled={() => {
            showToast('✅ Financial settlement audited and event marked completed!');
            loadEvents();
          }}
        />
      )}

      {/* Hero Bar */}
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>President Event Desk</div>
          <h1>Events Cycle Desk</h1>
          <p>Every sanction note, faculty sign-off, and student release in one place.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: '#e9f0fb', borderRadius: 10, padding: 3, gap: 2 }}>
            <button 
              onClick={() => setView('cards')}
              style={{ 
                border: 'none', 
                background: view === 'cards' ? 'var(--surface)' : 'transparent', 
                padding: '6px 12px', 
                borderRadius: 8, 
                fontSize: 12.5, 
                fontWeight: 600, 
                color: view === 'cards' ? 'var(--blue)' : 'var(--muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 5,
                boxShadow: view === 'cards' ? 'var(--shadow)' : 'none'
              }}
            >
              <IconLayoutGrid size={15}/> Cards
            </button>
            <button 
              onClick={() => setView('kanban')} 
              style={{ 
                border: 'none', 
                background: view === 'kanban' ? 'var(--surface)' : 'transparent', 
                padding: '6px 12px', 
                borderRadius: 8, 
                fontSize: 12.5, 
                fontWeight: 600, 
                color: view === 'kanban' ? 'var(--blue)' : 'var(--muted)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 5,
                boxShadow: view === 'kanban' ? 'var(--shadow)' : 'none'
              }}
            >
              <IconLayoutKanban size={15}/> Board
            </button>
          </div>

          <button 
            onClick={() => navigate('/president/new-event')} 
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <IconPlus size={16}/> New Proposal
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {view === 'kanban' && (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {columns.map(col => {
            const colEvents = events.filter(e => {
              if (col.id === 'completed') return e.status === 'completed';
              return e.status === col.id;
            });
            return (
              <div 
                key={col.id} 
                style={{ 
                  flex: '0 0 280px', 
                  background: '#f8fafc', 
                  border: '1px solid var(--line)', 
                  borderRadius: 14, 
                  padding: 14, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  minHeight: 480 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, marginBottom: 12, padding: '0 2px', color: 'var(--ink)' }}>
                  {col.title} 
                  <span style={{ background: 'var(--blue-soft)', color: 'var(--blue)', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {colEvents.length}
                  </span>
                </div>
                
                <div style={{ flex: 1, minHeight: 50 }}>
                  {colEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: 12 }}>
                      No events in this stage
                    </div>
                  ) : (
                    colEvents.map(ev => (
                      <div 
                        key={ev.event_id} 
                        style={{ 
                          background: 'var(--surface)', 
                          border: '1px solid var(--line)', 
                          borderRadius: 12, 
                          padding: 14, 
                          marginBottom: 10, 
                          boxShadow: 'var(--shadow)' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5, lineHeight: 1.3 }}>{ev.title}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: 'var(--soft)', color: 'var(--muted)', fontWeight: 600 }}>
                            v{ev.current_version || 1}.0
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <IconCalendarEvent size={13}/> {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD'} · {ev.venue_name || 'Campus'}
                        </div>
                        {ev.budget && ev.budget.expenditure > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                            Budget: ₹{ev.budget.expenditure.toLocaleString()} ({ev.budget.source_of_funds || 'Club Fund'})
                          </div>
                        )}
                        {renderActions(ev)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards View */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {events.map(ev => {
            return (
              <div key={ev.event_id} className={styles.eventCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className={`${styles.pillBadge} ${styles[ev.status] || styles.draft}`}>
                    {ev.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>v{ev.current_version || 1}.0</span>
                </div>
                <div className={styles.eventTitle} style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{ev.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.45 }}>
                  {ev.description?.slice(0, 110)}{ev.description?.length > 110 ? '...' : ''}
                </div>
                <div className={styles.eventMeta} style={{ fontSize: 12, marginBottom: 12 }}>
                  <span><IconCalendarEvent size={14}/> {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}</span>
                  <span><IconMapPin size={14}/> {ev.venue_name || 'TBD'}</span>
                  <span><IconUsers size={14}/> {ev.expected_count || 0} Capacity</span>
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
