import React from 'react';
import styles from './MyEvents.module.css';
import { useExec } from '../../context/ExecutiveContext';
import { IconCalendar, IconMapPin } from '@tabler/icons-react';

const MyEvents: React.FC = () => {
  const { execData } = useExec();

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>My assigned events</h1>
          <p>Events where you hold an active operational role.</p>
        </div>
      </div>

      <div className={styles.eventGrid}>
        {execData.events.map(ev => {
          const percent = (ev.registrations / ev.capacity) * 100;
          return (
            <div className={styles.eventCard} key={ev.id}>
              <div className={styles.eventAccent} style={{ background: `linear-gradient(90deg, ${ev.colors[0]}, ${ev.colors[1]})` }}></div>
              <div className={styles.eventTitle}>{ev.title}</div>
              <div className={styles.eventMeta}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconCalendar size={12} /> {ev.date}</span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconMapPin size={12} /> {ev.location}</span>
              </div>
              <div className={styles.eventProgressLabel}>
                <span>Registrations</span>
                <span>{ev.registrations} / {ev.capacity}</span>
              </div>
              <div className={styles.miniTrack}>
                <div className={styles.miniFill} style={{ width: `${percent}%`, background: ev.colors[0] }}></div>
              </div>
              <div className={styles.eventFoot}>
                <span className={styles.rolePill}>{ev.role}</span>
                <span className={styles.countdownPill}>{ev.countdown}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MyEvents;
