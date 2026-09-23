import React from 'react';
import styles from './OwnerDashboard.module.css';
import layoutStyles from '../../layouts/OwnerLayout.module.css';

const Moderation: React.FC = () => {
  const moderationQueue = [
    {college:'PSG College of Technology',item:'Announcement: "Free crypto workshop, guaranteed returns"',club:'FinTech Club',flaggedBy:'Auto-filter',severity:'crit',age:'2h'},
    {college:'St. Xavier College',item:'Club banner — misleading claims reported by 3 users',club:'Debate Society',flaggedBy:'3 users',severity:'warn',age:'6h'},
    {college:'GedIT Institute of Technology',item:'Event listing with off-platform payment link',club:'Robotics Club',flaggedBy:'Faculty',severity:'warn',age:'1d'},
    {college:'Manipal Institute',item:'Announcement — duplicate spam posting',club:'Unaffiliated',flaggedBy:'Auto-filter',severity:'crit',age:'3h'},
  ];

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Global Moderation Queue</h1>
          <div className={layoutStyles.sub}>Flagged announcements and club pages across all colleges, before Faculty escalation</div>
        </div>
      </div>
      <div className={styles.panel}>
        {moderationQueue.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderBottom: i < moderationQueue.length - 1 ? '1px solid var(--own-line-soft)' : 'none' }}>
            <span className={`${styles.pill} ${m.severity === 'crit' ? styles.pillCrit : styles.pillWarn}`}>
              <span className={styles.dot}></span>
              {m.severity === 'crit' ? 'Critical' : 'Review'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{m.item}</div>
              <div style={{ color: 'var(--own-text-dim)', fontSize: 11.5 }}>{m.college} · {m.club} · flagged by {m.flaggedBy} · {m.age} ago</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className={`${styles.btn} ${styles.btnSm}`}>Dismiss</button>
              <button className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}>Take down</button>
              <button className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}>Escalate to Faculty</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Moderation;
