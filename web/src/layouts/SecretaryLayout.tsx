import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { IconNotebook, IconEdit, IconCalendarEvent, IconPhoto, IconFileText, IconSettings, IconSearch, IconBell, IconChevronRight } from '@tabler/icons-react';
import styles from './SecretaryLayout.module.css';
import { ClubProvider } from '../context/ClubContext';

const SecretaryLayout: React.FC = () => {
  const location = useLocation();

  const getBreadcrumb = () => {
    if (location.pathname.includes('editor')) return 'Page Editor';
    if (location.pathname.includes('calendar')) return 'Content Calendar';
    if (location.pathname.includes('media')) return 'Media Library';
    if (location.pathname.includes('reports')) return 'Progress Reports';
    return 'Desk Summary';
  };

  return (
    <ClubProvider>
      <div className={styles.shell}>
        <aside className={styles.rail}>
          <div className={styles.railClip}></div>
          <div className={styles.railTop}>
            <div className={styles.brand}>
              <div className={styles.brandMark}>G</div>
              <div className={styles.brandName}>The Desk</div>
            </div>
            <div className={styles.brandSub}>GedIT Technical Club</div>
          </div>
          
          <div className={styles.deskTag}><span className={styles.dot}></span> Live session · AY 2026–27</div>

          <nav className={styles.nav}>
            <div className={styles.navLabel}>Overview</div>
            <NavLink to="/secretary" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconNotebook size={18} /> Desk Summary
            </NavLink>

            <div className={styles.navLabel}>Publish</div>
            <NavLink to="/secretary/editor" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconEdit size={18} /> Page Editor
            </NavLink>
            <NavLink to="/secretary/calendar" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconCalendarEvent size={18} /> Content Calendar
            </NavLink>
            <NavLink to="/secretary/media" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconPhoto size={18} /> Media Library <span className={styles.navItemBadge}>16</span>
            </NavLink>

            <div className={styles.navLabel}>Report In</div>
            <NavLink to="/secretary/reports" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <IconFileText size={18} /> Progress Reports
            </NavLink>

            <div className={styles.navLabel}>System</div>
            <div className={styles.navItem}>
              <IconSettings size={18} /> Settings
            </div>
          </nav>

          <div className={styles.railBottom}>
            <div className={styles.who}>
              <div className={styles.whoAvatar}>PS</div>
              <div>
                <div className={styles.whoName}>Priya Sharma</div>
                <div className={styles.whoRole}>Secretary</div>
              </div>
            </div>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.crumbs}>
              <span>ClubSync</span><IconChevronRight size={14} />
              <span>GedIT Technical Club</span><IconChevronRight size={14} />
              <span className={styles.current}>{getBreadcrumb()}</span>
            </div>
            <div className={styles.topbarRight}>
              <button className={styles.iconBtn}><IconSearch size={18} /></button>
              <button className={styles.iconBtn}><IconBell size={18} /><span className={styles.ping}></span></button>
            </div>
          </header>

          <div className={styles.content}>
            <div className={styles.wrap}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </ClubProvider>
  );
};

export default SecretaryLayout;
