import React from 'react';
import styles from './OwnerDashboard.module.css';
import layoutStyles from '../../layouts/OwnerLayout.module.css';
import { IconBuilding, IconUsers, IconGridDots, IconFlag } from '@tabler/icons-react';

const OwnerDashboard: React.FC = () => {
  const colleges = [
    { name: 'GEC Trivandrum', region: 'Kerala', tier: 'Premium', members: 1240, health: 99.8, status: 'ok' },
    { name: 'GedIT Institute of Technology', region: 'Karnataka', tier: 'Free', members: 860, health: 99.4, status: 'ok' },
    { name: 'St. Xavier College', region: 'Maharashtra', tier: 'Premium', members: 2010, health: 97.1, status: 'warn' },
    { name: 'NIT Rourkela', region: 'Odisha', tier: 'Premium', members: 3120, health: 99.9, status: 'ok' },
    { name: 'PSG College of Technology', region: 'Tamil Nadu', tier: 'Free', members: 970, health: 88.2, status: 'crit' }
  ];

  const getPill = (status: string) => {
    switch (status) {
      case 'ok': return <span className={`${styles.pill} ${styles.pillOk}`}><span className={styles.dot}></span>Healthy</span>;
      case 'warn': return <span className={`${styles.pill} ${styles.pillWarn}`}><span className={styles.dot}></span>Degraded</span>;
      case 'crit': return <span className={`${styles.pill} ${styles.pillCrit}`}><span className={styles.dot}></span>Critical</span>;
      default: return null;
    }
  };

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1><span style={{ background: 'var(--own-accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Global Analytics</span></h1>
          <div className={layoutStyles.sub}>Platform-wide oversight across all 47 colleges</div>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconBuilding size={16}/> Colleges onboarded</div>
          <div className={styles.statValue}>47</div>
          <div className={`${styles.delta} ${styles.up}`}>+3 this month</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconUsers size={16}/> Active users</div>
          <div className={styles.statValue}>18,420</div>
          <div className={`${styles.delta} ${styles.up}`}>+6.2% WoW</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconGridDots size={16}/> Clubs live</div>
          <div className={styles.statValue}>612</div>
          <div className={`${styles.delta} ${styles.up}`}>+14 this month</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconFlag size={16}/> Events tracked</div>
          <div className={styles.statValue}>289</div>
          <div className={styles.delta}>38 upcoming</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            <span>College leaderboard — active members</span>
            <span style={{ fontWeight: 500, textTransform: 'none', color: 'var(--own-text-dim)', fontSize: 11 }}>Last 30 days</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>College</th><th>Tier</th><th>Members</th><th>Health</th><th>Status</th></tr>
            </thead>
            <tbody>
              {colleges.sort((a,b) => b.members - a.members).map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>
                    {c.name}
                    <div style={{ color: 'var(--own-text-dim)', fontSize: 10.5, fontWeight: 400 }}>{c.region}</div>
                  </td>
                  <td><span className={`${styles.pill} ${c.tier === 'Premium' ? styles.pillBlue : ''}`}>{c.tier}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{c.members.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 80, height: 4, background: 'var(--own-panel-raised)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${c.health}%`, height: '100%', background: c.health < 90 ? 'var(--own-red)' : c.health < 97 ? 'var(--own-amber)' : 'var(--own-green)' }}></div>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--own-text-faint)' }}>{c.health}%</span>
                    </div>
                  </td>
                  <td>{getPill(c.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Moderation Queue</div>
            <div style={{ padding: '9px 0', borderBottom: '1px solid var(--own-line-soft)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontWeight: 600 }}>FinTech Club</span>
                <span className={`${styles.pill} ${styles.pillCrit}`}><span className={styles.dot}></span>2h ago</span>
              </div>
              <div style={{ color: 'var(--own-text-dim)' }}>Announcement: "Free crypto workshop..."</div>
            </div>
            <div style={{ padding: '9px 0', borderBottom: '1px solid var(--own-line-soft)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontWeight: 600 }}>Debate Society</span>
                <span className={`${styles.pill} ${styles.pillWarn}`}><span className={styles.dot}></span>6h ago</span>
              </div>
              <div style={{ color: 'var(--own-text-dim)' }}>Club banner — misleading claims</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OwnerDashboard;
