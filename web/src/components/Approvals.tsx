import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, Loader2, MapPin, Calendar, FileText } from 'lucide-react';

export default function Approvals() {
  const { user } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, [user]);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    // Fetch all events that are 'proposed'. 
    // In a full production setup, we'd filter by the Faculty's college_id or specific club assignments.
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'proposed')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching approvals:", error);
    } else {
      setPendingEvents(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (eventId: string, action: 'approve' | 'reject') => {
    if (!user) return;
    setProcessingId(eventId);
    
    const newStatus = action === 'approve' ? 'live' : 'draft'; // Send back to draft if rejected

    // 1. Update the Event status
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('event_id', eventId);

    if (updateError) {
      alert("Error updating event: " + updateError.message);
      setProcessingId(null);
      return;
    }

    // 2. Log the approval/rejection trail
    const { error: auditError } = await supabase
      .from('event_approvals')
      .insert([{
        event_id: eventId,
        approver_id: user.id,
        status: action === 'approve' ? 'Approved' : 'Rejected',
        comments: action === 'approve' ? 'Approved by Faculty Dashboard' : 'Rejected by Faculty Dashboard'
      }]);
      
    if (auditError) {
      console.warn("Could not write audit log, but event was updated:", auditError);
    }

    // Refresh list
    fetchPendingApprovals();
    setProcessingId(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" /> Loading pending approvals...</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Faculty & Administrative Approvals</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Review and approve event proposals submitted by Club Presidents.</p>
        </div>
      </div>

      {pendingEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <CheckCircle size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, color: '#334155' }}>All caught up!</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>There are no pending event proposals requiring your attention right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingEvents.map(event => (
            <div key={event.event_id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className="badge badge-pending" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Pending Review
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{event.club_name}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>{event.title}</h3>
                  
                  <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                      <Calendar size={15} /> {event.event_date} @ {event.event_time}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                      <MapPin size={15} /> {event.venue_name}
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text)', border: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0 }}>{event.description || 'No description provided.'}</p>
                  </div>
                  
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong>Budget / Ticket Price:</strong> ₹{event.ticket_price}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
                  <button 
                    className="btn btn-success" 
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleAction(event.event_id, 'approve')}
                    disabled={processingId === event.event_id}
                  >
                    {processingId === event.event_id ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                    Approve Event
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: '#fca5a5' }}
                    onClick={() => handleAction(event.event_id, 'reject')}
                    disabled={processingId === event.event_id}
                  >
                    <XCircle size={16} /> Send Back
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
