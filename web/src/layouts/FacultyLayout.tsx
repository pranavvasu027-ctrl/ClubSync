import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { IconLayoutGrid, IconChecklist, IconReceipt2, IconUsers } from '@tabler/icons-react';
import styles from './FacultyLayout.module.css';
import { useAuth } from '../context/AuthContext';

const FacultyLayout: React.FC = () => {
  const { profile } = useAuth();
  
  const getName = () => profile?.name || 'Faculty Advisor';

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>CS</div>
          <span>ClubSync</span>
          <span className={styles.brandTag}>FACULTY</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, fontFamily: 'monospace', fontSize: 11, color: 'var(--fac-text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fac-green)' }}></span>
            Systems nominal
          </div>
        </div>

        <div className={styles.rightCluster}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 11px 5px 5px', border: '1px solid rgba(129,140,248,0.28)', borderRadius: 20, background: 'rgba(129,140,248,0.12)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fac-accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>FA</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{getName()}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#818CF8', letterSpacing: '0.04em' }}>FACULTY</div>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.bodyGrid}>
        <aside className={styles.rail}>
          <div className={styles.railLabel}>Overview</div>
          <NavLink to="/faculty" end className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconLayoutGrid size={15}/> <span>Dashboard</span>
          </NavLink>

          <div className={styles.railLabel}>Oversight</div>
          <NavLink to="/faculty/approvals" className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={15}/> <span>Approvals Queue</span>
          </NavLink>
          <NavLink to="/faculty/ledger" className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconReceipt2 size={15}/> <span>Club Ledger</span>
          </NavLink>
          
          <div className={styles.railLabel}>People</div>
          <NavLink to="/faculty/team" className={({isActive}) => `${styles.railItem} ${isActive ? styles.active : ''}`}>
            <IconUsers size={15}/> <span>Team Directory</span>
          </NavLink>
        </aside>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;
