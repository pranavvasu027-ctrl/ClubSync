import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PresidentDashboard.module.css';

const NewEventProposal: React.FC = () => {
  const { profile, club } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Basic Details
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Workshop');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [scope, setScope] = useState('INTRA_COLLEGE');
  const [targetAudience, setTargetAudience] = useState('');
  const [expectedCount, setExpectedCount] = useState<number>(100);
  
  // Description
  const [outline, setOutline] = useState('');
  const [objectives, setObjectives] = useState('');
  const [outcomes, setOutcomes] = useState('');

  // Guests
  const [guests, setGuests] = useState([{ name: '', designation: '', contact: '' }]);

  // Budget
  const [income, setIncome] = useState<number>(0);
  const [expenditure, setExpenditure] = useState<number>(0);
  const [sourceOfFunds, setSourceOfFunds] = useState('');

  // Resources
  const [resources, setResources] = useState<string[]>([]);

  // Compliance
  const [compliance1, setCompliance1] = useState(false);
  const [compliance2, setCompliance2] = useState(false);
  const [compliance3, setCompliance3] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const surplusDeficit = income - expenditure;

  useEffect(() => {
    if (editId) {
      loadEvent(editId);
    }
  }, [editId, club]);

  const loadEvent = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', id)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('Event not found');
      if (club?.club_id && data.club_id !== club.club_id) {
        throw new Error('Unauthorized to edit this event');
      }
      if (data.status !== 'draft' && data.status !== 'rejected' && data.status !== 'changes_requested') {
        throw new Error('Only draft or rejected events can be edited');
      }

      setTitle(data.title || '');
      setEventType(data.event_type || 'Workshop');
      setEventDate(data.event_date || '');
      if (data.start_time) {
        const d = new Date(data.start_time);
        setStartTime(d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
      }
      if (data.end_time) {
        const d = new Date(data.end_time);
        setEndTime(d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
      }
      setVenue(data.venue_name || '');
      setScope(data.scope || 'INTRA_COLLEGE');
      setTargetAudience(data.target_audience || '');
      setExpectedCount(data.expected_count || 0);
      setOutline(data.description || '');
      setObjectives(data.objectives || '');
      setOutcomes(data.expected_outcomes || '');
      if (data.guest_details && Array.isArray(data.guest_details)) {
        setGuests(data.guest_details);
      }
      if (data.resource_requirements && Array.isArray(data.resource_requirements)) {
        setResources(data.resource_requirements);
      }
      // Budgets could be loaded here, but skipping for brevity
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = () => {
    setGuests([...guests, { name: '', designation: '', contact: '' }]);
  };

  const updateGuest = (index: number, field: string, value: string) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const toggleResource = (res: string) => {
    setResources(prev => prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]);
  };

  const validate = () => {
    if (!title.trim()) return 'Event Title is required.';
    if (!eventDate) return 'Event Date is required.';
    if (!venue.trim()) return 'Venue is required.';
    if (startTime && endTime && startTime >= endTime) return 'Start time must be before end time.';
    if (expectedCount < 0) return 'Expected count cannot be negative.';
    if (income < 0 || expenditure < 0) return 'Budget values cannot be negative.';
    return null;
  };

  const saveToDatabase = async (action: 'draft' | 'submit') => {
    setError('');
    setSuccess('');

    if (action === 'draft') {
      if (!title.trim()) {
        setError('Event Title is required even for a draft.');
        return;
      }
    } else {
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
      if (!compliance1 || !compliance2 || !compliance3) {
        setError('All compliance checkboxes must be checked to submit the proposal.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description: outline,
        event_type: eventType,
        event_date: eventDate || null,
        start_time: eventDate && startTime ? new Date(`${eventDate}T${startTime}`).toISOString() : null,
        end_time: eventDate && endTime ? new Date(`${eventDate}T${endTime}`).toISOString() : null,
        event_time: startTime && endTime ? `${startTime} - ${endTime}` : null,
        venue_name: venue,
        scope,
        target_audience: targetAudience,
        expected_count: expectedCount,
        club_id: club?.club_id || null,
        club_name: club?.name || 'Unknown Club',
        objectives,
        expected_outcomes: outcomes,
        guest_details: guests,
        resource_requirements: resources,
        compliance_verified: compliance1 && compliance2 && compliance3,
        created_by: profile?.user_id || null,
        status: 'draft'
      };

      let eventId = editId;

      if (editId) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('events')
          .update(payload)
          .eq('event_id', editId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new event
        const { data: eventData, error: insertError } = await supabase
          .from('events')
          .insert(payload)
          .select()
          .single();
          
        if (insertError) throw insertError;
        eventId = eventData.event_id;
      }

      if (action === 'submit' && eventId) {
        const { error: rpcError } = await supabase.rpc('submit_event_for_approval', { p_event_id: eventId });
        if (rpcError) throw rpcError;
        setSuccess('Event submitted for approval! Redirecting...');
      } else {
        setSuccess('Draft saved successfully! Redirecting...');
      }

      setTimeout(() => navigate('/president/events'), 1500);

    } catch (err: any) {
      console.error(`[SAVE] Catch block error:`, err);
      const errorMsg = err.message || err.details || err.hint || JSON.stringify(err);
      setError(`Database Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)', marginBottom: 24, padding: 0 }}>
        <div>
          <div className={styles.heroEyebrow}>Proposal Form</div>
          <h1 style={{ color: 'var(--pres-ink)' }}>{editId ? 'Edit Event Proposal' : 'Create Event Proposal'}</h1>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 6, marginBottom: 20 }}>{error}</div>}
      {success && <div style={{ background: 'var(--pres-green-soft)', color: 'var(--pres-green)', padding: 12, borderRadius: 6, marginBottom: 20, fontWeight: 600 }}>{success}</div>}

      <div className={styles.formPanel}>
        
        {/* EVENT DETAILS */}
        <section>
          <h2 className={styles.sectionTitle}>① Event Details</h2>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Club Name</label>
              <input type="text" value={club?.name || 'Loading...'} disabled className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>Event Title <span style={{color: 'red'}}>*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={styles.inputField} placeholder="Enter event title" />
            </div>
            <div>
              <label className={styles.label}>Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className={styles.inputField}>
                <option>Workshop</option>
                <option>Seminar</option>
                <option>Competition</option>
                <option>Hackathon</option>
                <option>Guest Lecture</option>
                <option>Cultural Fest</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Event Scope</label>
              <select value={scope} onChange={e => setScope(e.target.value)} className={styles.inputField}>
                <option value="INTRA_COLLEGE">Intra-Collegiate</option>
                <option value="INTER_COLLEGIATE">Inter-Collegiate</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Event Date <span style={{color: 'red'}}>*</span></label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className={styles.inputField} placeholder="e.g. First year students" />
            </div>
            <div>
              <label className={styles.label}>Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={styles.inputField} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Venue <span style={{color: 'red'}}>*</span></label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className={styles.inputField} placeholder="e.g. Main Auditorium" />
            </div>
            <div>
              <label className={styles.label}>Expected Count</label>
              <input type="number" min="0" value={expectedCount} onChange={e => setExpectedCount(parseInt(e.target.value) || 0)} className={styles.inputField} />
            </div>
          </div>
        </section>

        {/* DESCRIPTION */}
        <section>
          <h2 className={styles.sectionTitle}>② Event Description</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className={styles.label}>Brief Outline</label>
              <textarea value={outline} onChange={e => setOutline(e.target.value)} rows={3} className={styles.inputField} placeholder="Summarize the event..."></textarea>
            </div>
            <div>
              <label className={styles.label}>Objectives</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={2} className={styles.inputField} placeholder="What does this event aim to achieve?"></textarea>
            </div>
            <div>
              <label className={styles.label}>Expected Outcomes</label>
              <textarea value={outcomes} onChange={e => setOutcomes(e.target.value)} rows={2} className={styles.inputField} placeholder="What will participants learn/gain?"></textarea>
            </div>
          </div>
        </section>

        {/* GUESTS */}
        <section>
          <h2 className={styles.sectionTitle}>③ Guest / Resource Person</h2>
          {guests.map((g, i) => (
            <div key={i} className={styles.guestGrid}>
              <input type="text" placeholder="Name" value={g.name} onChange={e => updateGuest(i, 'name', e.target.value)} className={styles.inputField} />
              <input type="text" placeholder="Designation" value={g.designation} onChange={e => updateGuest(i, 'designation', e.target.value)} className={styles.inputField} />
              <input type="text" placeholder="Contact" value={g.contact} onChange={e => updateGuest(i, 'contact', e.target.value)} className={styles.inputField} />
            </div>
          ))}
          <button onClick={handleAddGuest} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 4, background: 'var(--pres-paper-deep)', color: 'var(--pres-ink)', border: '1px solid var(--pres-rule)', cursor: 'pointer' }}>+ Add another person</button>
        </section>

        {/* BUDGET */}
        <section>
          <h2 className={styles.sectionTitle}>④ Budget Details</h2>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Income (₹)</label>
              <input type="number" min="0" value={income} onChange={e => setIncome(Number(e.target.value))} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>Expenditure (₹)</label>
              <input type="number" min="0" value={expenditure} onChange={e => setExpenditure(Number(e.target.value))} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>Surplus / Deficit (₹)</label>
              <input type="number" value={surplusDeficit} disabled className={styles.inputField} style={{ color: surplusDeficit < 0 ? 'var(--pres-red)' : 'var(--pres-ink)', fontWeight: 600 }} />
            </div>
            <div>
              <label className={styles.label}>Source of Funds</label>
              <input type="text" value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} className={styles.inputField} placeholder="e.g. Sponsorship, College Fund" />
            </div>
          </div>
        </section>

        {/* RESOURCES */}
        <section>
          <h2 className={styles.sectionTitle}>⑤ Resource Requirements</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--pres-ink)' }}>
            {['Classrooms', 'Labs', 'Auditorium', 'Seminar Hall', 'Open Ground', 'Equipment', 'Other'].map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={resources.includes(r)} onChange={() => toggleResource(r)} /> {r}
              </label>
            ))}
          </div>
        </section>

        {/* COMPLIANCE */}
        <section>
          <h2 className={styles.sectionTitle}>⑥ Compliance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--pres-ink)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance1} onChange={e => setCompliance1(e.target.checked)} />
              Event complies with institute guidelines
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance2} onChange={e => setCompliance2(e.target.checked)} />
              Event is beneficial to students/institute
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance3} onChange={e => setCompliance3(e.target.checked)} />
              Required approvals will be obtained before the event
            </label>
          </div>
        </section>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button onClick={() => saveToDatabase('draft')} disabled={loading} style={{ padding: '10px 18px', background: 'var(--pres-paper-deep)', color: 'var(--pres-ink)', border: '1px solid var(--pres-rule)', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            SAVE DRAFT
          </button>
          <button onClick={() => saveToDatabase('submit')} disabled={loading} style={{ padding: '10px 18px', background: 'var(--pres-red)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            SUBMIT PROPOSAL
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewEventProposal;
