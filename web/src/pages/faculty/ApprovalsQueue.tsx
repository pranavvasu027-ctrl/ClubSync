import React, { useEffect, useState, useCallback } from 'react';
import styles from './FacultyDashboard.module.css';
import { 
  IconCheck, 
  IconX, 
  IconFileText, 
  IconAlertTriangle, 
  IconCalendarEvent, 
  IconMapPin, 
  IconUsers,
  IconArrowRight
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { eventStore } from '../../services/eventStore';
import type { EventRecord } from '../../services/eventStore';
import SanctionNoteModal from '../../components/SanctionNoteModal';

const ApprovalsQueue: React.FC = () => {
  const { profile, supervisedClubs } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [pendingList, setPendingList] = useState<EventRecord[]>([]);
  const [approvedList, setApprovedList] = useState<EventRecord[]>([]);
  const [rejectedList, setRejectedList] = useState<EventRecord[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [modalEvent, setModalEvent] = useState<EventRecord | null>(null);

  const [remarks, setRemarks] = useState('');
  const [actionMode, setActionMode] = useState<'none' | 'reject' | 'changes'>('none');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPlatformAdmin = ['owner', 'super_admin', 'platform_admin', 'admin', 'dean_admin'].some(r => (profile?.user_type || '').toLowerCase().includes(r));

  const filterByPurview = useCallback((items: EventRecord[]) => {
    const userType = (profile?.user_type || '').toLowerCase();
    if (isPlatformAdmin || userType.includes('faculty') || userType.includes('mentor') || !supervisedClubs || supervisedClubs.length === 0) {
      return items;
    }
    return items.filter(e => supervisedClubs.includes(e.club_id));
  }, [isPlatformAdmin, profile, supervisedClubs]);

  const loadData = useCallback(() => {
    const all = eventStore.getAllEvents();
    
    const pending = filterByPurview(all.filter(e => e.status === 'under_review' || (e.pending_version && e.pending_version.status === 'under_review')));
    const approved = filterByPurview(all.filter(e => e.status === 'approved' || e.status === 'published' || e.status === 'live' || e.status === 'completed'));
    const rejected = filterByPurview(all.filter(e => e.status === 'changes_requested' || e.status === 'rejected'));

    setPendingList(pending);
    setApprovedList(approved);
    setRejectedList(rejected);

    // Auto-select first pending item if none selected
    if (activeTab === 'pending' && pending.length > 0 && !selectedEvent) {
      setSelectedEvent(pending[0]);
    }
  }, [activeTab, selectedEvent, filterByPurview]);

  useEffect(() => {
    loadData();
    eventStore.syncWithSupabase().then(() => loadData());

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('clubsync:event_updated', handleUpdate);
    return () => {
      window.removeEventListener('clubsync:event_updated', handleUpdate);
    };
  }, [loadData]);

  const handleSelectEvent = (event: EventRecord) => {
    setSelectedEvent(event);
    setActionMode('none');
    setError('');
    setSuccess('');
    setRemarks('');
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;

    // Check if event date has passed
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedEvent.event_date < todayStr) {
      setError(`Cannot sanction an event with a past date (${selectedEvent.event_date}). Please use 'Request Changes' to ask the club to reschedule.`);
      return;
    }

    // Check venue clash before approving
    const venueClash = eventStore.checkVenueConflict(selectedEvent.venue_name, selectedEvent.event_date, selectedEvent.event_id);
    if (venueClash.hasConflict) {
      setError(`Cannot sanction: ${venueClash.message}`);
      return;
    }

    try {
      const facultyName = profile?.name || 'Dr. S. K. Kulkarni';
      const facultyRemarks = remarks.trim() || 'Approved by Faculty Mentor. Official Sanction Granted.';
      
      await eventStore.approveEvent(selectedEvent.event_id, facultyRemarks, facultyName);
      setSuccess(`Proposal "${selectedEvent.title}" successfully sanctioned & approved!`);
      setSelectedEvent(null);
      setRemarks('');
      setActionMode('none');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error approving event');
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    if (actionMode !== 'reject') {
      setActionMode('reject');
      return;
    }
    
    if (!remarks.trim()) {
      setError('Please provide a reason for rejecting the event proposal.');
      return;
    }

    try {
      await eventStore.rejectEvent(selectedEvent.event_id, remarks.trim());
      setSuccess(`Event proposal "${selectedEvent.title}" rejected.`);
      setSelectedEvent(null);
      setActionMode('none');
      setRemarks('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error rejecting event');
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedEvent) return;
    if (actionMode !== 'changes') {
      setActionMode('changes');
      return;
    }
    
    if (!remarks.trim()) {
      setError('Remarks are mandatory when requesting revisions from the President.');
      return;
    }

    try {
      await eventStore.requestChanges(selectedEvent.event_id, remarks.trim());
      setSuccess(`Revision requested for "${selectedEvent.title}". Returned to President.`);
      setSelectedEvent(null);
      setActionMode('none');
      setRemarks('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error requesting changes');
    }
  };

  const currentList = activeTab === 'pending' ? pendingList : activeTab === 'approved' ? approvedList : rejectedList;

  return (
    <>
      {modalEvent && (
        <SanctionNoteModal 
          event={modalEvent} 
          onClose={() => setModalEvent(null)} 
        />
      )}

      {/* Header */}
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Faculty Mentor Purview</div>
          <h1>Approvals & Sanctions Queue</h1>
          <p>Official institutional review of event proposals submitted by Club Presidents.</p>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--green-soft)', border: '1px solid #86efac', color: 'var(--green)', padding: '12px 16px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
          <IconCheck size={18} color="var(--green)" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--red-soft)', border: '1px solid #fca5a5', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
          <IconAlertTriangle size={18} color="var(--red)" />
          <span>{error}</span>
        </div>
      )}

      {/* Modern Navigation Tabs (Student UI pill style) */}
      <div style={{ display: 'flex', background: '#e9f0fb', borderRadius: 12, padding: 4, gap: 4, marginBottom: 20, width: 'fit-content' }}>
        <button
          onClick={() => { setActiveTab('pending'); setSelectedEvent(pendingList[0] || null); }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 9,
            background: activeTab === 'pending' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'pending' ? 'var(--blue)' : 'var(--muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'pending' ? 'var(--shadow)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Pending Review</span>
          <span style={{ background: 'var(--amber-soft)', color: 'var(--amber)', fontSize: 11, padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>
            {pendingList.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('approved'); setSelectedEvent(approvedList[0] || null); }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 9,
            background: activeTab === 'approved' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'approved' ? 'var(--blue)' : 'var(--muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'approved' ? 'var(--shadow)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Sanctioned History</span>
          <span style={{ background: 'var(--green-soft)', color: 'var(--green)', fontSize: 11, padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>
            {approvedList.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('rejected'); setSelectedEvent(rejectedList[0] || null); }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: 9,
            background: activeTab === 'rejected' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'rejected' ? 'var(--blue)' : 'var(--muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'rejected' ? 'var(--shadow)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Returned / Rejected</span>
          <span style={{ background: 'var(--red-soft)', color: 'var(--red)', fontSize: 11, padding: '2px 7px', borderRadius: 999, fontWeight: 700 }}>
            {rejectedList.length}
          </span>
        </button>
      </div>

      {/* Main 2-Pane Review Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* Left List Pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentList.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
              No proposals in this queue.
            </div>
          ) : (
            currentList.map(ev => {
              const isSelected = selectedEvent?.event_id === ev.event_id;
              return (
                <div 
                  key={ev.event_id}
                  onClick={() => handleSelectEvent(ev)}
                  style={{
                    background: isSelected ? '#f0f6ff' : 'var(--surface)',
                    border: isSelected ? '2px solid var(--blue)' : '1px solid var(--line)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 14px rgba(11,99,246,0.1)' : 'var(--shadow)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)' }}>
                      {ev.club_name || ev.club_id}
                    </span>
                    <span style={{ 
                      fontSize: 10.5, 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: 999,
                      background: ev.status === 'under_review' ? 'var(--amber-soft)' : ev.status === 'approved' || ev.status === 'published' ? 'var(--green-soft)' : 'var(--red-soft)',
                      color: ev.status === 'under_review' ? 'var(--amber)' : ev.status === 'approved' || ev.status === 'published' ? 'var(--green)' : 'var(--red)'
                    }}>
                      {ev.status === 'under_review' ? 'PENDING' : ev.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.3 }}>
                    {ev.title}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconCalendarEvent size={13} /> {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                    <span>·</span>
                    <IconMapPin size={13} /> {ev.venue_name || 'Campus'}
                  </div>

                  <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px dashed var(--line)', paddingTop: 6 }}>
                    <span>Capacity: {ev.expected_count} students</span>
                    {ev.budget && <span>₹{ev.budget.expenditure?.toLocaleString()}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail & Decision Pane */}
        <div>
          {selectedEvent ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>
                    Proposal Document & Official Sanction File
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                    {selectedEvent.title}
                  </h2>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                    Submitted by: <strong>{selectedEvent.created_by_name || 'Club President'}</strong> ({selectedEvent.club_name || selectedEvent.club_id})
                  </div>
                </div>

                <button
                  onClick={() => setModalEvent(selectedEvent)}
                  className={`${styles.btn} ${styles.btnGhost}`}
                  title="Inspect Official Formatted Collegiate Document"
                >
                  <IconFileText size={16} color="var(--blue)" /> Inspect Sanction Note
                </button>
              </div>

              {/* Event Parameters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Type & Scope</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
                    {selectedEvent.event_type} · {selectedEvent.scope || 'Intra-Collegiate'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Date & Venue</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
                    {selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'} ({selectedEvent.venue_name || 'Sharad Arena'})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Expected Attendance</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>
                    {selectedEvent.expected_count} Delegates / Students
                  </div>
                </div>
              </div>

              {/* Description & NAAC Objectives */}
              <div style={{ marginBottom: 18 }}>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--ink)', marginBottom: 6, fontWeight: 700 }}>
                  Event Overview & Scope
                </h4>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {selectedEvent.description || 'No description provided.'}
                </p>

                {selectedEvent.objectives && (
                  <div style={{ background: 'var(--green-soft)', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: 9, marginBottom: 12 }}>
                    <strong style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--green)', display: 'block', marginBottom: 3 }}>
                      NAAC Objective / Academic Outcome:
                    </strong>
                    <span style={{ fontSize: 13, color: '#14532d' }}>{selectedEvent.objectives}</span>
                  </div>
                )}
              </div>

              {/* Tabulated Budget Ledger */}
              {selectedEvent.budget && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--ink)', margin: 0, fontWeight: 700 }}>
                      Financial Estimates & Fund Source
                    </h4>
                    {selectedEvent.budget.expenditure > 50000 && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid #fcd34d' }}>
                        🏛️ High-Value Sanction (&gt; ₹50,000 · Dean Co-Signatory Rule)
                      </span>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Head</th>
                        <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600 }}>Source / Category</th>
                        <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600, textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '9px 12px' }}>Estimated Income</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>Delegate Fee / Sponsorships</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600 }}>₹{selectedEvent.budget.income?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 12px' }}>Sanction Expenditure</td>
                        <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{selectedEvent.budget.source_of_funds || 'Club Fund'}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--red)' }}>₹{selectedEvent.budget.expenditure?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Faculty Decision Panel */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
                  Faculty Advisor Decision & Endorsement
                </h3>

                {selectedEvent.status === 'under_review' ? (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>
                        Faculty Remarks / Sanction Notes (Mandatory for Revisions/Rejection):
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Approved. Budget allocation sanctioned from Club Operating Fund. Ensure Sharad Arena reservation."
                        rows={3}
                        className={styles.inputField}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleApprove}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ background: 'var(--green)' }}
                      >
                        <IconCheck size={16} /> Grant Sanction & Approve
                      </button>

                      <button
                        onClick={handleRequestChanges}
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ border: '1px solid #f59e0b', color: '#92400e', background: 'var(--amber-soft)' }}
                      >
                        <IconAlertTriangle size={16} /> Request Revisions
                      </button>

                      <button
                        onClick={handleReject}
                        className={`${styles.btn} ${styles.btnGhost}`}
                        style={{ border: '1px solid #f87171', color: 'var(--red)', background: 'var(--red-soft)' }}
                      >
                        <IconX size={16} /> Reject Proposal
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                      Status: {selectedEvent.status === 'approved' ? '✅ Sanctioned & Approved by Faculty Advisor' : selectedEvent.status === 'published' ? '🚀 Sanctioned & Published by President' : selectedEvent.status.toUpperCase()}
                    </div>
                    {selectedEvent.faculty_remarks && (
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
                        <strong>Recorded Remarks:</strong> "{selectedEvent.faculty_remarks}"
                      </div>
                    )}
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8 }}>
                      Sign-off: {selectedEvent.faculty_name || 'Dr. S. K. Kulkarni'} · {selectedEvent.decision_timestamp ? new Date(selectedEvent.decision_timestamp).toLocaleString() : 'Official Audit Trail'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              Select a proposal from the left pane to view sanction details and grant approval.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ApprovalsQueue;
