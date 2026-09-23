import React from 'react';
import styles from './SecretaryDashboard.module.css';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';

const ContentCalendar: React.FC = () => {
  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--sec-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>Publish</div>
          <h1>Content calendar</h1>
          <p>Every post, deadline and meeting, dated and color-coded.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--sec-paper-deep)', border: '1px solid var(--sec-rule)', borderRadius: 8, padding: 3, gap: 2 }}>
            <button className={`${styles.btn} ${styles.btnSm}`} style={{ background: 'var(--sec-card)', color: 'var(--sec-ink)', padding: '6px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <IconChevronLeft size={16}/>
            </button>
            <span style={{ padding: '6px 12px', fontWeight: 700, fontSize: 12.5 }}>August 2026</span>
            <button className={`${styles.btn} ${styles.btnSm}`} style={{ background: 'transparent', padding: '6px 10px', color: 'var(--sec-ink-soft)' }}>
              <IconChevronRight size={16}/>
            </button>
          </div>
          <button className={`${styles.btn} ${styles.btnStamp}`}>
            <IconPlus size={16}/> Add item
          </button>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--sec-blue)' }}></span> Social Post</div>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--sec-coral)' }}></span> Event</div>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--sec-amber-deep)' }}></span> Deadline</div>
        <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: 'var(--sec-green)' }}></span> Meeting</div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelBody}>
          <div className={styles.calGrid}>
            <div className={styles.calHead}>Sun</div>
            <div className={styles.calHead}>Mon</div>
            <div className={styles.calHead}>Tue</div>
            <div className={styles.calHead}>Wed</div>
            <div className={styles.calHead}>Thu</div>
            <div className={styles.calHead}>Fri</div>
            <div className={styles.calHead}>Sat</div>

            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>26</div></div>
            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>27</div></div>
            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>28</div></div>
            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>29</div></div>
            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>30</div></div>
            <div className={`${styles.calCell} ${styles.other}`}><div className={styles.calDate}>31</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>1</div></div>

            <div className={styles.calCell}><div className={styles.calDate}>2</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>3</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>4</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>5</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>6</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>7</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>8</div></div>

            <div className={styles.calCell}><div className={styles.calDate}>9</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>10</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>11</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>12</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>13</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>14</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>15</div></div>

            <div className={styles.calCell}><div className={styles.calDate}>16</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>17</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>18</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>19</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>20</div></div>
            <div className={styles.calCell}><div className={styles.calDate}>21</div></div>
            <div className={styles.calCell}>
              <div className={styles.calDate}>22</div>
              <div className={`${styles.calPill} ${styles.pillSocial}`}>IG: Hackathon Teaser</div>
            </div>

            <div className={styles.calCell}><div className={styles.calDate}>23</div></div>
            <div className={`${styles.calCell} ${styles.today}`}>
              <div className={styles.calDate}>24</div>
              <div className={`${styles.calPill} ${styles.pillDeadline}`}>Review poster designs</div>
            </div>
            <div className={styles.calCell}>
              <div className={styles.calDate}>25</div>
              <div className={`${styles.calPill} ${styles.pillMeeting}`}>Team Meeting</div>
            </div>
            <div className={styles.calCell}>
              <div className={styles.calDate}>26</div>
              <div className={`${styles.calPill} ${styles.pillSocial}`}>LinkedIn: Club Spotlight</div>
            </div>
            <div className={styles.calCell}><div className={styles.calDate}>27</div></div>
            <div className={styles.calCell}>
              <div className={styles.calDate}>28</div>
              <div className={`${styles.calPill} ${styles.pillEvent}`}>Pune TechFest Hackathon</div>
            </div>
            <div className={styles.calCell}><div className={styles.calDate}>29</div></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentCalendar;
