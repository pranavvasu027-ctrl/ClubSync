import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DemoRoleDock() {
  const { user, profile, loginAsDemoRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Don't show dock on login page or if no user is logged in
  if (!user || location.pathname === '/login') return null;

  const currentRole = profile?.user_type?.toLowerCase() || '';

  const handleSwitch = (roleKey: string) => {
    loginAsDemoRole(roleKey);
    navigate(`/${roleKey}`);
  };

  if (collapsed) {
    return (
      <button 
        onClick={() => setCollapsed(false)}
        style={styles.expandBtn}
        title="Open Role Dock"
      >
        ⚡ Switch Role ({profile?.user_type || 'User'})
      </button>
    );
  }

  return (
    <div style={styles.dock}>
      <div style={styles.dockInner}>
        <span style={styles.dockLabel}>ClubSync Roles:</span>

        <button 
          onClick={() => handleSwitch('president')}
          style={currentRole === 'president' ? styles.activeRoleBtn : styles.roleBtn}
          title="Events Desk, Proposal Notes & Publishing"
        >
          👑 President
        </button>

        <button 
          onClick={() => handleSwitch('faculty')}
          style={currentRole === 'faculty' ? styles.activeRoleBtn : styles.roleBtn}
          title="Sanction Reviews & Approvals Queue"
        >
          🎓 Faculty
        </button>

        <button 
          onClick={() => handleSwitch('student')}
          style={currentRole === 'student' ? styles.activeRoleBtn : styles.roleBtn}
          title="Discover Events, Register & QR Entry Passes"
        >
          🎒 Student
        </button>

        <div style={styles.separator} />

        <button 
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          style={styles.logoutBtn}
          title="Sign out of current account"
        >
          Logout
        </button>

        <button 
          onClick={() => setCollapsed(true)}
          style={styles.collapseBtn}
          title="Minimize Dock"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dock: {
    position: 'fixed',
    bottom: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 99999,
    pointerEvents: 'auto',
  },
  dockInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    padding: '3px 10px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    paddingRight: 2,
  },
  roleBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    padding: '3px 10px',
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activeRoleBtn: {
    background: '#3b82f6',
    border: '1px solid #60a5fa',
    borderRadius: 999,
    padding: '3px 10px',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  },
  separator: {
    width: 1,
    height: 14,
    background: 'rgba(255, 255, 255, 0.2)',
    margin: '0 2px',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#f87171',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 6px',
  },
  collapseBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '50%',
    color: '#94a3b8',
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    cursor: 'pointer',
  },
  expandBtn: {
    position: 'fixed',
    bottom: 10,
    right: 16,
    zIndex: 99999,
    background: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    padding: '5px 12px',
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
};
