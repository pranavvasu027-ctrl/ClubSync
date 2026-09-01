import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './TaskBoard.module.css'; // Reuse layout styles
import { IconStarFilled } from '@tabler/icons-react';

const EventFeedback: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchFeedback(selectedEventId);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('event_id, title').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].event_id);
    }
  };

  const fetchFeedback = async (eventId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('event_feedback')
      .select(`
        *,
        user:users (name)
      `)
      .eq('event_id', eventId)
      .order('submitted_at', { ascending: false });
      
    if (data) setFeedbacks(data);
    setLoading(false);
  };

  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) 
    : '0.0';

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Analytics & Insights</div>
          <h1>Post-Event Feedback</h1>
          <p>Read attendee reviews and view the overall event rating.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--exec-panel-2)', color: '#fff', border: '1px solid var(--exec-line)' }}
          >
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Average Rating</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--exec-amber)', fontFamily: 'monospace' }}>{avgRating}</span>
            <IconStarFilled size={24} color="var(--exec-amber)" />
          </div>
        </div>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Total Reviews</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{feedbacks.length}</div>
        </div>
      </div>

      <div style={{ background: 'var(--exec-panel-2)', border: '1px solid var(--exec-line)', borderRadius: 12, padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--exec-text-dim)' }}>Loading feedback...</div>
        ) : feedbacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--exec-text-dim)' }}>No feedback submitted for this event yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {feedbacks.map(f => (
              <div key={f.feedback_id} style={{ background: 'var(--exec-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--exec-line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{f.user?.name || 'Anonymous'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStarFilled key={i} size={14} color={i < f.rating ? 'var(--exec-amber)' : 'rgba(255,255,255,0.1)'} />
                    ))}
                  </div>
                </div>
                <div style={{ color: 'var(--exec-text-dim)', fontSize: 13, lineHeight: 1.5 }}>
                  {f.comments ? `"${f.comments}"` : <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.2)' }}>No comments provided.</span>}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
                  {new Date(f.submitted_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default EventFeedback;
