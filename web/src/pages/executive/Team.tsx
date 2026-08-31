import React from 'react';
import styles from './Team.module.css';
import { useExec } from '../../context/ExecutiveContext';

const Team: React.FC = () => {
  const { execData } = useExec();

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>People</div>
          <h1>Team directory</h1>
          <p>Coordinate with your core team and committee members.</p>
        </div>
      </div>

      <div className={styles.teamGrid}>
        {execData.team.map(member => (
          <div className={styles.teamCard} key={member.id}>
            <div className={styles.teamAvatar} style={{ background: member.color }}>
              {member.initials}
              <span className={`${styles.teamStatus} ${member.status === 'on' ? styles.statusOn : styles.statusOff}`}></span>
            </div>
            <div className={styles.teamName}>{member.name}</div>
            <div className={styles.teamRole}>{member.role}</div>
            <div className={styles.teamTask}>{member.task}</div>
            <button className={styles.btnGhost}>Assign task</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default Team;
