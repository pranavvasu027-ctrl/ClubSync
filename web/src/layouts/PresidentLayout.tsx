import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { IconNotebook, IconCalendarEvent, IconSearch, IconBell, IconChevronRight } from '@tabler/icons-react';
import styles from './PresidentLayout.module.css';
import { useAuth } from '../context/AuthContext';

const PresidentLayout: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  
  const getName = () => profile?.name || 'Arnav Deshmukh';
  const getInitials = () => getName().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getBreadcrumb = () => {
    if (location.pathname.includes('/new-event')) return 'New Proposal';
    if (location.pathname.includes('/events')) return 'Events Desk';
    return 'Desk Summary';
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.railTop}>
          <div className={styles.brand}>
            <img src="/clubsync-logo.jpg" alt="ClubSync" className={styles.brandMark} />
            <div>
              <div className={styles.brandName}>President Desk</div>
              <div className={styles.brandSub}>Club Operations & Lead</div>
            </div>
          </div>
        </div>

        <div className={styles.deskTag}>
          <span className={styles.dot}></span> Executive Session · AY 2026–27
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Overview</div>
          <NavLink to="/president" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconNotebook size={17} /> Desk Summary
          </NavLink>

          <div className={styles.navLabel}>Event Governance</div>
          <NavLink to="/president/events" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={17} /> Events Desk
          </NavLink>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{getInitials()}</div>
            <div>
              <div className={styles.whoName}>{getName()}</div>
              <div className={styles.whoRole}>Club President</div>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <span>ClubSync</span>
            <IconChevronRight size={13} />
            <span className={styles.current}>{getBreadcrumb()}</span>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.search}>
              <IconSearch size={15} />
              <input type="text" placeholder="Search proposals, events..." />
            </div>
            <button className={styles.iconBtn} aria-label="Notifications">
              <IconBell size={16} />
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

export default PresidentLayout;
