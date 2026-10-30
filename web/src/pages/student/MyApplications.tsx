import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { IconChecklist, IconTicket, IconQrcode, IconX, IconCalendarEvent } from '@tabler/icons-react';

const MyApplications = () => {
  const { user, profile } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [selectedPass, setSelectedPass] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const targetUserId = profile?.user_id || user?.id;
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Applications
        const { data: appsData } = await supabase
          .from('applications')
          .select('*, recruitment_cycles(title, club_name)')
          .eq('applicant_id', targetUserId)
          .order('applied_at', { ascending: false });
        if (appsData) setApps(appsData);

        // 2. Passes
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('*, events(title, club_name, venue_name, event_date, event_time)')
          .eq('user_id', targetUserId)
          .order('registered_at', { ascending: false });

        const localRegs = JSON.parse(localStorage.getItem('clubsync_student_registrations') || '[]');
        const allPasses = [...localRegs, ...(regData || [])];
        const seen = new Set();
        const dedupedPasses = allPasses.filter(p => {
          const key = p.registration_id || p.qr_token || p.event_id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setPasses(dedupedPasses);
      } catch (err) {
        console.warn('Error loading student applications/passes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.user_id, user?.id]);

  if (loading) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading your profile data...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 26, margin: '0 0 8px 0', color: '#0f172a' }}>My Applications & Event Passes</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px 0' }}>Track all your club recruitment applications and verified digital entry passes.</p>

      {/* EVENT PASSES WALLET */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <IconTicket size={20} color="#2563eb" /> Active Event Passes ({passes.length})
        </h2>

        {passes.length === 0 ? (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b' }}>
            No registered event passes yet. Browse upcoming campus events on your Dashboard to RSVP.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {passes.map(pass => {
              const title = pass.events?.title || pass.title || 'Campus Event';
              const club = pass.events?.club_name || pass.club_name || 'ClubSync';
              const venue = pass.events?.venue_name || pass.venue_name || 'Campus Venue';
              const date = pass.events?.event_date || pass.event_date;
              return (
                <div 
                  key={pass.registration_id || pass.qr_token || pass.event_id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 18,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                        {pass.ticket_tier || 'Standard Entry Pass'}
                      </span>
                      <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        {pass.check_in_status || 'REGISTERED'}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#0f172a' }}>{title}</h3>
                    <p style={{ margin: '0 0 6px 0', fontSize: 13, color: '#64748b' }}>{club} • {venue}</p>
                    {date && (
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                        <IconCalendarEvent size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {new Date(date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPass(pass)}
                    style={{
                      marginTop: 16,
                      padding: '8px 12px',
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <IconQrcode size={16} /> View Gate Pass
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECRUITMENT APPLICATIONS */}
      <div>
        <h2 style={{ fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <IconChecklist size={20} color="#059669" /> Club Recruitment Applications ({apps.length})
        </h2>

        {apps.length === 0 ? (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 30, textAlign: 'center', color: '#64748b' }}>
            You haven't submitted any club applications yet. Browse Openings to apply.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {apps.map(app => (
              <div 
                key={app.id || app.application_id}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: '#0f172a' }}>
                    {app.recruitment_cycles?.title || 'Club Position'}
                  </h3>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {app.recruitment_cycles?.club_name || 'Club'} • Applied: {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  background: app.status === 'selected' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                  color: app.status === 'selected' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#334155'
                }}>
                  {app.status?.toUpperCase() || 'SUBMITTED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PASS MODAL */}
      {selectedPass && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 380,
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 99 }}>
                DIGITAL GATE PASS
              </span>
              <button onClick={() => setSelectedPass(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <IconX size={20} />
              </button>
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: 18, color: '#0f172a' }}>
              {selectedPass.events?.title || selectedPass.title || 'Campus Event'}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748b' }}>
              {selectedPass.events?.club_name || selectedPass.club_name || 'ClubSync'}
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 12, padding: 20, display: 'inline-block', marginBottom: 16 }}>
              <IconQrcode size={150} color="#0f172a" />
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>
                {selectedPass.qr_token || 'CS-VALID-GATE-PASS'}
              </div>
            </div>

            <div style={{ textAlign: 'left', background: '#f1f5f9', borderRadius: 8, padding: 12, fontSize: 12, color: '#475569', marginBottom: 16 }}>
              <div><strong>Attendee:</strong> {profile?.name || 'Student'}</div>
              <div><strong>Pass Tier:</strong> {selectedPass.ticket_tier || 'Standard Entry Pass'}</div>
              <div><strong>Status:</strong> {selectedPass.check_in_status || 'REGISTERED'}</div>
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
