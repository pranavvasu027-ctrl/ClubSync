import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './PresidentDashboard.module.css';
import { IconUserPlus } from '@tabler/icons-react';

const TeamDirectory: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) setUsers(data);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>People</div>
          <h1>Team &amp; permissions</h1>
          <p>Who holds what authority on the desk.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', cursor: 'pointer', background: 'var(--pres-red)', color: '#fff', boxShadow: '0 2px 0 #9C3620' }}>
          <IconUserPlus size={16}/> Invite member
        </button>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}><div className={styles.panelTitle}>Club hierarchy</div></div>
        <div className={styles.panelBody} style={{ alignItems: 'center', gap: 26, padding: '20px 0' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
            {/* President Node */}
            <div className={`${styles.orgNode} ${styles.top}`}>
              <div className={styles.avatarSm}>
                KP
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Kuldeep Patil</div>
              <div style={{ fontSize: 10.5, color: 'var(--pres-ink-faint)' }}>President</div>
            </div>

            <div style={{ width: 1.5, height: 22, background: 'var(--pres-rule-strong)' }}></div>

            {/* Sub Nodes */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {users.filter(u => u.user_type !== 'president').map(u => (
                <div key={u.id} className={styles.orgNode}>
                  <div className={styles.avatarSm}>
                    {getInitials(u.name || 'User')}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{u.name || 'Unknown'}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--pres-ink-faint)' }}>{u.user_type}</div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      <div className={styles.teamGrid}>
        {users.filter(u => u.user_type !== 'president').map((u, i) => {
          const colors = ['var(--pres-navy)', 'var(--pres-amber)', 'var(--pres-green)', 'var(--pres-red)'];
          const color = colors[i % colors.length];
          return (
            <div key={u.id} className={styles.teamCard}>
              <div className={styles.avatarMd} style={{ background: color }}>{getInitials(u.name || 'U')}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: 'var(--pres-ink-faint)' }}>{u.user_type}</div>
              </div>
              <span className={styles.badgeActive}>Active</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TeamDirectory;
