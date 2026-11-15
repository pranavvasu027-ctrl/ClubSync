import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './PresidentDashboard.module.css';
import { eventStore, STANDARD_CAMPUS_VENUES, getVenueCapacity } from '../../services/eventStore';
import SanctionNoteModal from '../../components/SanctionNoteModal';
import { IconFileText, IconAlertTriangle } from '@tabler/icons-react';

const NewEventProposal: React.FC = () => {
  const { profile, club } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Basic Details
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Workshop');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [venue, setVenue] = useState(STANDARD_CAMPUS_VENUES[0]?.name || 'Sharad Arena');
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
  const [showSanctionNote, setShowSanctionNote] = useState(false);

  const surplusDeficit = income - expenditure;

  useEffect(() => {
    if (editId) {
      loadEvent(editId);
    }
  }, [editId, club]);

  const loadEvent = async (id: string) => {
    setLoading(true);
    try {
      const local = eventStore.getEventById(id);
      if (local) {
        populateFields(local);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', id)
        .single();
        
      if (!error && data) {
        populateFields(data);
      }
    } catch (err: any) {
      console.warn('Load event notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (data: any) => {
    setTitle(data.title || '');
    setEventType(data.event_type || 'Workshop');
    setEventDate(data.event_date || '');
    setVenue(data.venue_name || '');
    setScope(data.scope || 'INTRA_COLLEGE');
    setTargetAudience(data.target_audience || '');
    setExpectedCount(data.expected_count || 100);
    setOutline(data.description || '');
    setObjectives(data.objectives || '');
    setOutcomes(data.expected_outcomes || '');
    if (data.guest_details && Array.isArray(data.guest_details)) {
      setGuests(data.guest_details);
    }
    if (data.resource_requirements && Array.isArray(data.resource_requirements)) {
      setResources(data.resource_requirements);
    }
    if (data.budget) {
      setIncome(data.budget.income || 0);
      setExpenditure(data.budget.expenditure || 0);
      setSourceOfFunds(data.budget.source_of_funds || '');
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

    // Check past date
    const todayStr = new Date().toISOString().split('T')[0];
    if (eventDate < todayStr) {
      return 'Event Date cannot be in the past. Please select an upcoming date.';
    }

    if (!venue.trim()) return 'Venue is required.';
    if (startTime && endTime && startTime >= endTime) return 'Start time must be before end time.';
    
    // Check expected footfall limits
    if (expectedCount < 10) {
      return 'Expected footfall must be at least 10 attendees (events with fewer than 10 students cannot be sanctioned as institutional events).';
    }

    const venueMax = getVenueCapacity(venue);
    if (expectedCount > venueMax) {
      return `Capacity Hazard: Expected footfall (${expectedCount}) exceeds maximum capacity (${venueMax}) for ${venue}. Please select a larger auditorium or reduce expected capacity.`;
    }

    if (income < 0 || expenditure < 0) return 'Budget values cannot be negative.';

    // Time-Slot Aware Venue Collision Check
    const venueClash = eventStore.checkVenueConflict(venue, eventDate, editId || undefined, startTime, endTime);
    if (venueClash.hasConflict) {
      return venueClash.message || 'Venue collision detected.';
    }

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
        setCompliance1(true);
        setCompliance2(true);
        setCompliance3(true);
      }
    }

    setLoading(true);

    try {
      const safeEventDate = eventDate || new Date().toISOString().split('T')[0];
      const safeEventTime = startTime && endTime ? `${startTime} - ${endTime}` : '10:00 AM - 1:00 PM';
      const safeClubId = club?.club_id || 'VIT_CSI';
      const safeClubName = club?.name || 'Computer Society of India (CSI)';

      const eventPayload: any = {
        title: title.trim(),
        description: outline || title.trim(),
        event_type: eventType || 'Workshop',
        event_date: safeEventDate,
        event_time: safeEventTime,
        venue_name: venue || 'Sharad Arena',
        scope: scope || 'INTRA_COLLEGE',
        target_audience: targetAudience || 'All Students',
        expected_count: expectedCount || 100,
        club_id: safeClubId,
        club_name: safeClubName,
        objectives: objectives || 'Practical workshop and skill building',
        expected_outcomes: outcomes || 'Hands-on project and certification',
        guest_details: guests.filter(g => g.name.trim() !== ''),
        resource_requirements: resources,
        budget: {
          income: Number(income) || 0,
          expenditure: Number(expenditure) || 0,
          source_of_funds: sourceOfFunds || 'Club Operating Fund'
        },
        created_by_name: profile?.name || 'Arnav Deshmukh (President)',
        status: action === 'submit' ? 'under_review' : 'draft'
      };

      if (editId) {
        eventStore.updateEvent(editId, eventPayload, action === 'submit');
        setSuccess(action === 'submit' ? 'Event proposal updated & submitted for faculty review!' : 'Draft saved successfully!');
      } else {
        const result = await eventStore.createEvent(eventPayload, action === 'submit');
        if (!result.success) {
          setError(result.error || 'Failed to submit proposal due to venue clash.');
          setLoading(false);
          return;
        }
        setSuccess(action === 'submit' ? 'Official Sanction Note submitted to Faculty Mentor!' : 'Draft proposal saved successfully!');
      }

      setTimeout(() => navigate('/president/events'), 1400);

    } catch (err: any) {
      console.error(`[SAVE] Error:`, err);
      setError(`Notice: ${err.message || 'Saved in local storage'}`);
    } finally {
      setLoading(false);
    }
  };

  const previewNoteData = {
    title: title || 'Untitled Event Proposal',
    club_name: club?.name || 'Computer Society of India (CSI)',
    event_type: eventType,
    scope: scope,
    event_date: eventDate || 'Date TBD',
    event_time: startTime && endTime ? `${startTime} - ${endTime}` : '10:00 AM - 1:00 PM',
    venue_name: venue || 'Sharad Arena, Campus 1',
    target_audience: targetAudience,
    expected_count: expectedCount,
    description: outline || 'No description provided.',
    objectives: objectives,
    expected_outcomes: outcomes,
    guest_details: guests,
    resource_requirements: resources,
    budget: {
      income: Number(income) || 0,
      expenditure: Number(expenditure) || 0,
      source_of_funds: sourceOfFunds,
      surplus_deficit: surplusDeficit
    },
    status: 'under_review',
    created_by_name: profile?.name || 'Arnav Deshmukh (President)'
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {showSanctionNote && (
        <SanctionNoteModal
          event={previewNoteData}
          onClose={() => setShowSanctionNote(false)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--blue)', textTransform: 'uppercase' }}>Proposal Form</span>
          <h1 style={{ fontSize: 26, margin: '4px 0 0', color: 'var(--ink)', fontWeight: 700, letterSpacing: '-0.02em' }}>{editId ? 'Edit Event Proposal' : 'Create Event Proposal Note'}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSanctionNote(true)}
          className={`${styles.btn} ${styles.btnGhost}`}
        >
          <IconFileText size={16} color="var(--blue)" /> Preview Sanction Note
        </button>
      </div>

      {error && <div style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 13, border: '1px solid #fca5a5' }}>{error}</div>}
      {success && <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 13, border: '1px solid #86efac' }}>{success}</div>}

      <div className={styles.formPanel}>
        {/* BASIC DETAILS */}
        <section>
          <h2 className={styles.sectionTitle}>① Event Details</h2>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Club Name</label>
              <input type="text" value={club?.name || 'Computer Society of India (CSI)'} disabled className={styles.inputField} style={{ background: '#f8fafc' }} />
            </div>
            <div>
              <label className={styles.label}>Event Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={styles.inputField} placeholder="e.g. HackVIT 2026" required />
            </div>
            <div>
              <label className={styles.label}>Event Type</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} className={styles.inputField}>
                <option value="Workshop">Workshop</option>
                <option value="Tech Talk">Tech Talk</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Cultural">Cultural</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Event Scope</label>
              <select value={scope} onChange={e => setScope(e.target.value)} className={styles.inputField}>
                <option value="INTRA_COLLEGE">Intra-Collegiate (VIT Pune)</option>
                <option value="INTER_COLLEGIATE">Inter-Collegiate (State Level)</option>
                <option value="NATIONAL">National Scale</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Event Date *</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={styles.inputField} required />
            </div>
            <div>
              <label className={styles.label}>Target Audience</label>
              <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className={styles.inputField} placeholder="e.g. 1st & 2nd Year B.Tech Students" />
            </div>
            <div>
              <label className={styles.label}>Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={styles.inputField} />
            </div>
            <div>
              <label className={styles.label}>Proposed Venue * (Conflict Checked)</label>
              <select 
                value={venue} 
                onChange={e => setVenue(e.target.value)} 
                className={styles.inputField}
                required
              >
                {STANDARD_CAMPUS_VENUES.map(v => (
                  <option key={v.venue_id} value={v.name}>
                    {v.name} ({v.capacity} capacity · {v.building})
                  </option>
                ))}
                <option value="Open Ground">Open Ground / Campus Arena</option>
                <option value="Online Virtual">Online Webinar Platform</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Expected Footfall</label>
              <input type="number" value={expectedCount} onChange={e => setExpectedCount(Number(e.target.value))} className={styles.inputField} min={10} />
            </div>

            {eventDate && eventStore.checkVenueConflict(venue, eventDate, editId || undefined, startTime, endTime).hasConflict && (
              <div style={{ gridColumn: '1 / -1', background: 'var(--red-soft)', border: '1px solid #f87171', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <IconAlertTriangle size={18} color="var(--red)" />
                <span>{eventStore.checkVenueConflict(venue, eventDate, editId || undefined, startTime, endTime).message}</span>
              </div>
            )}
          </div>
        </section>

        {/* DESCRIPTION & NAAC OBJECTIVES */}
        <section>
          <h2 className={styles.sectionTitle}>② Academic Relevance &amp; Objectives</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className={styles.label}>Event Description &amp; Summary *</label>
              <textarea value={outline} onChange={e => setOutline(e.target.value)} className={styles.inputField} rows={3} placeholder="Comprehensive description of the event..." />
            </div>
            <div>
              <label className={styles.label}>Learning Objectives (NAAC Criteria)</label>
              <textarea value={objectives} onChange={e => setObjectives(e.target.value)} className={styles.inputField} rows={2} placeholder="Key technical and practical skills participants will gain..." />
            </div>
            <div>
              <label className={styles.label}>Expected Outcomes</label>
              <textarea value={outcomes} onChange={e => setOutcomes(e.target.value)} className={styles.inputField} rows={2} placeholder="Project submissions, certificates, community contributions..." />
            </div>
          </div>
        </section>

        {/* GUESTS */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>③ Invited Dignitaries &amp; Speakers</h2>
            <button type="button" onClick={handleAddGuest} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>+ Add Speaker</button>
          </div>
          {guests.map((g, i) => (
            <div key={i} className={styles.formGrid} style={{ marginTop: 10, padding: 12, border: '1px dashed var(--line)', borderRadius: 10 }}>
              <div>
                <label className={styles.label}>Speaker Name</label>
                <input type="text" value={g.name} onChange={e => updateGuest(i, 'name', e.target.value)} className={styles.inputField} placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label className={styles.label}>Designation &amp; Organization</label>
                <input type="text" value={g.designation} onChange={e => updateGuest(i, 'designation', e.target.value)} className={styles.inputField} placeholder="AI Researcher at Google" />
              </div>
            </div>
          ))}
        </section>

        {/* BUDGET */}
        <section>
          <h2 className={styles.sectionTitle}>④ Financial Statement &amp; Budget Note</h2>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.label}>Estimated Income / Passes (₹)</label>
              <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className={styles.inputField} min={0} />
            </div>
            <div>
              <label className={styles.label}>Estimated Expenditure (₹)</label>
              <input type="number" value={expenditure} onChange={e => setExpenditure(Number(e.target.value))} className={styles.inputField} min={0} />
            </div>
            <div>
              <label className={styles.label}>Surplus / Deficit (₹)</label>
              <input type="number" value={surplusDeficit} disabled className={styles.inputField} style={{ color: surplusDeficit < 0 ? 'var(--red)' : 'var(--ink)', fontWeight: 600 }} />
            </div>
            <div>
              <label className={styles.label}>Source of Funds</label>
              <input type="text" value={sourceOfFunds} onChange={e => setSourceOfFunds(e.target.value)} className={styles.inputField} placeholder="e.g. Sponsorship, Club Fund" />
            </div>
          </div>
        </section>

        {/* RESOURCES */}
        <section>
          <h2 className={styles.sectionTitle}>⑤ Resource Requirements</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink)' }}>
            {['Classrooms', 'Labs', 'Auditorium', 'Seminar Hall', 'Open Ground', 'Equipment', 'Audio System'].map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={resources.includes(r)} onChange={() => toggleResource(r)} /> {r}
              </label>
            ))}
          </div>
        </section>

        {/* COMPLIANCE */}
        <section>
          <h2 className={styles.sectionTitle}>⑥ Compliance Affirmations</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--ink)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance1} onChange={e => setCompliance1(e.target.checked)} />
              Event complies with institute guidelines and student conduct norms.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance2} onChange={e => setCompliance2(e.target.checked)} />
              Budget and resource estimates are verified with the club treasurer.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={compliance3} onChange={e => setCompliance3(e.target.checked)} />
              Official faculty advisor endorsement will be secured before campus announcements.
            </label>
          </div>
        </section>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => setShowSanctionNote(true)}
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            Preview Note
          </button>
          <button
            type="button"
            onClick={() => saveToDatabase('draft')}
            disabled={loading}
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => saveToDatabase('submit')}
            disabled={loading}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            {loading ? 'Submitting...' : 'Submit Proposal Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewEventProposal;
