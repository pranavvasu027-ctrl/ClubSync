import React, { useEffect, useState } from 'react';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { supabase } from '../../lib/supabase';
import { IconChecklist, IconReceipt2, IconCalendarEvent, IconUsers } from '@tabler/icons-react';

const FacultyDashboard: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const totalBudget = 800000;

  useEffect(() => {
    const fetchData = async () => {
      const { count } = await supabase.from('club_events').select('*', { count: 'exact' }).eq('status', 'pending');
      if (count !== null) setPendingEvents(count);

      const { data: ledgerOut } = await supabase.from('club_ledger').select('amount').eq('type', 'out');
      const spent = ledgerOut?.reduce((acc, row) => acc + row.amount, 0) || 0;
      setTotalSpent(spent);
    };
    fetchData();
  }, []);

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1><span style={{ background: 'var(--fac-accent-grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Faculty Oversight</span></h1>
          <div className={layoutStyles.sub}>High-level view of club operations & pending actions.</div>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconChecklist size={16}/> Pending Approvals</div>
          <div className={styles.statValue}>{pendingEvents}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconReceipt2 size={16}/> Budget Consumed</div>
          <div className={styles.statValue}>₹{(totalSpent/100000).toFixed(2)}L</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconCalendarEvent size={16}/> Active Events</div>
          <div className={styles.statValue}>3</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}><IconUsers size={16}/> Active Members</div>
          <div className={styles.statValue}>42</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Action Required</div>
          {pendingEvents > 0 ? (
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--fac-line)', display: 'flex', gap: 10 }}>
              <span className={`${styles.pill} ${styles.pillWarn}`}><span className={styles.dot}></span>Pending</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>There are {pendingEvents} event(s) waiting for your approval.</div>
                <div style={{ color: 'var(--fac-text-dim)', fontSize: 12 }}>Check the Approvals queue to review proposals and budgets.</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--fac-text-dim)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>You're all caught up!</div>
          )}
        </div>
      </div>
    </>
  );
};

export default FacultyDashboard;
