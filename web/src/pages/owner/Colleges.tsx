import React from 'react';
import styles from './OwnerDashboard.module.css';
import layoutStyles from '../../layouts/OwnerLayout.module.css';
import { IconTrash, IconPlus } from '@tabler/icons-react';

const Colleges: React.FC = () => {
  const colleges = [
    { name: 'GEC Trivandrum', region: 'Kerala', tier: 'Premium', members: 1240, clubs: 22, health: 99.8, joined: '2024-01-14', status: 'ok' },
    { name: 'GedIT Institute of Technology', region: 'Karnataka', tier: 'Free', members: 860, clubs: 14, health: 99.4, joined: '2024-02-02', status: 'ok' },
    { name: 'St. Xavier College', region: 'Maharashtra', tier: 'Premium', members: 2010, clubs: 31, health: 97.1, joined: '2023-11-20', status: 'warn' },
    { name: 'NIT Rourkela', region: 'Odisha', tier: 'Premium', members: 3120, clubs: 44, health: 99.9, joined: '2023-08-09', status: 'ok' },
    { name: 'PSG College of Technology', region: 'Tamil Nadu', tier: 'Free', members: 970, clubs: 18, health: 88.2, joined: '2024-04-27', status: 'crit' },
    { name: 'Manipal Institute', region: 'Karnataka', tier: 'Premium', members: 4210, clubs: 56, health: 99.6, joined: '2023-06-01', status: 'ok' },
    { name: 'BITS Pilani (Goa)', region: 'Goa', tier: 'Premium', members: 1890, clubs: 27, health: 99.9, joined: '2023-09-15', status: 'ok' },
    { name: 'Jadavpur University', region: 'West Bengal', tier: 'Free', members: 2400, clubs: 33, health: 98.8, joined: '2024-03-11', status: 'ok' },
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
          <h1>Colleges</h1>
          <div className={layoutStyles.sub}>Add, remove, and manage every college in the ClubSync ecosystem</div>
        </div>
        <div className={layoutStyles.actions}>
          <button className={`${styles.btn} ${styles.btnDanger}`}><IconTrash size={15}/> Remove college</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}><IconPlus size={15}/> Add college</button>
        </div>
      </div>

      <div className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>College</th>
              <th>Region</th>
              <th>Tier</th>
              <th>Members</th>
              <th>Clubs</th>
              <th>Onboarded</th>
              <th>Health</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'var(--own-text-dim)' }}>{c.region}</td>
                <td><span className={`${styles.pill} ${c.tier === 'Premium' ? styles.pillBlue : ''}`}>{c.tier}</span></td>
                <td style={{ fontFamily: 'monospace' }}>{c.members.toLocaleString()}</td>
                <td style={{ fontFamily: 'monospace' }}>{c.clubs}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--own-text-dim)' }}>{c.joined}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 80, height: 4, background: 'var(--own-panel-raised)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${c.health}%`, height: '100%', background: c.health < 90 ? 'var(--own-red)' : c.health < 97 ? 'var(--own-amber)' : 'var(--own-green)' }}></div>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--own-text-faint)' }}>{c.health}%</span>
                  </div>
                </td>
                <td>{getPill(c.status)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className={`${styles.btn} ${styles.btnSm}`}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Colleges;
