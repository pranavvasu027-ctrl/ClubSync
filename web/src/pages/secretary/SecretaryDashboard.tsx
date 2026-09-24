import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SecretaryDashboard.module.css';
import { IconFileText, IconPhoto, IconEye, IconClockHour4, IconCalendarEvent, IconArrowUpRight, IconEdit, IconCalendar } from '@tabler/icons-react';

const SecretaryDashboard: React.FC = () => {
  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good afternoon, secretary</div>
          <h1>Priya's desk</h1>
          <p>6 pages updated this week · 24 media files uploaded · 3 pending reviews</p>
        </div>
        <div className={styles.heroDate}>
          <strong>{getDay()}</strong>
          Academic Year 2026–27
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={`${styles.statCard} ${styles.cAmber}`}>
          <div className={styles.statIcon}><IconFileText size={20} /></div>
          <div className={styles.statLabel}>Pages Updated</div>
          <div className={styles.statValue}>06</div>
          <div className={`${styles.statFoot} ${styles.up}`}><IconArrowUpRight size={12}/> +2 this week</div>
        </div>
        <div className={`${styles.statCard} ${styles.cBlue}`}>
          <div className={styles.statIcon}><IconPhoto size={20} /></div>
          <div className={styles.statLabel}>Media Uploaded</div>
          <div className={styles.statValue}>24</div>
          <div className={styles.statFoot} style={{ color: 'var(--sec-ink-faint)' }}>All formats</div>
        </div>
        <div className={`${styles.statCard} ${styles.cCoral}`}>
          <div className={styles.statIcon}><IconEye size={20} /></div>
          <div className={styles.statLabel}>Pending Reviews</div>
          <div className={styles.statValue}>03</div>
          <div className={`${styles.statFoot} ${styles.warn}`}><IconClock size={12}/> Awaiting president</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGreen}`}>
          <div className={styles.statIcon}><IconCalendarEvent size={20} /></div>
          <div className={styles.statLabel}>Calendar Items</div>
          <div className={styles.statValue}>12</div>
          <div className={`${styles.statFoot} ${styles.up}`}><IconArrowUpRight size={12}/> This month</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Quick edit club page</div>
              <div className={styles.panelSub}>Jump straight into the block editor</div>
            </div>
            <Link to="/secretary/editor" className={`${styles.btn} ${styles.btnStamp}`}><IconEdit size={16}/> Open editor</Link>
          </div>
          <div className={styles.panelBody} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--sec-paper-deep)', borderRadius: 9 }}>
              <div style={{ width: 44, height: 44, borderRadius: 9, background: 'var(--sec-amber-soft)', color: 'var(--sec-amber-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconPhoto size={20}/></div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Uploaded 'hackathon_poster_v3.png'</div>
                <div style={{ fontSize: 11, color: 'var(--sec-ink-faint)' }}>2 hours ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--sec-paper-deep)', borderRadius: 9 }}>
              <div style={{ width: 44, height: 44, borderRadius: 9, background: 'var(--sec-blue-soft)', color: 'var(--sec-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconFileText size={20}/></div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Updated Club Page — Achievements Section</div>
                <div style={{ fontSize: 11, color: 'var(--sec-ink-faint)' }}>Yesterday at 4:15 PM</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--sec-paper-deep)', borderRadius: 9 }}>
              <div style={{ width: 44, height: 44, borderRadius: 9, background: 'var(--sec-green-soft)', color: 'var(--sec-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCalendarEvent size={20}/></div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Added 'Team Meeting' to Content Calendar</div>
                <div style={{ fontSize: 11, color: 'var(--sec-ink-faint)' }}>Aug 20 at 10:00 AM</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}><div className={styles.panelTitle}>Activity log</div></div>
          <div className={styles.panelBody}>
            <div className={styles.timeline}>
              <div className={styles.tItem}>
                <div className={styles.tDot} style={{ background: 'var(--sec-amber-deep)' }}><IconPhoto size={12}/></div>
                <div className={styles.tTime}>2 hours ago</div>
                <div className={styles.tText}>Uploaded <strong>hackathon_poster_v3.png</strong></div>
              </div>
              <div className={styles.tItem}>
                <div className={styles.tDot} style={{ background: 'var(--sec-blue)' }}><IconFileText size={12}/></div>
                <div className={styles.tTime}>Yesterday, 4:15 PM</div>
                <div className={styles.tText}>Updated <strong>Achievements</strong> section</div>
              </div>
              <div className={styles.tItem}>
                <div className={styles.tDot} style={{ background: 'var(--sec-green)' }}><IconCalendar size={12}/></div>
                <div className={styles.tTime}>Aug 20, 10:00 AM</div>
                <div className={styles.tText}>Added <strong>Team Meeting</strong> to calendar</div>
              </div>
              <div className={styles.tItem}>
                <div className={styles.tDot} style={{ background: 'var(--sec-coral)' }}><IconReport size={12}/></div>
                <div className={styles.tTime}>Aug 18, 5:30 PM</div>
                <div className={styles.tText}>Submitted <strong>Week 3</strong> progress report</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecretaryDashboard;
