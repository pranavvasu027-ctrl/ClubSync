import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { IconPrinter } from '@tabler/icons-react';

const Reports: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) generateReport(selectedEventId);
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('event_id, title').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].event_id);
    }
  };

  const generateReport = async (eventId: string) => {
    setLoading(true);
    
    // Fetch Event Details
    const { data: ev } = await supabase.from('events').select('*').eq('event_id', eventId).single();
    
    // Fetch Registrations & Attendance
    const { data: reg } = await supabase.from('event_registrations').select('check_in_status').eq('event_id', eventId);
    
    // Fetch Feedback
    const { data: fb } = await supabase.from('event_feedback').select('rating').eq('event_id', eventId);
    
    // Fetch Budgets
    const { data: bud } = await supabase.from('event_budgets').select('estimated_amount, actual_amount, is_approved').eq('event_id', eventId);
    
    const totalRegistrations = reg ? reg.length : 0;
    const attended = reg ? reg.filter(r => r.check_in_status === 'ATTENDED').length : 0;
    
    const avgRating = fb && fb.length > 0 
      ? (fb.reduce((acc, f) => acc + f.rating, 0) / fb.length).toFixed(1) 
      : 'N/A';
      
    const estimatedBudget = bud ? bud.reduce((acc, b) => acc + b.estimated_amount, 0) : 0;
    const actualBudget = bud ? bud.reduce((acc, b) => acc + (b.actual_amount || 0), 0) : 0;

    setReportData({
      event: ev,
      totalRegistrations,
      attended,
      attendanceRate: totalRegistrations > 0 ? Math.round((attended / totalRegistrations) * 100) : 0,
      avgRating,
      feedbackCount: fb ? fb.length : 0,
      estimatedBudget,
      actualBudget,
      variance: estimatedBudget - actualBudget
    });
    
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sec-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Automated Reports</div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#fff' }}>Post-Event Summary Generator</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {events.map(ev => <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            <IconPrinter size={16} /> Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>Generating Report Data...</div>
      ) : reportData && reportData.event ? (
        <div style={{ background: '#fff', padding: 40, borderRadius: 12, color: '#0F172A', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 30, borderBottom: '2px solid #E2E8F0', paddingBottom: 20 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0' }}>{reportData.event.title}</h2>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              {reportData.event.club_name} | {reportData.event.event_date} | {reportData.event.venue_name}
            </div>
            <div style={{ display: 'inline-block', marginTop: 12, background: '#F1F5F9', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#334155' }}>
              OFFICIAL POST-EVENT SUMMARY REPORT
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 30 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Registrations</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{reportData.totalRegistrations}</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Actual Turnout</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A' }}>{reportData.attended}</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Turnout Rate</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{reportData.attendanceRate}%</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 20, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Avg Feedback</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706' }}>{reportData.avgRating} ★</div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 16 }}>Financial Audit</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', color: '#475569', fontWeight: 600 }}>Metric</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', color: '#475569', fontWeight: 600 }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 16px' }}>Estimated Budget (Requested)</td>
                <td style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'monospace' }}>₹{reportData.estimatedBudget.toLocaleString()}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '12px 16px' }}>Actual Final Cost</td>
                <td style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>₹{reportData.actualBudget.toLocaleString()}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: reportData.variance >= 0 ? '#16A34A' : '#DC2626' }}>
                  {reportData.variance >= 0 ? 'Under Budget (Saved)' : 'Over Budget (Excess)'}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: reportData.variance >= 0 ? '#16A34A' : '#DC2626' }}>
                  ₹{Math.abs(reportData.variance).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 40 }}>
            Generated automatically by ClubSync • NAAC Criterion 5.3 Compliant
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
