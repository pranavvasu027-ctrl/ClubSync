import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Proposals from '../components/Proposals';
import Approvals from '../components/Approvals';
import Recruitments from '../components/Recruitments';
import Analytics from '../components/Analytics';
import { Users, Ticket, CheckCircle, FileWarning } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Executive Dashboard & Overview';
      case 'proposals': return 'Event Proposals & Permissions';
      case 'approvals': return 'Faculty & Administrative Approvals';
      case 'scanner': return 'Day-of-Event Attendance Scanner';
      case 'recruitments': return 'Core Team Recruitment Evaluator';
      case 'analytics': return 'Inter-Collegiate Winner Dominance & Conclusions';
      case 'reports': return 'Annual Renewal Form & NAAC Accreditation';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main">
        <Topbar title={getTitle()} />
        <div className="content">
          
          {activeTab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Total Student Reach</span>
                    <div className="stat-icon" style={{ background: '#E6F1FB', color: '#185FA5' }}><Users size={18} /></div>
                  </div>
                  <div className="stat-value">12,450</div>
                  <div className="stat-sub"><span className="stat-green">↑ 14%</span> vs last semester</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Active Registrations</span>
                    <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Ticket size={18} /></div>
                  </div>
                  <div className="stat-value">3,120</div>
                  <div className="stat-sub">Across 8 upcoming events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Proposals Approved</span>
                    <div className="stat-icon" style={{ background: '#EAF3DE', color: '#16A34A' }}><CheckCircle size={18} /></div>
                  </div>
                  <div className="stat-value">14</div>
                  <div className="stat-sub">2 pending faculty review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Deficit / Warnings</span>
                    <div className="stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}><FileWarning size={18} /></div>
                  </div>
                  <div className="stat-value">0</div>
                  <div className="stat-sub">All club accounts in good standing</div>
                </div>
              </div>

              <div className="grid-2col">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Recent Event Proposals</h3>
                    <button className="btn btn-primary" onClick={() => setActiveTab('proposals')}>+ New Proposal</button>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Event Title</th>
                          <th>Club</th>
                          <th>Venue</th>
                          <th>Status</th>
                          <th>Budget Req.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Pune TechFest Hackathon</strong></td>
                          <td>GedIT Technical Club</td>
                          <td>Main Auditorium</td>
                          <td><span className="badge badge-approved">Approved (Live)</span></td>
                          <td>₹1,00,000</td>
                        </tr>
                        <tr>
                          <td><strong>Campus Bazaar 2026</strong></td>
                          <td>EDC</td>
                          <td>Open Ground</td>
                          <td><span className="badge badge-pending">Faculty Review</span></td>
                          <td>₹50,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Pending Approvals</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 13, display: 'block', marginBottom: 2 }}>Campus Bazaar 2026 Budget</strong>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Requested by EDC President</span>
                      </div>
                      <button className="btn btn-outline" onClick={() => setActiveTab('approvals')}>Review</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'proposals' && <Proposals />}
          {activeTab === 'approvals' && <Approvals />}
          {activeTab === 'recruitments' && <Recruitments />}
          {activeTab === 'analytics' && <Analytics />}

          {activeTab !== 'dashboard' && activeTab !== 'proposals' && activeTab !== 'approvals' && activeTab !== 'recruitments' && activeTab !== 'analytics' && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
              <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h2>{getTitle()}</h2>
              <p>This module is currently connected to Supabase and awaiting React implementation.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
