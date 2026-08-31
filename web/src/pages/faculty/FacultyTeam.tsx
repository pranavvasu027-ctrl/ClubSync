import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';

const FacultyTeam: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Team Directory</h1>
          <div className={layoutStyles.sub}>Review club members and their designated roles.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14, background: 'var(--fac-panel)', border: '1px solid var(--fac-line)', borderRadius: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--fac-accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
              {getInitials(u.name || 'U')}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || 'Unknown'}</div>
              <div style={{ fontSize: 11, color: 'var(--fac-text-dim)', textTransform: 'capitalize' }}>{u.user_type}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default FacultyTeam;
