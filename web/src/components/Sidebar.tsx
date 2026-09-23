import React from 'react';
import { LayoutDashboard, FilePlus, ClipboardCheck, QrCode, Users, Trophy, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { user, profile } = useAuth();
  const role = profile?.user_type || 'CLUB_LEAD'; // Default for UI purposes if missing
  
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Overview & Stats', roles: ['CLUB_LEAD', 'FACULTY_MENTOR', 'DEAN_ADMIN', 'STUDENT'] },
    { id: 'proposals', icon: <FilePlus size={19} />, label: 'Event Proposals', roles: ['CLUB_LEAD', 'DEAN_ADMIN'] },
    { id: 'approvals', icon: <ClipboardCheck size={19} />, label: 'Faculty Approvals', roles: ['FACULTY_MENTOR', 'DEAN_ADMIN'] },
    { id: 'scanner', icon: <QrCode size={19} />, label: 'Day-of-Event Scanner', roles: ['CLUB_LEAD', 'STUDENT', 'DEAN_ADMIN'] },
    { id: 'recruitments', icon: <Users size={19} />, label: 'Recruitment CRM', roles: ['CLUB_LEAD', 'DEAN_ADMIN'] },
    { id: 'analytics', icon: <Trophy size={19} />, label: 'Inter-College Leaderboard', roles: ['CLUB_LEAD', 'FACULTY_MENTOR', 'DEAN_ADMIN'] },
    { id: 'reports', icon: <FileText size={19} />, label: 'Annual Renewal & NAAC', roles: ['CLUB_LEAD', 'DEAN_ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="sidebar">
      <div className="brand">
        <img src="/clubsync-logo.jpg" alt="ClubSync" className="brand-logo" />
        <div className="brand-text">
          <h2>ClubSync</h2>
          <span>Committee & Admin Portal</span>
        </div>
      </div>

      <div className="nav-menu">
        {visibleNavItems.map(item => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon} {item.label}
          </div>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="user-badge">
          <div className="user-avatar">
            {profile?.name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="user-info">
            <h4>{profile?.name || user?.user_metadata?.name || 'Administrator'}</h4>
            <p style={{ fontSize: 11, color: 'var(--primary)' }}>{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
