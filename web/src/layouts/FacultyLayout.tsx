import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  IconLayoutGrid, 
  IconChecklist, 
  IconCalendarEvent, 
  IconChevronRight, 
  IconSearch, 
  IconBell 
} from '@tabler/icons-react';
import styles from './FacultyLayout.module.css';
import { useAuth } from '../context/AuthContext';
import { eventStore } from '../services/eventStore';

const FacultyLayout: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState<number>(() => {
    return eventStore.getAllEvents().filter(e => e.status === 'under_review').length;
  });

  useEffect(() => {
    const handleUpdate = () => {
      setPendingCount(eventStore.getAllEvents().filter(e => e.status === 'under_review').length);
    };
    window.addEventListener('clubsync:event_updated', handleUpdate);
    return () => window.removeEventListener('clubsync:event_updated', handleUpdate);
  }, []);
  
  const getName = () => profile?.name || 'Dr. S. K. Kulkarni';
  const getInitials = () => getName().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getCrumb = () => {
    if (location.pathname.includes('/approvals')) return 'Proposal Queue';
    if (location.pathname.includes('/ledger')) return 'Event Ledger & Budgets';
    return 'Faculty Overview';
  };

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside className={styles.rail}>
        <div className={styles.railTop}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>FM</div>
            <div>
              <div className={styles.brandName}>Faculty Mentor</div>
              <div className={styles.brandSub}>Sanctions & Review Desk</div>
            </div>
          </div>
        </div>

        <div className={styles.facultyTag}>
          <span className={styles.dot}></span> Technical Clubs · AY 2026–27
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Dashboard</div>
          <NavLink to="/faculty" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconLayoutGrid size={18}/> Overview
          </NavLink>

          <div className={styles.navLabel}>Event Lifecycle</div>
          <NavLink to="/faculty/approvals" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={18}/> Proposal Queue {pendingCount > 0 && <span className={styles.nBadge}>{pendingCount}</span>}
          </NavLink>
          <NavLink to="/faculty/ledger" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={18}/> Event Ledger & Budgets
          </NavLink>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{getInitials()}</div>
            <div>
              <div className={styles.whoName}>{getName()}</div>
              <div className={styles.whoRole}>Faculty Advisor</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <span>ClubSync</span>
            <IconChevronRight size={13}/>
            <span>Faculty Registrar</span>
            <IconChevronRight size={13}/>
            <span className={styles.current}>{getCrumb()}</span>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.search}>
              <IconSearch size={15} />
              <input type="text" placeholder="Search proposals, venues..." />
            </div>
            <button className={styles.iconBtn} aria-label="Notifications">
              <IconBell size={16}/>
              <span className={styles.ping}></span>
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.wrap}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacultyLayout;
