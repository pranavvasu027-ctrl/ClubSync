import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import RoleRouter from './components/RoleRouter';

// 👑 President Module
import PresidentLayout from './layouts/PresidentLayout';
import PresidentDashboard from './pages/president/PresidentDashboard';
import EventsDesk from './pages/president/EventsDesk';
import NewEventProposal from './pages/president/NewEventProposal';
import Ledger from './pages/president/Ledger';
import Recruitment from './pages/president/Recruitment';
import TeamDirectory from './pages/president/TeamDirectory';

// 🎓 Faculty Module
import FacultyLayout from './layouts/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ApprovalsQueue from './pages/faculty/ApprovalsQueue';
import FacultyLedger from './pages/faculty/FacultyLedger';

// 🎒 Student Module (High-fidelity Laptop Experience)
import StudentPortal from './pages/student/StudentPortal';

import './index.css';
import DemoRoleDock from './components/DemoRoleDock';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>Verifying session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, profile, club, loading, hasClubRole } = useAuth();
  
  if (loading) return <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>Verifying session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  const normType = (profile?.user_type || '').toLowerCase();
  if (['owner', 'super_admin', 'platform_admin', 'admin', 'dean_admin'].some(r => normType.includes(r))) return <>{children}</>;
  
  if (club && hasClubRole(club.club_id, allowedRoles)) {
    return <>{children}</>;
  }

  const allowedNorm = allowedRoles.map(r => r.toLowerCase());
  if (
    allowedNorm.includes(normType) ||
    (allowedNorm.includes('faculty') && (normType.includes('faculty') || normType.includes('mentor'))) ||
    (allowedNorm.includes('president') && (normType.includes('president') || normType.includes('lead'))) ||
    (allowedNorm.includes('student') && normType.includes('student'))
  ) {
    return <>{children}</>;
  }
  
  return <Navigate to="/student" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRouter />} />
      
      {/* 🎒 Student Portal (Laptop UI) */}
      <Route path="/student" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />
      <Route path="/student/*" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />

      {/* 👑 President Module */}
      <Route path="/president" element={<RoleProtectedRoute allowedRoles={['President']}><PresidentLayout /></RoleProtectedRoute>}>
        <Route index element={<PresidentDashboard />} />
        <Route path="events" element={<EventsDesk />} />
        <Route path="events/new" element={<NewEventProposal />} />
        <Route path="new-event" element={<NewEventProposal />} />
        <Route path="ledger" element={<Navigate to="/president" replace />} />
        <Route path="recruitment" element={<Navigate to="/president" replace />} />
        <Route path="team" element={<Navigate to="/president" replace />} />
      </Route>

      {/* 🎓 Faculty Module */}
      <Route path="/faculty" element={<RoleProtectedRoute allowedRoles={['Faculty']}><FacultyLayout /></RoleProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="approvals" element={<ApprovalsQueue />} />
        <Route path="ledger" element={<FacultyLedger />} />
        <Route path="team" element={<Navigate to="/faculty/approvals" replace />} />
      </Route>

      {/* Fallback for legacy owner route */}
      <Route path="/owner/*" element={<Navigate to="/faculty" replace />} />
      <Route path="/owner" element={<Navigate to="/faculty" replace />} />

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <DemoRoleDock />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
