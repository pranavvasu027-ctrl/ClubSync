import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './PresidentDashboard.module.css';

const NewEventProposal: React.FC = () => {
  const { profile, club } = useAuth();
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);

  const surplusDeficit = income - expenditure;

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

  const saveToDatabase = async (status: string) => {
    setError('');
    const validationError = validate();
    if (validationError && status !== 'draft') {
      setError(validationError);
      return;
    }

    if (status !== 'draft' && (!compliance1 || !compliance2 || !compliance3)) {
      setError('All compliance checkboxes must be checked to submit the proposal.');
      return;
    }

    setLoading(true);

    try {
      // 1. Insert into events table
      const { data: eventData, error: eventError } = await supabase.from('events').insert({
        title,
        description: outline,
        event_type: eventType,
        event_date: eventDate,
        start_time: eventDate && startTime ? new Date(`${eventDate}T${startTime}`).toISOString() : null,
        end_time: eventDate && endTime ? new Date(`${eventDate}T${endTime}`).toISOString() : null,
        event_time: `${startTime} - ${endTime}`,
        venue_name: venue,
        scope,
        target_audience: targetAudience,
        expected_count: expectedCount,
        status: status, // 'draft' or 'proposed'
        club_id: club?.club_id || null,
        club_name: club?.name || 'Unknown Club',
        objectives,
        expected_outcomes: outcomes,
        guest_details: guests,
        resource_requirements: resources,
        compliance_verified: compliance1 && compliance2 && compliance3,
        created_by: profile?.user_id || null,
      }).select().single();

      if (eventError) throw eventError;

      const eventId = eventData.event_id;

      // 2. Insert into event_budgets
      if (income > 0) {
        await supabase.from('event_budgets').insert({
          event_id: eventId,
          category: 'Other',
          description: `Income: ${sourceOfFunds}`,
          estimated_amount: income
        });
      }
      if (expenditure > 0) {
        await supabase.from('event_budgets').insert({
          event_id: eventId,
          category: 'Other',
          description: 'Expenditure',
          estimated_amount: expenditure
        });
      }

      // 3. If submitting, create a PENDING approval for faculty mentor
      if (status === 'proposed') {
        await supabase.from('event_approvals').insert({
          event_id: eventId,
          approver_id: null, // Faculty mentor will claim this
          approver_level: 'FACULTY_MENTOR',
          decision: 'PENDING'
        });
      }

      navigate('/president/events');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '34px' }}>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)', marginBottom: 24, padding: 0 }}>
        <div>
          <div className={styles.heroEyebrow}>Proposal Form</div>
          <h1>Create Event Proposal</h1>
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 6, marginBottom: 20 }}>{error}</div>}

      <div className={styles.panel} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
        
        {/* EVENT DETAILS */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>① Event Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Club Name</label>
              <input type="text" value={club?.name || 'Loading...'} disabled style={{ width: '100%', padding: '8px 12px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 6, opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Event Title <span style={{color: 'red'}}>*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }}>
                <option>Workshop</option>
                <option>Seminar</option>
                <option>Competition</option>
                <option>Hackathon</option>
                <option>Guest Lecture</option>
                <option>Cultural Fest</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Event Scope</label>
              <select value={scope} onChange={e => setScope(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }}>
                <option value="INTRA_COLLEGE">Intra-Collegiate</option>
                <option value="INTER_COLLEGIATE">Inter-Collegiate</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Event Date <span style={{color: 'red'}}>*</span></label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Venue <span style={{color: 'red'}}>*</span></label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Expected Count</label>
              <input type="number" min="0" value={expectedCount} onChange={e => setExpectedCount(parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
          </div>
        </section>

        {/* DESCRIPTION */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>② Event Description</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Brief Outline</label>
              <textarea value={outline} onChange={e => setOutline(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }}></textarea>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Objectives</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }}></textarea>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Expected Outcomes</label>
              <textarea value={outcomes} onChange={e => setOutcomes(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }}></textarea>
            </div>
          </div>
        </section>

        {/* GUESTS */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>③ Guest / Resource Person</h2>
          {guests.map((g, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input type="text" placeholder="Name" value={g.name} onChange={e => updateGuest(i, 'name', e.target.value)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
              <input type="text" placeholder="Designation" value={g.designation} onChange={e => updateGuest(i, 'designation', e.target.value)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
              <input type="text" placeholder="Contact" value={g.contact} onChange={e => updateGuest(i, 'contact', e.target.value)} style={{ padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
          ))}
          <button onClick={handleAddGuest} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 4, background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', cursor: 'pointer' }}>+ Add another person</button>
        </section>

        {/* BUDGET */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>④ Budget Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Income (₹)</label>
              <input type="number" min="0" value={income} onChange={e => setIncome(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Expenditure (₹)</label>
              <input type="number" min="0" value={expenditure} onChange={e => setExpenditure(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Surplus / Deficit (₹)</label>
              <input type="number" value={surplusDeficit} disabled style={{ width: '100%', padding: '8px 12px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 6, opacity: 0.8, color: surplusDeficit < 0 ? 'red' : 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Source of Funds</label>
              <input type="text" value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid var(--pres-rule)', borderRadius: 6 }} />
            </div>
          </div>
        </section>

        {/* RESOURCES */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>⑤ Resource Requirements</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            {['Classrooms', 'Labs', 'Auditorium', 'Seminar Hall', 'Open Ground', 'Equipment', 'Other'].map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={resources.includes(r)} onChange={() => toggleResource(r)} /> {r}
              </label>
            ))}
          </div>
        </section>

        {/* COMPLIANCE */}
        <section>
          <h2 style={{ fontSize: 16, borderBottom: '1px solid var(--pres-rule)', paddingBottom: 8, marginBottom: 16 }}>⑥ Compliance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={compliance1} onChange={e => setCompliance1(e.target.checked)} />
              Event complies with institute guidelines
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={compliance2} onChange={e => setCompliance2(e.target.checked)} />
              Event is beneficial to students/institute
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={compliance3} onChange={e => setCompliance3(e.target.checked)} />
              Required approvals will be obtained before the event
            </label>
          </div>
        </section>

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--pres-rule)' }}>
          <button onClick={() => saveToDatabase('draft')} disabled={loading} style={{ padding: '10px 18px', background: 'var(--pres-paper-deep)', border: '1px solid var(--pres-rule)', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            SAVE DRAFT
          </button>
          <button onClick={() => saveToDatabase('proposed')} disabled={loading} style={{ padding: '10px 18px', background: 'var(--pres-red)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            SUBMIT PROPOSAL
          </button>
        </div>

      </div>
    </div>
  );
};

export default NewEventProposal;
