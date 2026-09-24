import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { IconCalendarEvent, IconMapPin, IconUsers, IconTicket, IconQrcode } from '@tabler/icons-react';

const StudentEventDetails: React.FC = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (eventId) fetchDetails();
  }, [eventId]);

  const fetchDetails = async () => {
    setLoading(true);
    // Fetch Event
    const { data: evData, error: evError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (evData) {
      setEvent(evData);
    }

    // Fetch Tickets
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId);
    
    if (ticketData) {
      setTickets(ticketData);
      if (ticketData.length > 0) setSelectedTicket(ticketData[0].tier_name);
    }

    // Fetch User Registration
    if (user) {
      const { data: regData } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (regData) setRegistration(regData);
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    if (!selectedTicket) return setError('Please select a ticket tier');
    try {
      const { data, error } = await supabase.rpc('register_for_event', {
        p_event_id: eventId,
        p_ticket_tier: selectedTicket
      });
      if (error) throw error;
      setSuccess('Successfully registered!');
      fetchDetails();
    } catch(err: any) {
      setError(err.message || 'Error registering for event');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading event details...</div>;
  if (!event) return <div style={{ padding: 40 }}>Event not found.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate('/student')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: 20 }}>
        &larr; Back to Dashboard
      </button>
      
      <div style={{ background: '#fff', borderRadius: 12, padding: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: 28 }}>{event.title}</h1>
        <div style={{ color: '#666', fontSize: 16, marginBottom: 20 }}>{event.club_name || 'VIT Pune'}</div>
        
        <div style={{ display: 'flex', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconCalendarEvent size={18}/> {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconMapPin size={18}/> {event.venue_name || 'TBD'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconUsers size={18}/> {event.registered_count} / {event.expected_count} Registered</div>
        </div>

        <div style={{ marginBottom: 40, lineHeight: 1.6, color: '#444' }}>
          <h3>About Event</h3>
          <p>{event.description || 'No description provided.'}</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 6, marginBottom: 20 }}>{error}</div>}
        {success && <div style={{ background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 6, marginBottom: 20 }}>{success}</div>}

        {registration ? (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, textAlign: 'center' }}>
            <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><IconChecklist/> You are registered!</h3>
            <p>Ticket Tier: {registration.ticket_tier}</p>
            <p>Status: {registration.check_in_status}</p>
            
            {event.status === 'completed' || event.status === 'past' ? (
              registration.check_in_status === 'ATTENDED' ? (
                <div style={{ marginTop: 20, padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <h4>Event Completed - Leave Feedback</h4>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Rate your experience from 1 (Poor) to 5 (Excellent).</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const rating = parseInt(form.rating.value, 10);
                    const comments = form.comments.value;
                    const { error } = await supabase.from('event_feedback').insert({ event_id: eventId, user_id: user?.id, rating, comments });
                    if (error) alert(error.message);
                    else { alert('Feedback submitted! Thank you!'); fetchDetails(); }
                  }}>
                    <input type="number" name="rating" min="1" max="5" required style={{ padding: 8, width: 60, marginBottom: 10 }} /> / 5<br/>
                    <textarea name="comments" placeholder="Optional comments..." style={{ width: '100%', padding: 8, height: 60, marginBottom: 10 }}></textarea><br/>
                    <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Submit Feedback</button>
                  </form>
                </div>
              ) : (
                <div style={{ marginTop: 20, color: '#64748b' }}>Event is over. You did not attend.</div>
              )
            ) : (
              <div style={{ marginTop: 20, background: '#fff', display: 'inline-block', padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <IconQrcode size={100} color="#0f172a" />
                <div style={{ marginTop: 10, fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{registration.qr_token.substring(0, 16)}...</div>
              </div>
            )}
          </div>
        ) : (
          event.status === 'published' ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <h3>Select Ticket</h3>
              {tickets.length === 0 ? (
                <p>No tickets configured yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {tickets.map(t => (
                    <label key={t.ticket_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: '#fff', border: selectedTicket === t.tier_name ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                      <input type="radio" name="ticket" checked={selectedTicket === t.tier_name} onChange={() => setSelectedTicket(t.tier_name)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{t.tier_name}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>₹{t.price}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <button 
                onClick={handleRegister} 
                disabled={tickets.length === 0}
                style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                <IconTicket size={20}/> Register Now
              </button>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', background: '#f1f5f9', borderRadius: 8, color: '#64748b' }}>
              Registration is not currently open for this event.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StudentEventDetails;
