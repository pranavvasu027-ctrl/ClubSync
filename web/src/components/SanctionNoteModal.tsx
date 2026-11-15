import React from 'react';
import { IconX, IconCheck, IconAlertTriangle, IconFileText, IconCalendarEvent, IconMapPin, IconUsers, IconReceipt2 } from '@tabler/icons-react';

export interface SanctionNoteData {
  event_id?: string;
  ref_no?: string;
  title: string;
  club_id?: string;
  club_name: string;
  event_type: string;
  scope: string;
  event_date: string;
  event_time?: string;
  venue_name: string;
  target_audience?: string;
  expected_count: number;
  description: string;
  objectives?: string;
  expected_outcomes?: string;
  guest_details?: Array<{ name: string; designation?: string; contact?: string }>;
  resource_requirements?: string[];
  budget?: {
    income: number;
    expenditure: number;
    source_of_funds?: string;
    surplus_deficit?: number;
  };
  status: string;
  faculty_remarks?: string;
  faculty_name?: string;
  decision_timestamp?: string;
  created_at?: string;
  created_by_name?: string;
}

interface SanctionNoteModalProps {
  event: SanctionNoteData | null;
  onClose: () => void;
}

export default function SanctionNoteModal({ event, onClose }: SanctionNoteModalProps) {
  if (!event) return null;

  const refNo = event.ref_no || `VIT/CS/${new Date().getFullYear()}/${(event.event_id || '001').slice(0, 4).toUpperCase()}`;
  const income = event.budget?.income || 0;
  const expenditure = event.budget?.expenditure || 0;
  const surplus = income - expenditure;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    const s = (event.status || '').toLowerCase();
    if (s === 'approved' || s === 'published') {
      return <span style={{ ...styles.badge, background: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }}>✅ SANCTIONED / APPROVED</span>;
    }
    if (s === 'changes_requested') {
      return <span style={{ ...styles.badge, background: '#FEF3C7', color: '#92400E', borderColor: '#FCD34D' }}>⚠️ REVISION REQUIRED</span>;
    }
    if (s === 'rejected') {
      return <span style={{ ...styles.badge, background: '#FEE2E2', color: '#991B1B', borderColor: '#FCA5A5' }}>❌ REJECTED</span>;
    }
    return <span style={{ ...styles.badge, background: '#EFF6FF', color: '#1E40AF', borderColor: '#93C5FD' }}>⏳ PENDING FACULTY SANCTION</span>;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Modal Controls (Hidden in Print) */}
        <div style={styles.topActions} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconFileText size={20} color="#0B63F6" />
            <strong style={{ fontSize: 14, color: '#0F172A' }}>Official Collegiate Event Proposal Note</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint} style={styles.printBtn} title="Print or save as PDF">
              <IconFileText size={16} /> Print / Save PDF
            </button>
            <button onClick={onClose} style={styles.closeBtn} title="Close">
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* The Formal Document */}
        <div style={styles.paper} id="sanction-note-document">
          {/* Institutional Header */}
          <div style={styles.header}>
            <div style={styles.headerEmblem}>🏛️</div>
            <div style={styles.headerText}>
              <h1 style={styles.collegeName}>VISHWAKARMA INSTITUTE OF TECHNOLOGY, PUNE</h1>
              <p style={styles.collegeSub}>(An Autonomous Institute Affiliated to Savitribai Phule Pune University)</p>
              <p style={styles.dept}>STUDENT ACTIVITIES COUNCIL · OFFICE OF DEAN (STUDENT AFFAIRS)</p>
              <div style={styles.docTitle}>EVENT PROPOSAL &amp; SANCTION NOTE</div>
            </div>
          </div>

          <div style={styles.metaRow}>
            <div><strong>Ref No:</strong> <span style={{ fontFamily: 'monospace' }}>{refNo}</span></div>
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div><strong>Status:</strong> {getStatusBadge()}</div>
          </div>

          {/* Section 1: Event Summary */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>1. EVENT IDENTIFICATION &amp; SCOPE</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.thCol}>Club / Organizing Body</td>
                  <td style={styles.tdCol}><strong>{event.club_name || 'Student Chapter'}</strong></td>
                  <td style={styles.thCol}>Event Title</td>
                  <td style={styles.tdCol}><strong>{event.title}</strong></td>
                </tr>
                <tr>
                  <td style={styles.thCol}>Event Type &amp; Scope</td>
                  <td style={styles.tdCol}>{event.event_type} · {event.scope?.replace('_', '-')}</td>
                  <td style={styles.thCol}>Target Audience</td>
                  <td style={styles.tdCol}>{event.target_audience || 'All College Students'}</td>
                </tr>
                <tr>
                  <td style={styles.thCol}>Scheduled Date &amp; Time</td>
                  <td style={styles.tdCol}>{event.event_date} {event.event_time ? `(${event.event_time})` : ''}</td>
                  <td style={styles.thCol}>Proposed Venue</td>
                  <td style={styles.tdCol}>{event.venue_name || 'Sharad Arena'}</td>
                </tr>
                <tr>
                  <td style={styles.thCol}>Expected Footfall</td>
                  <td style={styles.tdCol}>{event.expected_count} participants</td>
                  <td style={styles.thCol}>Submitted By</td>
                  <td style={styles.tdCol}>{event.created_by_name || 'Club President'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Academic & Activity Abstract */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>2. ACADEMIC RELEVANCE &amp; OBJECTIVES (NAAC Criteria)</div>
            <div style={styles.textBox}>
              <p><strong>Description &amp; Abstract:</strong> {event.description || 'N/A'}</p>
              {event.objectives && (
                <p style={{ marginTop: 6 }}><strong>Learning Objectives:</strong> {event.objectives}</p>
              )}
              {event.expected_outcomes && (
                <p style={{ marginTop: 6 }}><strong>Expected Outcomes:</strong> {event.expected_outcomes}</p>
              )}
            </div>
          </div>

          {/* Section 3: Dignitaries & Resources */}
          {(event.guest_details?.length || event.resource_requirements?.length) ? (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>3. RESOURCE ALLOCATION &amp; INVITED DIGNITARIES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <strong>Resource Requirements:</strong>
                  <div style={{ marginTop: 4, color: '#334155' }}>
                    {event.resource_requirements?.length ? event.resource_requirements.join(', ') : 'Standard classroom facilities'}
                  </div>
                </div>
                <div>
                  <strong>Guest / Speaker Information:</strong>
                  <div style={{ marginTop: 4, color: '#334155' }}>
                    {event.guest_details?.filter(g => g.name)?.map((g, i) => (
                      <div key={i}>• {g.name} {g.designation ? `(${g.designation})` : ''}</div>
                    )) || 'None specified'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Section 4: Budget Note */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>4. FINANCIAL STATEMENT &amp; BUDGET NOTE</div>
            <table style={styles.table}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={styles.thCol}>Income Source / Category</th>
                  <th style={styles.thCol}>Amount (₹)</th>
                  <th style={styles.thCol}>Estimated Expenditure Heads</th>
                  <th style={styles.thCol}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tdCol}>Student Registrations / Passes</td>
                  <td style={styles.tdCol}>₹{income.toLocaleString('en-IN')}</td>
                  <td style={styles.tdCol}>Honorarium / Speaker Travel</td>
                  <td style={styles.tdCol}>₹{(expenditure * 0.35).toFixed(0)}</td>
                </tr>
                <tr>
                  <td style={styles.tdCol}>Club Budget / Sponsorships</td>
                  <td style={styles.tdCol}>{event.budget?.source_of_funds || 'Club Operating Fund'}</td>
                  <td style={styles.tdCol}>Logistics, Badges &amp; Refreshments</td>
                  <td style={styles.tdCol}>₹{(expenditure * 0.40).toFixed(0)}</td>
                </tr>
                <tr>
                  <td style={styles.tdCol}><strong>Total Projected Revenue</strong></td>
                  <td style={styles.tdCol}><strong>₹{income.toLocaleString('en-IN')}</strong></td>
                  <td style={styles.tdCol}>Prizes / Certificates &amp; Materials</td>
                  <td style={styles.tdCol}>₹{(expenditure * 0.25).toFixed(0)}</td>
                </tr>
                <tr style={{ background: '#F1F5F9', fontWeight: 'bold' }}>
                  <td style={styles.tdCol} colSpan={2}>
                    Net Financial Position: {surplus >= 0 ? `Surplus ₹${surplus.toLocaleString('en-IN')}` : `Deficit ₹${Math.abs(surplus).toLocaleString('en-IN')}`}
                  </td>
                  <td style={styles.tdCol}>Total Estimated Expenditure</td>
                  <td style={styles.tdCol}>₹{expenditure.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Faculty Advisor Review & Endorsement */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>5. FACULTY ADVISOR ENDORSEMENT &amp; APPROVAL RECORD</div>
            <div style={{ ...styles.textBox, background: '#F8FAFC', borderLeft: '4px solid #0B63F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Faculty Mentor Remarks:</strong>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {event.decision_timestamp ? new Date(event.decision_timestamp).toLocaleString('en-IN') : 'Status: Under Evaluation'}
                </span>
              </div>
              <p style={{ marginTop: 6, fontStyle: event.faculty_remarks ? 'normal' : 'italic', color: '#1E293B' }}>
                {event.faculty_remarks || 'The proposal has been reviewed. Budget and venue allocation subject to campus compliance.'}
              </p>
            </div>
          </div>

          {/* Signature Blocks */}
          <div style={styles.signatureRow}>
            <div style={styles.sigBox}>
              <div style={styles.sigLine} />
              <strong>{event.created_by_name || 'Club President'}</strong>
              <small style={{ color: '#64748B' }}>Student Head / President</small>
            </div>
            <div style={styles.sigBox}>
              <div style={styles.sigLine} />
              <strong>{event.faculty_name || 'Dr. Faculty Mentor'}</strong>
              <small style={{ color: '#64748B' }}>Faculty Advisor / Supervisor</small>
            </div>
            <div style={styles.sigBox}>
              <div style={styles.sigLine} />
              <strong>Dean (Student Affairs)</strong>
              <small style={{ color: '#64748B' }}>Central SAC Approval</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 860,
    width: '100%',
    maxHeight: '94vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
  },
  topActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    backgroundColor: '#0B63F6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 6,
    display: 'flex',
  },
  paper: {
    padding: '36px 40px',
    fontFamily: '"Times New Roman", Times, serif',
    color: '#000',
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    borderBottom: '2px solid #000',
    paddingBottom: 14,
    marginBottom: 16,
  },
  headerEmblem: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerText: {},
  collegeName: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.04em',
  },
  collegeSub: {
    fontSize: 11,
    margin: '2px 0',
  },
  dept: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    margin: '4px 0 8px',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
    letterSpacing: '0.08em',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    marginBottom: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid',
    letterSpacing: '0.04em',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F1F5F9',
    padding: '4px 8px',
    marginBottom: 8,
    borderLeft: '3px solid #000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 11.5,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  thCol: {
    border: '1px solid #CBD5E1',
    padding: '6px 8px',
    backgroundColor: '#F8FAFC',
    fontWeight: 600,
    color: '#334155',
  },
  tdCol: {
    border: '1px solid #CBD5E1',
    padding: '6px 8px',
    color: '#0F172A',
  },
  textBox: {
    border: '1px solid #E2E8F0',
    padding: '8px 12px',
    borderRadius: 4,
    fontSize: 11.5,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  signatureRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    marginTop: 36,
    paddingTop: 20,
    textAlign: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sigBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 11.5,
  },
  sigLine: {
    width: '75%',
    borderBottom: '1px solid #000',
    marginBottom: 8,
  }
};
