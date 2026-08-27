import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Loader2, CheckCircle, XCircle, FileText, ChevronRight, MessageSquare } from 'lucide-react';

export default function Recruitments() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    // In production, filter by user's club using an inner join on memberships.
    const { data, error } = await supabase
      .from('applications')
      .select('*, clubs(club_name)')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp || !user) return;
    setProcessing(true);

    // 1. Update application status
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: newStatus, remarks: remarks || selectedApp.remarks })
      .eq('application_id', selectedApp.application_id);

    if (updateError) {
      alert("Error updating application: " + updateError.message);
      setProcessing(false);
      return;
    }

    // 2. Insert interview evaluation audit if remarks were added
    if (remarks && remarks !== selectedApp.remarks) {
      await supabase
        .from('interview_evaluations')
        .insert([{
          application_id: selectedApp.application_id,
          interviewer_id: user.id,
          remarks: remarks
        }]);
    }

    // 3. Send Realtime Notification to the Mobile App User
    let notifTitle = '';
    let notifMessage = '';
    
    if (newStatus === 'SHORTLISTED') {
      notifTitle = 'Application Shortlisted! 🎉';
      notifMessage = `Your application for ${selectedApp.applied_role} at ${selectedApp.clubs?.club_name} has been shortlisted. Check your email for next steps.`;
    } else if (newStatus === 'INTERVIEW_SCHEDULED') {
      notifTitle = 'Interview Scheduled 📅';
      notifMessage = `An interview has been scheduled for your ${selectedApp.applied_role} application at ${selectedApp.clubs?.club_name}.`;
    } else if (newStatus === 'OFFERED') {
      notifTitle = 'Offer Received! 🏆';
      notifMessage = `Congratulations! You've been offered the role of ${selectedApp.applied_role} at ${selectedApp.clubs?.club_name}.`;
    } else if (newStatus === 'REJECTED') {
      notifTitle = 'Application Update';
      notifMessage = `Your application for ${selectedApp.applied_role} at ${selectedApp.clubs?.club_name} was not selected at this time.`;
    }

    if (notifTitle) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: selectedApp.applicant_id,
          type: 'recruitment',
          title: notifTitle,
          message: notifMessage
        }]);
    }

    // Refresh UI
    alert(`Application moved to ${newStatus}`);
    fetchApplications();
    setSelectedApp(null);
    setRemarks('');
    setProcessing(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'APPLIED': return 'badge-tech';
      case 'SHORTLISTED': return 'badge-pending';
      case 'INTERVIEW_SCHEDULED': return 'badge-cult';
      case 'OFFERED': 
      case 'ACCEPTED': return 'badge-approved';
      case 'REJECTED': return 'badge-rejected';
      default: return 'badge-tech';
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" /> Loading CRM...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 120px)' }}>
      {/* LEFT: LIST VIEW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Applicants</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{applications.length} total applications</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search PRN or Name..." 
              style={{ padding: '6px 10px 6px 30px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, width: 200 }}
            />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {applications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <Users size={32} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13 }}>No applications received yet.</p>
            </div>
          ) : (
            applications.map(app => (
              <div 
                key={app.application_id} 
                onClick={() => { setSelectedApp(app); setRemarks(app.remarks || ''); }}
                style={{ 
                  padding: 16, borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selectedApp?.application_id === app.application_id ? '#F8FAFC' : '#fff',
                  borderLeft: selectedApp?.application_id === app.application_id ? '3px solid var(--primary)' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{app.applicant_name}</strong>
                  <span className={`badge ${getStatusBadgeClass(app.status)}`} style={{ fontSize: 10 }}>{app.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{app.applied_role} • {app.clubs?.club_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>PRN: {app.applicant_prn} | CGPA: {app.applicant_cgpa}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: DETAIL & ACTION VIEW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {!selectedApp ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
            <p>Select an application to review details and SOP.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedApp.applicant_name}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedApp.applicant_email} • PRN: {selectedApp.applicant_prn}</p>
                </div>
                <span className={`badge ${getStatusBadgeClass(selectedApp.status)}`}>{selectedApp.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
                <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Role</span> <strong style={{ fontSize: 13 }}>{selectedApp.applied_role}</strong></div>
                <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>CGPA</span> <strong style={{ fontSize: 13 }}>{selectedApp.applicant_cgpa}</strong></div>
                <div><span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Applied</span> <strong style={{ fontSize: 13 }}>{new Date(selectedApp.submitted_at).toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Statement of Purpose</h4>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)', background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid #E2E8F0' }}>
                {selectedApp.sop_statement || "No SOP provided."}
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Interview Remarks (Internal)</h4>
              <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add notes about candidate performance..."
                style={{ width: '100%', height: 80, padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, resize: 'none', marginBottom: 12 }}
              />
            </div>

            <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: '#F8FAFC', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {selectedApp.status === 'APPLIED' && (
                <>
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus('SHORTLISTED')} disabled={processing}>Shortlist Candidate</button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger-bg)' }} onClick={() => handleUpdateStatus('REJECTED')} disabled={processing}>Reject</button>
                </>
              )}
              {selectedApp.status === 'SHORTLISTED' && (
                <>
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus('INTERVIEW_SCHEDULED')} disabled={processing}>Schedule Interview</button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleUpdateStatus('REJECTED')} disabled={processing}>Reject</button>
                </>
              )}
              {selectedApp.status === 'INTERVIEW_SCHEDULED' && (
                <>
                  <button className="btn btn-success" onClick={() => handleUpdateStatus('OFFERED')} disabled={processing}><CheckCircle size={16}/> Make Offer</button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleUpdateStatus('REJECTED')} disabled={processing}>Reject</button>
                </>
              )}
              {(selectedApp.status === 'REJECTED' || selectedApp.status === 'OFFERED') && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} /> Workflow complete for this candidate.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
