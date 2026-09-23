import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { IconNotebook, IconCalendarEvent, IconReceipt2, IconUserPlus, IconUsersGroup, IconFileText, IconSettings, IconSearch, IconBell, IconChevronRight } from '@tabler/icons-react';
import styles from './PresidentLayout.module.css';
import { useAuth } from '../context/AuthContext';

const PresidentLayout: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  
  const getName = () => profile?.name || 'President';
  const getInitials = () => getName().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getBreadcrumb = () => {
    if (location.pathname.includes('events')) return 'Events';
    if (location.pathname.includes('ledger')) return 'Ledger';
    if (location.pathname.includes('recruitment')) return 'Recruitment';
    if (location.pathname.includes('team')) return 'Team';
    return 'Desk Summary';
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.railClip}></div>
        <div className={styles.railTop}>
          <div className={styles.brand}>
            <img src="/clubsync-logo.jpg" alt="ClubSync" className={styles.brandMark} />
            <div className={styles.brandName}>The Desk</div>
          </div>
          <div className={styles.brandSub}>ClubSync Operations</div>
        </div>

        <div className={styles.deskTag}><span className={styles.dot}></span> Live session · AY 2026–27</div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Overview</div>
          <NavLink to="/president" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconNotebook size={17} /> Desk Summary
          </NavLink>

          <div className={styles.navLabel}>Operate</div>
          <NavLink to="/president/events" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={17} /> Events
          </NavLink>
          <NavLink to="/president/ledger" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconReceipt2 size={17} /> Ledger
          </NavLink>
          <NavLink to="/president/recruitment" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconUserPlus size={17} /> Recruitment
          </NavLink>

          <div className={styles.navLabel}>People</div>
          <NavLink to="/president/team" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconUsersGroup size={17} /> Team
          </NavLink>

          <div className={styles.navLabel}>System</div>
          <div className={styles.navItem}>
            <IconSettings size={17} /> Settings
          </div>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{getInitials()}</div>
            <div>
              <div className={styles.whoName}>{getName()}</div>
              <div className={styles.whoRole}>President</div>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <span>ClubSync</span><IconChevronRight size={13} />
            <span className={styles.current}>{getBreadcrumb()}</span>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn}><IconSearch size={16} /></button>
            <button className={styles.iconBtn}><IconBell size={16} /><span className={styles.ping}></span></button>
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
