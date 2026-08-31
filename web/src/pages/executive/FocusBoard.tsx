import React from 'react';

const FocusBoard: React.FC = () => {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26 }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--exec-lime)', marginBottom: 8 }}>Good morning, executive</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 30, margin: 0 }}>Arnav's focus board</h1>
          <p style={{ color: 'var(--exec-text-dim)', fontSize: 13.5, marginTop: 6 }}>3 tasks due today · 4 events under your ownership · 12 announcements sent</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--exec-text-faint)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Announcements Sent</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700 }}>12</div>
          <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600, color: 'var(--exec-lime)' }}>+4 this week</div>
        </div>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--exec-text-faint)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Tasks Completed</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700 }}>8 <span style={{ fontSize: 14, color: 'var(--exec-text-faint)' }}>/ 15</span></div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--exec-sky)', width: '53%' }}></div>
          </div>
        </div>
        <div style={{ background: 'var(--exec-panel)', border: '1px solid var(--exec-line)', borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--exec-text-faint)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Upcoming Events</div>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700 }}>3</div>
          <div style={{ fontSize: 11, marginTop: 8, fontWeight: 600, color: 'var(--exec-amber)' }}>Next: Pune TechFest Hackathon</div>
        </div>
      </div>
    </div>
  );
};

export default FocusBoard;
