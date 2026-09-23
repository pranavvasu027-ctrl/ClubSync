import React from 'react';
import { Link } from 'react-router-dom';
import styles from './FacultyDashboard.module.css';
import { IconStamp, IconBuildingCommunity, IconWallet, IconCertificate, IconClockExclamation, IconArrowUpRight, IconAlertTriangle, IconCode, IconBuilding, IconBulb, IconCheck, IconX } from '@tabler/icons-react';

const FacultyDashboard: React.FC = () => {
  const getDay = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Good morning, Advisor</div>
          <h1>Registrar's desk</h1>
          <p>5 proposals awaiting sign-off · 2 pending &gt;48hrs · ₹4.85L budget committed across 6 clubs this term</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--fac-ink-faint)' }}>{getDay()}</div>
          <div style={{ fontSize: 11, color: 'var(--fac-ink-faint)' }}>Academic Year 2026–27</div>
        </div>
      </div>

      <div className={styles.statRow}>
        <div className={`${styles.statCard} ${styles.cRed}`}>
          <div className={styles.statIcon}><IconStamp size={20} /></div>
          <div className={styles.statLabel}>Pending Approvals</div>
          <div className={styles.statValue}>05</div>
          <div className={`${styles.statFoot} ${styles.warn}`}><IconClockExclamation size={12}/> 2 breaching 48hr SLA</div>
        </div>
        <div className={`${styles.statCard} ${styles.cSapphire}`}>
          <div className={styles.statIcon}><IconBuildingCommunity size={20} /></div>
          <div className={styles.statLabel}>Clubs Under Purview</div>
          <div className={styles.statValue}>06</div>
          <div className={`${styles.statFoot} ${styles.flat}`}>No change since June</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGreen}`}>
          <div className={styles.statIcon}><IconWallet size={20} /></div>
          <div className={styles.statLabel}>Budget Committed</div>
          <div className={styles.statValue}>₹4.85L <span style={{ fontSize: 12, color: 'var(--fac-ink-faint)' }}>/ ₹8L</span></div>
          <div className={`${styles.statFoot} ${styles.up}`}><IconArrowUpRight size={12}/> 60.6% utilised</div>
        </div>
        <div className={`${styles.statCard} ${styles.cGold}`}>
          <div className={styles.statIcon}><IconCertificate size={20} /></div>
          <div className={styles.statLabel}>NAAC Readiness</div>
          <div className={styles.statValue}>84%</div>
          <div className={`${styles.statFoot} ${styles.warn}`}><IconAlertTriangle size={12}/> 2 metrics flagged</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div className={styles.panelTitle}>Needs your sign-off</div>
              <div className={styles.panelSub}>Ranked by time pending</div>
            </div>
            <Link to="/faculty/approvals" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>Open queue</Link>
          </div>
          <div className={styles.panelBody} style={{ padding: 0 }}>
            <div className={styles.approvalCard} style={{ padding: '14px 20px' }}>
              <div className={styles.approvalThumb}><IconCode size={18} /></div>
              <div className={styles.approvalMain}>
                <div className={styles.approvalTop}>
                  <div className={styles.approvalTitle}>Pune TechFest Grand Hackathon</div>
                  <span className={styles.slaFlag}><IconClockExclamation size={10} /> 61h pending</span>
                </div>
                <div className={styles.approvalMeta}>
                  <span><IconBuilding size={14} /> GedIT</span>
                  <span><IconWallet size={14} /> ₹1,20,000</span>
                </div>
              </div>
            </div>
            <div className={styles.approvalCard} style={{ padding: '14px 20px' }}>
              <div className={styles.approvalThumb}><IconBulb size={18} /></div>
              <div className={styles.approvalMain}>
                <div className={styles.approvalTop}>
                  <div className={styles.approvalTitle}>Earn & Sell 2026: Campus Bazaar</div>
                  <span className={styles.slaFlag}><IconClockExclamation size={10} /> 50h pending</span>
                </div>
                <div className={styles.approvalMeta}>
                  <span><IconBuilding size={14} /> EDC</span>
                  <span><IconWallet size={14} /> ₹85,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}><div className={styles.panelTitle}>Recent activity</div></div>
          <div className={styles.panelBody} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--fac-green-soft)', color: 'var(--fac-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}><IconCheck size={16} /></div>
              <div>
                <div style={{ fontSize: 12.3, fontWeight: 600, color: 'var(--fac-navy)' }}>Approved — Battle of the Bands (Mélange)</div>
                <div style={{ fontSize: 10.8, color: 'var(--fac-ink-faint)' }}>2 hours ago</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--fac-red-soft)', color: 'var(--fac-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}><IconX size={16} /></div>
              <div>
                <div style={{ fontSize: 12.3, fontWeight: 600, color: 'var(--fac-navy)' }}>Rejected — Goa Tech Trip (Robotics)</div>
                <div style={{ fontSize: 10.8, color: 'var(--fac-ink-faint)' }}>Yesterday, 4:15 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacultyDashboard;
