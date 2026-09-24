import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconCheck, IconX, IconEye, IconFileText, IconAlertTriangle, IconChecklist } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';

const ApprovalsQueue: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [pendingList, setPendingList] = useState<any[]>([]);
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [rejectedList, setRejectedList] = useState<any[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Details for expanded view
  const [eventBudgets, setEventBudgets] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [submittedBy, setSubmittedBy] = useState<string>('Unknown');
  const [versionDetails, setVersionDetails] = useState<any>(null); // For history tabs

  const [remarks, setRemarks] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    if (activeTab === 'approved') fetchApproved();
    if (activeTab === 'rejected') fetchRejected();
    setSelectedEvent(null);
    setRejectMode(false);
    setError('');
    setSuccess('');
  }, [activeTab]);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select('*, events(*)')
      .eq('decision', 'PENDING')
      .eq('approver_level', 'FACULTY_MENTOR');
    if (data) setPendingList(data);
  };

  const fetchApproved = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select('*, events(*)')
      .eq('decision', 'APPROVED')
      .eq('approver_level', 'FACULTY_MENTOR')
      .order('decision_timestamp', { ascending: false });
    if (data) setApprovedList(data);
  };

  const fetchRejected = async () => {
    const { data } = await supabase
      .from('event_approvals')
      .select('*, events(*)')
      .eq('decision', 'REJECTED')
      .eq('approver_level', 'FACULTY_MENTOR')
      .order('decision_timestamp', { ascending: false });
    if (data) setRejectedList(data);
  };

  const fetchFullDetails = async (eventData: any) => {
    // budgets
    const { data: budgets } = await supabase.from('event_budgets').select('*').eq('event_id', eventData.event_id);
    if (budgets) setEventBudgets(budgets);

    // submitter
    const { data: creator } = await supabase.from('users').select('name').eq('user_id', eventData.created_by).single();
    if (creator) setSubmittedBy(creator.name);
    else setSubmittedBy('Unknown');

    // audit log
    const { data: audit } = await supabase.from('event_audit_log').select('*').eq('event_id', eventData.event_id).order('created_at', { ascending: true });
    if (audit) setAuditLog(audit);
  };

  const handleSelectEvent = async (app: any) => {
    setSelectedEvent(app);
    setRejectMode(false);
    setError('');
    setSuccess('');
    setRemarks('');
    setVersionDetails(null);
    await fetchFullDetails(app.events);
  };

  const handleViewVersion = async (eventId: string, versionNumber: number) => {
    const { data } = await supabase.from('event_versions').select('*').eq('event_id', eventId).eq('version_number', versionNumber).single();
    if (data) setVersionDetails(data);
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase.rpc('process_event_approval', {
        p_event_id: selectedEvent.events.event_id,
        p_level: 'FACULTY_MENTOR',
        p_decision: 'APPROVED',
        p_remarks: remarks || 'Approved by Faculty Mentor'
      });
      if (error) throw error;
      
      setSuccess('Event successfully approved.');
      setSelectedEvent(null);
      fetchPending();
    } catch (err: any) {
      setError(err.message || 'Error approving event');
    }
  };

  const handleReject = async () => {
    if (!rejectMode) {
      setRejectMode(true);
      return;
    }
    
    if (!remarks.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      const { error } = await supabase.rpc('process_event_approval', {
        p_event_id: selectedEvent.events.event_id,
        p_level: 'FACULTY_MENTOR',
        p_decision: 'REJECTED',
        p_remarks: remarks
      });
      if (error) throw error;

      setSuccess('Event successfully rejected.');
      setSelectedEvent(null);
      setRejectMode(false);
      setRemarks('');
      fetchPending();
    } catch (err: any) {
      setError(err.message || 'Error rejecting event');
    }
  };

  const renderTabButton = (tab: 'pending'|'approved'|'rejected', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderBottom: activeTab === tab ? '2px solid var(--fac-navy)' : '2px solid transparent',
        background: 'transparent',
        color: activeTab === tab ? 'var(--fac-navy)' : 'var(--fac-ink-soft)',
        fontWeight: activeTab === tab ? 600 : 400,
        cursor: 'pointer',
        fontSize: 14
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Approvals Queue</h1>
          <div className={layoutStyles.sub}>Review and sign off on proposals submitted by the executive committee.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid var(--fac-rule)' }}>
        {renderTabButton('pending', 'Pending')}
        {renderTabButton('approved', 'Approved History')}
        {renderTabButton('rejected', 'Rejected History')}
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className={styles.panel} style={{ flex: 1 }}>
          <div className={styles.panelTitle}>
            {activeTab === 'pending' && 'Pending Events'}
            {activeTab === 'approved' && 'Approved Events'}
            {activeTab === 'rejected' && 'Rejected Events'}
          </div>
          
          {activeTab === 'pending' && pendingList.length === 0 && <div style={{ color: 'var(--fac-ink-soft)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No events pending approval.</div>}
          {activeTab === 'approved' && approvedList.length === 0 && <div style={{ color: 'var(--fac-ink-soft)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No approved history.</div>}
          {activeTab === 'rejected' && rejectedList.length === 0 && <div style={{ color: 'var(--fac-ink-soft)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No rejected history.</div>}

          {((activeTab === 'pending' && pendingList.length > 0) || 
            (activeTab === 'approved' && approvedList.length > 0) || 
            (activeTab === 'rejected' && rejectedList.length > 0)) && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-rule)' }}>Proposal</th>
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-rule)' }}>Type</th>
                  {activeTab !== 'pending' && <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-rule)' }}>Timestamp</th>}
                  <th style={{ textAlign: 'left', fontWeight: 600, color: 'var(--fac-ink-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 10px', borderBottom: '1px solid var(--fac-rule)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'pending' ? pendingList : activeTab === 'approved' ? approvedList : rejectedList).map(app => {
                  const ev = app.events;
                  if (!ev) return null;
                  return (
                    <tr key={app.approval_id} style={{ borderBottom: '1px solid var(--fac-rule)', background: selectedEvent?.approval_id === app.approval_id ? 'var(--fac-parchment-deep)' : 'transparent' }}>
                      <td style={{ padding: '11px 10px', fontWeight: 600, color: 'var(--fac-navy)' }}>
                        {ev.title}
                        <div style={{ fontSize: 11, color: 'var(--fac-ink-soft)', fontWeight: 400 }}>{ev.club_name} | {new Date(ev.event_date).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '11px 10px', color: 'var(--fac-ink)' }}>{ev.event_type}</td>
                      {activeTab !== 'pending' && <td style={{ padding: '11px 10px', color: 'var(--fac-ink-soft)' }}>{new Date(app.decision_timestamp).toLocaleDateString()}</td>}
                      <td style={{ padding: '11px 10px' }}>
                        <button onClick={() => handleSelectEvent(app)} className={styles.btn} style={{ background: 'var(--fac-card)', border: '1px solid var(--fac-rule)', color: 'var(--fac-ink)' }}>
                          <IconEye size={14}/> {activeTab === 'pending' ? 'View Full Proposal' : 'Details'}
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
          <div className={styles.panel} style={{ flex: 1.2 }}>
            <div className={styles.panelTitle}>Proposal Details</div>
            
            {success && <div style={{ padding: 12, background: 'var(--fac-green-soft)', color: 'var(--fac-green)', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>{success}</div>}
            {error && <div style={{ padding: 12, background: 'var(--fac-red-soft)', color: 'var(--fac-red)', borderRadius: 6, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>{error}</div>}

            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--fac-ink)' }}>
              <div>
                <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Title</strong>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fac-navy)' }}>{selectedEvent.events.title}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Club</strong><div>{selectedEvent.events.club_name}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Type</strong><div>{selectedEvent.events.event_type}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Scope</strong><div>{selectedEvent.events.scope}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Target Audience</strong><div>{selectedEvent.events.target_audience}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Expected Participants</strong><div>{selectedEvent.events.expected_count}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Venue</strong><div>{selectedEvent.events.venue_name}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Date</strong><div>{new Date(selectedEvent.events.event_date).toLocaleDateString()}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Time</strong><div>{selectedEvent.events.start_time} - {selectedEvent.events.end_time}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Submitted By</strong><div>{submittedBy}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Submission Date</strong><div>{new Date(selectedEvent.events.created_at).toLocaleDateString()}</div></div>
                <div><strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Compliance Status</strong><div>{selectedEvent.events.compliance_verified ? 'Verified' : 'Pending'}</div></div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Description</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{selectedEvent.events.description || 'N/A'}</div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Objectives</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{selectedEvent.events.objectives || 'N/A'}</div>
              </div>

              <div>
                <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Expected Outcomes</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{selectedEvent.events.expected_outcomes || 'N/A'}</div>
              </div>

              {selectedEvent.events.guest_details && (
                 <div>
                   <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Guest Details</strong>
                   <pre style={{ whiteSpace: 'pre-wrap', marginTop: 4, fontFamily: 'inherit', fontSize: 13 }}>{typeof selectedEvent.events.guest_details === 'string' ? selectedEvent.events.guest_details : JSON.stringify(selectedEvent.events.guest_details, null, 2)}</pre>
                 </div>
              )}

              {selectedEvent.events.resource_requirements && (
                 <div>
                   <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Resource Requirements</strong>
                   <pre style={{ whiteSpace: 'pre-wrap', marginTop: 4, fontFamily: 'inherit', fontSize: 13 }}>{typeof selectedEvent.events.resource_requirements === 'string' ? selectedEvent.events.resource_requirements : JSON.stringify(selectedEvent.events.resource_requirements, null, 2)}</pre>
                 </div>
              )}

              {eventBudgets.length > 0 && (
                <div>
                   <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase' }}>Budget Items</strong>
                   <ul style={{ margin: 0, paddingLeft: 20 }}>
                     {eventBudgets.map(b => (
                       <li key={b.budget_id}>{b.category}: {b.description} - ₹{b.amount} (Max: ₹{b.max_approved_amount})</li>
                     ))}
                   </ul>
                </div>
              )}

              {/* Audit Log */}
              {auditLog.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--fac-rule)' }}>
                  <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Audit Trail</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {auditLog.map(log => (
                      <div key={log.log_id} style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        <div style={{ color: 'var(--fac-ink-soft)', width: 120 }}>{new Date(log.created_at).toLocaleString()}</div>
                        <div>
                           <strong>{log.action}</strong> by {log.performer_role}
                           {log.reason && <div style={{ color: 'var(--fac-ink-soft)' }}>Reason: {log.reason}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Pending */}
            {activeTab === 'pending' && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--fac-rule)' }}>
                {(rejectMode || remarks) && (
                  <textarea 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks (Required for rejection, optional for approval)"
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--fac-parchment-deep)', border: '1px solid var(--fac-rule)', borderRadius: 6, color: 'var(--fac-ink)', fontSize: 13, marginBottom: 12, fontFamily: 'inherit' }}
                  />
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {!rejectMode && (
                    <button onClick={handleApprove} className={styles.btn} style={{ flex: 1, background: 'var(--fac-green-soft)', color: 'var(--fac-green)', justifyContent: 'center' }}>
                      <IconCheck size={16}/> Approve Proposal
                    </button>
                  )}
                  <button onClick={handleReject} className={styles.btn} style={{ flex: 1, background: 'var(--fac-red-soft)', color: 'var(--fac-red)', justifyContent: 'center' }}>
                    <IconX size={16}/> {rejectMode ? 'Confirm Rejection' : 'Reject Proposal'}
                  </button>
                  {rejectMode && (
                    <button onClick={() => setRejectMode(false)} className={styles.btn} style={{ background: 'var(--fac-card)', border: '1px solid var(--fac-rule)', color: 'var(--fac-ink)', justifyContent: 'center' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions for Approved/Rejected History */}
            {activeTab !== 'pending' && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--fac-rule)' }}>
                <strong style={{ color: 'var(--fac-ink-faint)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{activeTab === 'approved' ? 'Approval' : 'Rejection'} Details</strong>
                <div style={{ fontSize: 13, color: 'var(--fac-ink)' }}>
                  <div><strong>Decision Date:</strong> {new Date(selectedEvent.decision_timestamp).toLocaleString()}</div>
                  <div><strong>Remarks:</strong> {selectedEvent.remarks || 'None'}</div>
                  <div><strong>Current Event Status:</strong> {selectedEvent.events.status}</div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button onClick={() => handleViewVersion(selectedEvent.events.event_id, selectedEvent.events.current_version || 1)} className={styles.btn} style={{ background: 'var(--fac-card)', border: '1px solid var(--fac-rule)', color: 'var(--fac-ink)' }}>
                    <IconFileText size={16} /> View {activeTab === 'approved' ? 'Approved' : 'Rejected'} Version
                  </button>
                </div>

                {versionDetails && (
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--fac-parchment-deep)', borderRadius: 6, fontSize: 12 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Version {versionDetails.version_number} Content:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                      Title: {versionDetails.title}{'\n'}
                      Description: {versionDetails.description}{'\n'}
                      Type: {versionDetails.event_type}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ApprovalsQueue;
