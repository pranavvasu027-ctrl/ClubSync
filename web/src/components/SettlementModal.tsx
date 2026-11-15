import React, { useState } from 'react';
import { IconReceipt2, IconCheck, IconX, IconAlertTriangle, IconFileText } from '@tabler/icons-react';
import { eventStore } from '../services/eventStore';
import type { EventRecord } from '../services/eventStore';

interface SettlementModalProps {
  event: EventRecord | null;
  onClose: () => void;
  onSettled: () => void;
}

export default function SettlementModal({ event, onClose, onSettled }: SettlementModalProps) {
  const [actualExpenditure, setActualExpenditure] = useState<number>(event?.budget?.expenditure || 0);
  const [invoicesCount, setInvoicesCount] = useState<number>(3);
  const [summaryNotes, setSummaryNotes] = useState<string>('All speaker honorariums, refreshments, and stage setup invoices audited with GST receipts.');
  const [overrunJustification, setOverrunJustification] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!event) return null;

  const sanctionedAmount = event.budget?.expenditure || 0;
  const surplusDeficit = sanctionedAmount - actualExpenditure;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (actualExpenditure < 0) {
      setError('Actual expenditure cannot be negative.');
      return;
    }

    if (actualExpenditure > sanctionedAmount) {
      if (!overrunJustification.trim() || overrunJustification.trim().length < 15) {
        setError('BUDGET OVERRUN DETECTED: Actual expenditure exceeds sanctioned budget cap. Institutional compliance requires a detailed justification note (minimum 15 characters).');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await eventStore.submitFinancialSettlement(
        event.event_id,
        actualExpenditure,
        invoicesCount,
        summaryNotes,
        actualExpenditure > sanctionedAmount ? overrunJustification.trim() : undefined
      );

      if (res.success) {
        onSettled();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Settlement submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={styles.iconCircle}>
              <IconReceipt2 size={22} color="#fff" />
            </span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Post-Event Financial Bill Settlement
              </h2>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {event.title} · {event.club_name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <IconX size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#991b1b', padding: '10px 14px', borderRadius: 8, margin: '14px 0 6px', fontSize: 12.5 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          {/* Budget Comparison Matrix */}
          <div style={styles.matrix}>
            <div style={styles.matrixBox}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sanctioned Cap</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                ₹{sanctionedAmount.toLocaleString()}
              </div>
              <small style={{ color: '#64748b' }}>Approved by Faculty</small>
            </div>

            <div style={styles.matrixBox}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Actual Spent</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: actualExpenditure > sanctionedAmount ? '#dc2626' : '#16a34a', marginTop: 2 }}>
                ₹{actualExpenditure.toLocaleString()}
              </div>
              <small style={{ color: actualExpenditure > sanctionedAmount ? '#dc2626' : '#16a34a' }}>
                {surplusDeficit >= 0 ? `₹${surplusDeficit.toLocaleString()} Surplus` : `₹${Math.abs(surplusDeficit).toLocaleString()} Over Budget`}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '16px 0' }}>
            <div>
              <label style={styles.label}>Actual Total Expenditure (₹) *</label>
              <input 
                type="number"
                value={actualExpenditure}
                onChange={e => setActualExpenditure(Number(e.target.value))}
                style={styles.input}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Number of Verified GST Invoices Attached *</label>
              <input 
                type="number"
                value={invoicesCount}
                onChange={e => setInvoicesCount(Number(e.target.value))}
                style={styles.input}
                min={1}
                required
              />
            </div>

            <div>
              <label style={styles.label}>Settlement Summary & Auditor Notes</label>
              <textarea 
                value={summaryNotes}
                onChange={e => setSummaryNotes(e.target.value)}
                rows={3}
                style={styles.textarea}
                required
              />
            </div>

            {actualExpenditure > sanctionedAmount && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 8, padding: 12 }}>
                <div style={{ color: '#991b1b', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <IconAlertTriangle size={16} color="#dc2626" />
                  <span>Deficit Warning: Spent ₹{(actualExpenditure - sanctionedAmount).toLocaleString()} above sanctioned budget</span>
                </div>
                <label style={{ ...styles.label, color: '#991b1b', marginBottom: 4 }}>
                  Mandatory Overrun Justification * (Min 15 chars)
                </label>
                <textarea 
                  value={overrunJustification}
                  onChange={e => setOverrunJustification(e.target.value)}
                  rows={2}
                  placeholder="Explain why expenditure exceeded sanctioned amount (e.g. additional technical equipment, guest travel expenses)..."
                  style={{ ...styles.textarea, borderColor: '#f87171' }}
                  required
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              <IconCheck size={16} /> {loading ? 'Auditing...' : 'Submit Settlement & Close Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 99999,
    padding: 16
  },
  card: {
    background: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 520,
    padding: 24,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e2e8f0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 14
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#16a34a',
    display: 'grid',
    placeItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: 4
  },
  matrix: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    background: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    border: '1px solid #e2e8f0'
  },
  matrixBox: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 5
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13.5,
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  cancelBtn: {
    padding: '9px 16px',
    background: 'none',
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 18px',
    background: '#16a34a',
    border: 'none',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer'
  }
};
