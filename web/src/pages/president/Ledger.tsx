import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ClubLedgerTxn } from '../../types/clubData';
import styles from './PresidentDashboard.module.css';
import { IconPlus, IconArrowDownLeft, IconArrowUpRight } from '@tabler/icons-react';

const Ledger: React.FC = () => {
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

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className={styles.hero} style={{ borderBottom: '2px solid var(--pres-ink)' }}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>The ledger</h1>
          <p>Every rupee, dated and accounted for.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', cursor: 'pointer', background: 'var(--pres-red)', color: '#fff', boxShadow: '0 2px 0 #9C3620' }}>
          <IconPlus size={16}/> Log transaction
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 16, background: 'var(--pres-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--pres-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Total income</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--pres-green)' }}>₹{income.toLocaleString()}</div>
        </div>
        <div style={{ border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 16, background: 'var(--pres-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--pres-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Total expenses</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--pres-red)' }}>₹{expenses.toLocaleString()}</div>
        </div>
        <div style={{ border: '1px solid var(--pres-rule)', borderRadius: 9, padding: 16, background: 'var(--pres-card)' }}>
          <div style={{ fontSize: 11, color: 'var(--pres-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>Balance on hand</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--pres-navy)' }}>₹{balance.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}><div className={styles.panelTitle}>Recent transactions</div></div>
        <div className={styles.panelBody}>
          {transactions.map(txn => (
            <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--pres-rule)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15, background: txn.type === 'in' ? 'var(--pres-green-soft)' : 'var(--pres-red-soft)', color: txn.type === 'in' ? 'var(--pres-green)' : 'var(--pres-red)' }}>
                {txn.type === 'in' ? <IconArrowDownLeft size={16}/> : <IconArrowUpRight size={16}/>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{txn.description}</div>
                <div style={{ fontSize: 11, color: 'var(--pres-ink-faint)' }}>{formatDate(txn.txn_date)}</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13.5, flexShrink: 0, color: txn.type === 'in' ? 'var(--pres-green)' : 'var(--pres-red)' }}>
                {txn.type === 'in' ? '+' : '−'} ₹{txn.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Ledger;
