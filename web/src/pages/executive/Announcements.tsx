import React, { useState } from 'react';
import styles from './Announcements.module.css';
import { useExec } from '../../context/ExecutiveContext';
import { IconEye, IconBold, IconItalic, IconH1, IconList, IconPhoto, IconLink, IconSend } from '@tabler/icons-react';

const Announcements: React.FC = () => {
  const { execData } = useExec();
  const [activeAudience, setActiveAudience] = useState('All Members');

  const audiences = ['All Members', 'Core Team', 'Coordinators', 'First Years'];

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>Announcement composer</h1>
          <p>Draft, target, and dispatch updates to your club.</p>
        </div>
        <button className={`${styles.btn} ${styles.btnLime}`}><IconEye size={16} /> Preview</button>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelBody}>
          <div className={styles.formGroup}>
            <input type="text" className={styles.formControl} placeholder="Announcement title" style={{ fontSize: 15, fontWeight: 700 }} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target audience</label>
            <div className={styles.chipRow}>
              {audiences.map(a => (
                <span 
                  key={a} 
                  className={`${styles.chip} ${activeAudience === a ? styles.active : ''}`}
                  onClick={() => setActiveAudience(a)}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Message</label>
            <div className={styles.composer}>
              <div className={styles.composerToolbar}>
                <button><IconBold size={16}/></button>
                <button><IconItalic size={16}/></button>
                <button><IconH1 size={16}/></button>
                <button><IconList size={16}/></button>
                <button><IconPhoto size={16}/></button>
                <button><IconLink size={16}/></button>
              </div>
              <div className={styles.composerBody} contentEditable suppressContentEditableWarning data-placeholder="Type your announcement here..."></div>
            </div>
          </div>

          <div className={styles.formGroup} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="radio" name="sched" defaultChecked /> Send now
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
              <input type="radio" name="sched" /> Schedule for later
            </label>
          </div>

          <button className={`${styles.btn} ${styles.btnLime}`} style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
            <IconSend size={18} /> Send announcement
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>Sent history</div>
        <div className={styles.panelBody} style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Audience</th><th>Sent</th><th>Delivered</th><th>Read</th><th>Open rate</th>
              </tr>
            </thead>
            <tbody>
              {execData.announcements.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.title}</strong></td>
                  <td>{a.audience}</td>
                  <td>{a.sentDate}</td>
                  <td>{a.delivered}</td>
                  <td>{a.read}</td>
                  <td style={{ color: 'var(--exec-lime)' }}>{a.openRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Announcements;
