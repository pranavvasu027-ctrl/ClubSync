import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styles from './OwnerLayout.module.css';
import { useAuth } from '../context/AuthContext';
import { IconGridDots, IconBuilding, IconFlag, IconShieldLock } from '@tabler/icons-react';

const OwnerLayout: React.FC = () => {
  const { profile } = useAuth();
  const getName = () => profile?.name || 'Aditi K.';
  const getInitials = () => getName().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className={styles.shell}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src="/clubsync-logo.jpg" alt="ClubSync" className={styles.brandMark} />
          <span>ClubSync</span>
          <span className={styles.brandTag}>OWNER</span>
        </div>
        
        <div className={styles.pulseStrip}>
          <div className={styles.pulseItem}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--own-green)' }}></span>
            All systems <b>nominal</b>
          </div>
          <div className={styles.pulseItem}><span>Colleges</span>&nbsp;<b>47</b></div>
          <div className={styles.pulseItem}><span>Active now</span>&nbsp;<b>18.4k</b></div>
        </div>

        <div className={styles.rightCluster}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 11px 5px 5px', border: '1px solid var(--own-owner-border)', borderRadius: 20, background: 'var(--own-owner-bg)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--own-accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
              {getInitials()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{getName()}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--own-owner)', letterSpacing: '0.04em' }}>PLATFORM OWNER</div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles.bodyGrid}>
        <aside className={styles.rail}>
          <div className={styles.railGroupLabel}>Overview</div>
          <NavLink to="/owner" end className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconGridDots size={15}/> <span>Global Analytics</span>
          </NavLink>

          <div className={styles.railGroupLabel}>Management</div>
          <NavLink to="/owner/colleges" className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconBuilding size={15}/> <span>Colleges</span>
          </NavLink>

          <div className={styles.railGroupLabel}>Trust & Safety</div>
          <NavLink to="/owner/moderation" className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconFlag size={15}/> <span>Moderation Queue</span>
            <span className={`${styles.countChip} ${styles.crit}`}>4</span>
          </NavLink>
          
          <div className={styles.railGroupLabel}>System</div>
          <div className={styles.railItem}>
            <IconShieldLock size={15}/> <span>Platform Health</span>
          </div>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
