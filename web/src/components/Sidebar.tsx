import React from 'react';
import { LayoutDashboard, FilePlus, ClipboardCheck, QrCode, Users, Trophy, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { user } = useAuth();
  
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={19} />, label: 'Overview & Stats' },
    { id: 'proposals', icon: <FilePlus size={19} />, label: 'Event Proposals' },
    { id: 'approvals', icon: <ClipboardCheck size={19} />, label: 'Faculty Approvals' },
    { id: 'scanner', icon: <QrCode size={19} />, label: 'Day-of-Event Scanner' },
    { id: 'recruitments', icon: <Users size={19} />, label: 'Recruitment Drives' },
    { id: 'analytics', icon: <Trophy size={19} />, label: 'Inter-College Leaderboard' },
    { id: 'reports', icon: <FileText size={19} />, label: 'Annual Renewal & NAAC' },
  ];

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-logo">CS</div>
        <div className="brand-text">
          <h2>ClubSync</h2>
          <span>Committee & Admin Portal</span>
        </div>
      </div>

      <div className="nav-menu">
        {navItems.map(item => (
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
            {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="user-info">
            <h4>{user?.user_metadata?.name || 'Administrator'}</h4>
            <p>{user?.email || 'admin@college.edu'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
