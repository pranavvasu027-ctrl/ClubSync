import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IconHome, 
  IconChecklist, 
  IconLayoutKanban, 
  IconCalendarEvent, 
  IconTrophy,
  IconCircleCheck,
  IconLogout 
} from '@tabler/icons-react';
import styles from './RecruiterLayout.module.css';
import NotificationBell from '../components/NotificationBell';

const RecruiterLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('applications')) return 'Applications';
    if (location.pathname.includes('shortlisting')) return 'Shortlisting';
    if (location.pathname.includes('interviews')) return 'Interviews';
    if (location.pathname.includes('evaluations')) return 'Evaluations';
    if (location.pathname.includes('results')) return 'Results';
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
          <NavLink to="/recruiter" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconHome size={18} /> Dashboard
          </NavLink>
          <NavLink to="/recruiter/applications" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={18} /> Applications
          </NavLink>
          <NavLink to="/recruiter/shortlisting" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconLayoutKanban size={18} /> Shortlisting
          </NavLink>
          <NavLink to="/recruiter/interviews" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={18} /> Interviews
          </NavLink>
          <NavLink to="/recruiter/evaluations" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconTrophy size={18} /> Evaluations
          </NavLink>
          <NavLink to="/recruiter/results" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCircleCheck size={18} /> Results
          </NavLink>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{profile?.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div className={styles.whoName}>{profile?.name}</div>
              <div className={styles.whoRole}>Recruiter</div>
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

export default RecruiterLayout;
