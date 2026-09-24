import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { IconLayoutGrid, IconChecklist, IconCalendarEvent, IconArrowUpRight, IconFileText, IconUserPlus, IconUsers, IconAlertTriangle, IconReceipt2, IconSearch, IconBell, IconChevronRight } from '@tabler/icons-react';
import styles from './FacultyLayout.module.css';
import { useAuth } from '../context/AuthContext';

const FacultyLayout: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  
  const getName = () => profile?.name || 'Prof. Pankaj Kunekar';
  const getInitials = () => getName().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getCrumb = () => {
    if (location.pathname.includes('/approvals')) return 'Proposal Queue';
    if (location.pathname.includes('/ledger')) return 'Club Ledger';
    if (location.pathname.includes('/team')) return 'Team Directory';
    return 'Overview';
  };

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside className={styles.rail}>
        <div className={styles.railTop}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>R</div>
            <div className={styles.brandName}>Registrar</div>
          </div>
          <div className={styles.brandSub}>Faculty Advisor Desk</div>
        </div>

        <div className={styles.facultyTag}>
          <span className={styles.dot}></span> 6 clubs under purview · AY 2026–27
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Overview</div>
          <NavLink to="/faculty" end className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconLayoutGrid size={18}/> Overview
          </NavLink>

          <div className={styles.navLabel}>Approvals</div>
          <NavLink to="/faculty/approvals" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconChecklist size={18}/> Proposal Queue <span className={styles.nBadge}>5</span>
          </NavLink>
          {/* We link events to the same place for now, or just stub it */}
          <NavLink to="/faculty/ledger" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconCalendarEvent size={18}/> All Events
          </NavLink>

          <div className={styles.navLabel}>Planning</div>
          <div className={styles.navItem}><IconArrowUpRight size={18}/> Event Planner</div>
          <div className={styles.navItem}><IconFileText size={18}/> Progress Reports</div>

          <div className={styles.navLabel}>People</div>
          <NavLink to="/faculty/team" className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            <IconUserPlus size={18}/> Recruitment
          </NavLink>
          <div className={styles.navItem}><IconUsers size={18}/> Club Hierarchy</div>
          <div className={styles.navItem}><IconCalendarEvent size={18}/> Mentorship</div>

          <div className={styles.navLabel}>Compliance</div>
          <div className={styles.navItem}><IconAlertTriangle size={18}/> Analytics</div>
          <div className={styles.navItem}><IconReceipt2 size={18}/> NAAC / NBA Reports</div>
          <div className={styles.navItem}><IconArrowUpRight size={18}/> Activity Log</div>
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
            <span>ClubSync</span><IconChevronRight size={13}/>
            <span>Faculty Registrar</span><IconChevronRight size={13}/>
            <span className={styles.current}>{getCrumb()}</span>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} style={{ display: 'none' }}><IconSearch size={16}/></button>
            <button className={styles.iconBtn}><IconSearch size={16}/></button>
            <button className={styles.iconBtn}><IconBell size={16}/><span className={styles.ping}></span></button>
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
