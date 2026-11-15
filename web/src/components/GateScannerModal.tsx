import React, { useState } from 'react';
import { IconQrcode, IconCheck, IconX, IconAlertTriangle, IconUsers } from '@tabler/icons-react';
import { eventStore } from '../services/eventStore';
import type { EventRecord } from '../services/eventStore';

interface GateScannerModalProps {
  event: EventRecord | null;
  onClose: () => void;
}

export default function GateScannerModal({ event, onClose }: GateScannerModalProps) {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    valid: boolean;
    status: 'ATTENDED' | 'ALREADY_USED' | 'CANCELLED' | 'INVALID' | 'IDLE';
    attendee_name?: string;
    message: string;
    scanned_at?: string;
  }>({
    valid: false,
    status: 'IDLE',
    message: 'Enter or scan an attendee pass token below.'
  });

  const [recentCheckIns, setRecentCheckIns] = useState<Array<{ name: string; token: string; time: string }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!event) return null;

  const allRegistrations = eventStore.getStudentRegistrations().filter(r => r.event_id === event.event_id && r.check_in_status !== 'CANCELLED');
  const registeredCount = allRegistrations.length;
  const attendedCount = allRegistrations.filter(r => r.check_in_status === 'ATTENDED').length;
  const venueCap = event.expected_count || 100;
  const turnoutPercent = registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    const res = await eventStore.verifyAndCheckInPass(event.event_id, qrInput.trim());
    setScanResult(res);

    if (res.valid) {
      setRecentCheckIns(prev => [
        { name: res.attendee_name || 'Attendee', token: qrInput.trim().toUpperCase(), time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 5)
      ]);
      setQrInput('');
      setRefreshKey(k => k + 1);
    }
  };

  const getStatusColor = () => {
    if (scanResult.status === 'ATTENDED') return '#16a34a';
    if (scanResult.status === 'ALREADY_USED') return '#ea580c';
    if (scanResult.status === 'INVALID' || scanResult.status === 'CANCELLED') return '#dc2626';
    return '#475569';
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={styles.iconCircle}>
              <IconQrcode size={22} color="#fff" />
            </span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Live Gate Scanner & Attendance Engine
              </h2>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {event.title} · {event.venue_name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <IconX size={20} />
          </button>
        </div>

        {/* Live Headcount & Turnout Dashboard */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', margin: '14px 0 6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, textAlign: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Admitted</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{attendedCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Registered</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{registeredCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Turnout</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{turnoutPercent}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cap Limit</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#475569' }}>{venueCap}</div>
            </div>
          </div>
          {/* Visual Progress Bar */}
          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (attendedCount / Math.max(1, registeredCount)) * 100)}%`, height: '100%', background: '#16a34a', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Live Scan Input Form */}
        <form onSubmit={handleVerify} style={{ margin: '16px 0 20px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Scan or Enter Attendee Pass Token:
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              type="text" 
              placeholder="e.g. CS-PASS-9B2K4F-2940"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              style={styles.tokenInput}
              autoFocus
            />
            <button type="submit" style={styles.scanBtn}>
              Verify & Check In
            </button>
          </div>
          <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 5 }}>
            ⚡ Connects directly to barcode/QR USB scanners or manual token entry.
          </small>
        </form>

        {/* Dynamic Verification Screen */}
        <div style={{
          ...styles.resultCard,
          borderColor: getStatusColor(),
          background: scanResult.status === 'ATTENDED' ? '#f0fdf4' : scanResult.status === 'ALREADY_USED' ? '#fff7ed' : scanResult.status === 'IDLE' ? '#f8fafc' : '#fef2f2'
        }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: getStatusColor(), marginBottom: 4 }}>
            {scanResult.message}
          </div>

          {scanResult.status === 'ATTENDED' && (
            <div style={{ fontSize: 13, color: '#166534', marginTop: 6 }}>
              Attendee: <strong>{scanResult.attendee_name}</strong> · Checked in at {new Date().toLocaleTimeString()}
            </div>
          )}

          {scanResult.status === 'ALREADY_USED' && (
            <div style={{ fontSize: 12.5, color: '#c2410c', marginTop: 6, fontWeight: 600 }}>
              🛑 PASS-SHARING PREVENTED: This QR token has already been marked ATTENDED and cannot be reused.
            </div>
          )}
        </div>

        {/* Recent Confirmed Check-Ins Log */}
        {recentCheckIns.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={14} color="#16a34a" /> Verified Entrants This Session ({recentCheckIns.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
              {recentCheckIns.map((item, idx) => (
                <div key={idx} style={styles.recentItem}>
                  <div>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>{item.name}</strong>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{item.token}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
    maxWidth: 540,
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
    background: '#2563eb',
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
  tokenInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: '0.05em',
    border: '2px solid #cbd5e1',
    borderRadius: 8,
    outline: 'none',
    textTransform: 'uppercase'
  },
  scanBtn: {
    padding: '12px 18px',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer'
  },
  resultCard: {
    padding: '18px 20px',
    borderRadius: 10,
    border: '2px solid #cbd5e1',
    textAlign: 'center'
  },
  recentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: 6,
    border: '1px solid #e2e8f0'
  }
};
