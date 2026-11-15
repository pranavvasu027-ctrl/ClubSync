import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ClubLedgerTxn } from '../../types/clubData';
import styles from './FacultyDashboard.module.css';
import layoutStyles from '../../layouts/FacultyLayout.module.css';
import { IconArrowDownLeft, IconArrowUpRight } from '@tabler/icons-react';

const FacultyLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<ClubLedgerTxn[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('club_ledger').select('*').order('txn_date', { ascending: false });
    if (data) setTransactions(data);
  };

  const income = transactions.filter(t => t.type === 'in').reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'out').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expenses;

  return (
    <>
      <div className={layoutStyles.viewHeader}>
        <div>
          <h1>Club Ledger</h1>
          <div className={layoutStyles.sub}>Read-only oversight of club finances and transactions.</div>
        </div>
      </div>

      <div className={styles.statGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Income</div>
          <div className={styles.statValue} style={{ color: 'var(--green)' }}>₹{income.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Expenses</div>
          <div className={styles.statValue} style={{ color: 'var(--red)' }}>₹{expenses.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Balance on hand</div>
          <div className={styles.statValue} style={{ color: 'var(--blue)' }}>₹{balance.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelTitle}>Transaction History</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {transactions.map(txn => (
            <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, background: txn.type === 'in' ? 'var(--green-soft)' : 'var(--red-soft)', color: txn.type === 'in' ? 'var(--green)' : 'var(--red)' }}>
                {txn.type === 'in' ? <IconArrowDownLeft size={16}/> : <IconArrowUpRight size={16}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{txn.description}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(txn.txn_date).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0, color: txn.type === 'in' ? 'var(--green)' : 'var(--red)' }}>
                {txn.type === 'in' ? '+' : '−'} ₹{txn.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FacultyLedger;
