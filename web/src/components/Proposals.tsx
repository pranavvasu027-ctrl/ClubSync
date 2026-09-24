import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FilePlus, Calendar, MapPin, Loader2, X } from 'lucide-react';

export default function Proposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userClubs, setUserClubs] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    club_id: '',
    event_date: '',
    event_time: '',
    venue_name: '',
    ticket_price: '0',
    description: '',
    event_type: 'Events & Workshops',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    // 1. Fetch user's clubs (Assuming president role or core team)
    // Actually, for the web dashboard MVP, let's fetch clubs where the user is an active member
    const { data: membershipData } = await supabase
      .from('memberships')
      .select('club_id, clubs(club_name, college_id)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const clubs = membershipData?.map((m: any) => ({
      id: m.club_id,
      name: m.clubs?.club_name,
      college_id: m.clubs?.college_id
    })) || [];
    setUserClubs(clubs);
    
    if (clubs.length > 0 && !formData.club_id) {
      setFormData(prev => ({ ...prev, club_id: clubs[0].id }));
    }

    // 2. Fetch proposals (Events in 'under_review' or 'draft' status for these clubs)
    if (clubs.length > 0) {
      const clubIds = clubs.map(c => c.id);
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .in('club_id', clubIds)
        .in('status', ['under_review', 'draft'])
        .order('created_at', { ascending: false });
        
      setProposals(eventsData || []);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const selectedClub = userClubs.find(c => c.id === formData.club_id);
    
    if (!selectedClub) {
      alert("Please select a valid club.");
      setSubmitting(false);
      return;
    }

    const newEvent = {
      title: formData.title,
      club_id: selectedClub.id,
      club_name: selectedClub.name,
      college_id: selectedClub.college_id,
      event_date: formData.event_date,
      event_time: formData.event_time,
      venue_name: formData.venue_name,
      ticket_price: parseFloat(formData.ticket_price) || 0,
      description: formData.description,
      event_type: formData.event_type,
      status: 'under_review'
    };

    const { error } = await supabase
      .from('events')
      .insert([newEvent]);

    if (error) {
      console.error(error);
      alert("Error submitting proposal: " + error.message);
    } else {
      alert("Proposal submitted for faculty approval!");
      setShowModal(false);
      setFormData({
        title: '',
        club_id: selectedClub.id,
        event_date: '',
        event_time: '',
        venue_name: '',
        ticket_price: '0',
        description: '',
        event_type: 'Events & Workshops',
      });
      fetchData(); // Refresh list
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spinner" /> Loading proposals...</div>;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Event Proposals</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Draft and submit event details for faculty approval.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FilePlus size={16} /> New Proposal
        </button>
      </div>

      {proposals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <FilePlus size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, color: '#334155' }}>No active proposals</h3>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your club has no pending event proposals.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table>
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Club</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(prop => (
                <tr key={prop.event_id}>
                  <td><strong>{prop.title}</strong></td>
                  <td>{prop.club_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Calendar size={12} /> {prop.event_date} <br/>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={12} /> {prop.venue_name}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${prop.status === 'under_review' ? 'badge-pending' : 'badge-tech'}`}>
                      {prop.status === 'under_review' ? 'Faculty Review' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW PROPOSAL MODAL */}
      {showModal && (
        <div className="modal-backdrop" style={{ display: 'flex' }}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Submit Event Proposal</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {userClubs.length === 0 ? (
              <div style={{ padding: 20, background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}>
                You are not part of any club core committee. You cannot propose events.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid-equal">
                  <div className="form-group">
                    <label className="form-label">Event Title</label>
                    <input type="text" className="form-control" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g., Intro to Machine Learning" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organizing Club</label>
                    <select className="form-control" name="club_id" value={formData.club_id} onChange={handleInputChange}>
                      {userClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-equal">
                  <div className="form-group">
                    <label className="form-label">Date (e.g., Oct 24, 2026)</label>
                    <input type="text" className="form-control" name="event_date" value={formData.event_date} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time (e.g., 2:00 PM)</label>
                    <input type="text" className="form-control" name="event_time" value={formData.event_time} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="grid-equal">
                  <div className="form-group">
                    <label className="form-label">Requested Venue</label>
                    <input type="text" className="form-control" name="venue_name" value={formData.venue_name} onChange={handleInputChange} required placeholder="Main Auditorium" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ticket Price (₹)</label>
                    <input type="number" className="form-control" name="ticket_price" value={formData.ticket_price} onChange={handleInputChange} required min="0" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Description & Objective</label>
                  <textarea className="form-control" name="description" value={formData.description} onChange={handleInputChange} required rows={3} placeholder="Provide details for faculty review..."></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Send for Approval'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
