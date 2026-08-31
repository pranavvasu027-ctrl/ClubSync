import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IconHome, 
  IconSearch, 
  IconChecklist, 
  IconCalendarEvent, 
  IconLogout 
} from '@tabler/icons-react';
import styles from './StudentLayout.module.css';
import NotificationBell from '../components/NotificationBell';

const StudentLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('openings')) return 'Browse Openings';
    if (location.pathname.includes('applications')) return 'My Applications';
    if (location.pathname.includes('interview')) return 'Interview Details';
    return 'Dashboard';
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>CS</div>
          <div className={styles.brandName}>ClubSync</div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/student" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconHome size={18} /> Dashboard
          </NavLink>
          <NavLink to="/student/openings" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconSearch size={18} /> Browse Openings
          </NavLink>
          <NavLink to="/student/applications" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={18} /> My Applications
          </NavLink>
          <NavLink to="/student/interview" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={18} /> Interview Details
          </NavLink>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{profile?.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div className={styles.whoName}>{profile?.name}</div>
              <div className={styles.whoRole}>Student</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={signOut}>
            <IconLogout size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <span>ClubSync</span>
            <span className={styles.crumbSep}>/</span>
            <span className={styles.current}>{getBreadcrumb()}</span>
          </div>
          <div className={styles.topbarRight}>
            <NotificationBell />
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

export default StudentLayout;
