import React from 'react';
import { Link } from 'react-router-dom';
import styles from './FocusBoard.module.css';
import { IconBroadcast, IconCircleCheck, IconCalendarEvent, IconArrowUpRight } from '@tabler/icons-react';

const FocusBoard: React.FC = () => {
  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good morning, executive</div>
          <h1>Arnav's focus board</h1>
          <p>3 tasks due today · 4 events under your ownership · 12 announcements sent this month</p>
        </div>
      </div>
      
      <div className={styles.statRow}>
        <div className={`${styles.statCard} ${styles.c1}`}>
          <div className={styles.statIcon}><IconBroadcast size={20}/></div>
          <div className={styles.statLabel}>Announcements Sent</div>
          <div className={styles.statValue}>12</div>
          <div className={styles.statFoot}><IconArrowUpRight size={12}/> +4 this week</div>
        </div>
        <div className={`${styles.statCard} ${styles.c2}`}>
          <div className={styles.statIcon}><IconCircleCheck size={20}/></div>
          <div className={styles.statLabel}>Tasks Completed</div>
          <div className={styles.statValue}>8 <span style={{ fontSize: 14, color: 'var(--exec-text-faint)' }}>/ 15</span></div>
          <div className={styles.miniTrack}>
            <div className={styles.miniFill} style={{ width: '53%', background: 'var(--exec-sky)' }}></div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.c3}`}>
          <div className={styles.statIcon}><IconCalendarEvent size={20}/></div>
          <div className={styles.statLabel}>Upcoming Events</div>
          <div className={styles.statValue}>3</div>
          <div className={styles.statFoot} style={{ color: 'var(--exec-amber)' }}>Next: Pune TechFest Hackathon</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelTitle}>Your focus today</div>
            <div className={styles.panelSub}>Pulled from the task board, ranked by priority</div>
          </div>
          <Link to="/executive/tasks" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>Open task board</Link>
        </div>
        <div className={styles.panelBody} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className={`${styles.kcard} ${styles.pHigh}`} style={{ cursor: 'default' }}>
            <div className={styles.kcardTitle}>Review hackathon poster designs</div>
            <div className={styles.kcardFoot}><span className={styles.kcardTag}>Due today</span><div className={styles.kcardAvatar}>SK</div></div>
          </div>
          <div className={`${styles.kcard} ${styles.pMid}`} style={{ cursor: 'default' }}>
            <div className={styles.kcardTitle}>Update event registration page</div>
            <div className={styles.kcardFoot}><span className={styles.kcardTag}>Due tomorrow</span><div className={styles.kcardAvatar}>AP</div></div>
          </div>
          <div className={`${styles.kcard} ${styles.pLow}`} style={{ cursor: 'default' }}>
            <div className={styles.kcardTitle}>Send weekly team update</div>
            <div className={styles.kcardFoot}><span className={styles.kcardTag}>Due in 2 days</span><div className={styles.kcardAvatar}>AJ</div></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FocusBoard;
