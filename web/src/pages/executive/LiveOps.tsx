import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './TaskBoard.module.css'; // Reusing styles
import { IconActivityHeartbeat, IconUsers, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

const LiveOps: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [liveStats, setLiveStats] = useState<{
    totalRegistrations: number;
    checkedIn: number;
    recentCheckIns: any[];
    issues: any[];
  }>({
    totalRegistrations: 0,
    checkedIn: 0,
    recentCheckIns: [],
    issues: []
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchLiveStats(selectedEventId);
      
      // Subscribe to real-time check-ins
      const channel = supabase.channel(`live-ops-${selectedEventId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'event_registrations', filter: `event_id=eq.${selectedEventId}` },
          (_payload) => {
            fetchLiveStats(selectedEventId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('event_id, title, status').in('status', ['upcoming', 'live', 'past']).order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].event_id);
    }
  };

  const fetchLiveStats = async (eventId: string) => {
    const { data: regData } = await supabase
      .from('event_registrations')
      .select('check_in_status, attendee_name, check_in_timestamp')
      .eq('event_id', eventId);
    
    const checkedIn = regData ? regData.filter(r => r.check_in_status === 'ATTENDED') : [];
    checkedIn.sort((a, b) => new Date(b.check_in_timestamp).getTime() - new Date(a.check_in_timestamp).getTime());

    // Merge stats + mock issues in a single setState to avoid race
    setLiveStats(prev => ({
      totalRegistrations: regData ? regData.length : 0,
      checkedIn: checkedIn.length,
      recentCheckIns: checkedIn.slice(0, 5),
      issues: prev.issues.length > 0 ? prev.issues : [
        { id: 1, time: '10:15 AM', message: 'Main Auditorium Projector missing HDMI cable.', resolved: false },
        { id: 2, time: '10:42 AM', message: 'Registration Desk 2 QR Scanner offline.', resolved: true },
      ]
    }));
  };

  const toggleIssue = (issueId: number) => {
    setLiveStats(prev => ({
      ...prev,
      issues: prev.issues.map(iss => iss.id === issueId ? { ...iss, resolved: !iss.resolved } : iss)
    }));
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow} style={{ color: '#EF4444' }}>
            <IconActivityHeartbeat size={14} style={{ marginRight: 4, verticalAlign: 'middle' }}/>
            Mission Control
          </div>
          <h1>Live Event Ops</h1>
          <p>Real-time monitor for event execution, check-ins, and ground issues.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--exec-panel-2)', color: '#fff', border: '1px solid var(--exec-line)' }}
          >
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <input 
              type="text" 
              placeholder="Scan QR Code..." 
              style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--exec-panel)', color: '#fff', border: '1px solid var(--exec-line)' }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const token = e.currentTarget.value;
                  e.currentTarget.value = '';
                  const { data, error } = await supabase.rpc('scan_event_checkin', { p_event_id: selectedEventId, p_qr_token: token });
                  if (error) alert(`Error: ${error.message}`);
                  else alert(data?.message || 'Scanned!');
                }
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Gate Check-ins</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#4ADE80', fontFamily: 'monospace' }}>{liveStats.checkedIn}</span>
            <span style={{ fontSize: 16, color: 'var(--exec-text-dim)', fontFamily: 'monospace' }}>/ {liveStats.totalRegistrations}</span>
          </div>
          <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <div style={{ height: '100%', background: '#4ADE80', borderRadius: 2, width: `${liveStats.totalRegistrations > 0 ? (liveStats.checkedIn / liveStats.totalRegistrations) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Live Attendance Rate</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60A5FA', fontFamily: 'monospace' }}>
            {liveStats.totalRegistrations > 0 ? Math.round((liveStats.checkedIn / liveStats.totalRegistrations) * 100) : 0}%
          </div>
        </div>

        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--exec-text-dim)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Active Flags</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>
            {liveStats.issues.filter(i => !i.resolved).length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Ground Issues Log */}
        <div style={{ background: 'var(--exec-panel-2)', border: '1px solid var(--exec-line)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlertTriangle size={18} color="#FBBF24" /> Ground Issues Log
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liveStats.issues.map(iss => (
              <div key={iss.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--exec-panel)', padding: 14, borderRadius: 8, borderLeft: `3px solid ${iss.resolved ? '#4ADE80' : '#EF4444'}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: iss.resolved ? 'var(--exec-text-dim)' : '#fff', textDecoration: iss.resolved ? 'line-through' : 'none' }}>{iss.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--exec-text-faint)', marginTop: 4 }}>Reported at {iss.time}</div>
                </div>
                <button 
                  onClick={() => toggleIssue(iss.id)}
                  style={{ background: iss.resolved ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', border: 'none', color: iss.resolved ? '#4ADE80' : '#fff', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {iss.resolved ? 'Resolved' : 'Resolve'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed */}
        <div style={{ background: 'var(--exec-panel-2)', border: '1px solid var(--exec-line)', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconUsers size={18} color="#60A5FA" /> Latest Check-ins
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {((liveStats as any).recentCheckIns || []).map((reg: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCheck size={16} color="#4ADE80" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{reg.attendee_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--exec-text-faint)' }}>{new Date(reg.check_in_timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            {((liveStats as any).recentCheckIns || []).length === 0 && (
              <div style={{ color: 'var(--exec-text-dim)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No recent check-ins.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveOps;
