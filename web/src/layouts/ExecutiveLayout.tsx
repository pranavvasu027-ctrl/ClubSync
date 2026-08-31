import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { IconRadar2, IconBroadcast, IconChecklist, IconCalendarBolt, IconUsersGroup, IconSettings, IconSearch, IconBell, IconSlash } from '@tabler/icons-react';
import styles from './ExecutiveLayout.module.css';
import { ExecProvider } from '../context/ExecutiveContext';

const ExecutiveLayout: React.FC = () => {
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('announcements')) return 'announcements';
    if (location.pathname.includes('tasks')) return 'tasks';
    if (location.pathname.includes('events')) return 'my-events';
    if (location.pathname.includes('team')) return 'team';
    return 'focus-board';
  };

  return (
    <ExecProvider>
      <div className={styles.shell}>
        <aside className={styles.rail}>
          <div className={styles.railTop}>
            <div className={styles.brand}>
              <div className={styles.brandMark}>G</div>
              <div className={styles.brandName}>Ops Desk</div>
            </div>
            <div className={styles.brandSub}>GedIT Technical Club</div>
            <div className={styles.statusStrip}><span className={styles.blip}></span> LIVE · AY 2026–27</div>
          </div>
          
          <nav className={styles.nav}>
            <div className={styles.navLabel}>Overview</div>
            <NavLink to="/executive" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconRadar2 size={16} /> Focus Board
            </NavLink>

            <div className={styles.navLabel}>Operate</div>
            <NavLink to="/executive/announcements" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconBroadcast size={16} /> Announcements
            </NavLink>
            <NavLink to="/executive/tasks" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconChecklist size={16} /> Tasks <span className={styles.navItemBadge}>15</span>
            </NavLink>
            <NavLink to="/executive/events" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconCalendarBolt size={16} /> My Events
            </NavLink>

            <div className={styles.navLabel}>People</div>
            <NavLink to="/executive/team" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconUsersGroup size={16} /> Team
            </NavLink>

            <div className={styles.navLabel}>System</div>
            <div className={styles.navItem}>
              <IconSettings size={16} /> Settings
            </div>
          </nav>

          <div className={styles.railBottom}>
            <div className={styles.who}>
              <div className={styles.whoAvatar}>AJ</div>
              <div>
                <div className={styles.whoName}>Arnav Joshi</div>
                <div className={styles.whoRole}>Tech Lead · Executive</div>
              </div>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.crumbs}>
              <span>clubsync</span><IconSlash size={12} />
              <span>gedit</span><IconSlash size={12} />
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
    </ExecProvider>
  );
};

export default ExecutiveLayout;
