import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IconHome, 
  IconPlus, 
  IconLayoutGrid, 
  IconUsersGroup, 
  IconUsers,
  IconLogout,
  IconChecklist,
  IconBriefcase
} from '@tabler/icons-react';
import styles from './AdminLayout.module.css';
import NotificationBell from '../components/NotificationBell';

const AdminLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('create-cycle')) return 'Create Cycle';
    if (location.pathname.includes('cycles')) return 'Manage Cycles';
    if (location.pathname.includes('team-formation')) return 'Team Formation';
    if (location.pathname.includes('members')) return 'Members Directory';
    return 'Dashboard';
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.brand}>
          <img src="/clubsync-logo.jpg" alt="ClubSync" className={styles.brandMark} />
          <div className={styles.brandName}>ClubSync Admin</div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/admin" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconHome size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/approvals" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={18} /> Event Approvals
          </NavLink>
          <NavLink to="/admin/finance" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconBriefcase size={18} /> Finance Audits
          </NavLink>
          <NavLink to="/admin/create-cycle" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconPlus size={18} /> Create Cycle
          </NavLink>
          <NavLink to="/admin/cycles" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconLayoutGrid size={18} /> Manage Cycles
          </NavLink>
          <NavLink to="/admin/team-formation" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconUsersGroup size={18} /> Team Formation
          </NavLink>
          <NavLink to="/admin/members" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconUsers size={18} /> Members Directory
          </NavLink>
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.who}>
            <div className={styles.whoAvatar}>{profile?.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <div className={styles.whoName}>{profile?.name}</div>
              <div className={styles.whoRole}>Administrator</div>
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
            <span>ClubSync Admin</span>
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

export default AdminLayout;
