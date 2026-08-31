import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SecretaryLayout from './layouts/SecretaryLayout';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import PageEditor from './pages/secretary/PageEditor';
import ContentCalendar from './pages/secretary/ContentCalendar';
import MediaLibrary from './pages/secretary/MediaLibrary';
import Reports from './pages/secretary/Reports';
import RoleRouter from './components/RoleRouter';
import ExecutiveLayout from './layouts/ExecutiveLayout';
import FocusBoard from './pages/executive/FocusBoard';
import Announcements from './pages/executive/Announcements';
import TaskBoard from './pages/executive/TaskBoard';
import MyEvents from './pages/executive/MyEvents';
import Team from './pages/executive/Team';
import PresidentLayout from './layouts/PresidentLayout';
import PresidentDashboard from './pages/president/PresidentDashboard';
import EventsDesk from './pages/president/EventsDesk';
import Ledger from './pages/president/Ledger';
import Recruitment from './pages/president/Recruitment';
import TeamDirectory from './pages/president/TeamDirectory';
import FacultyLayout from './layouts/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ApprovalsQueue from './pages/faculty/ApprovalsQueue';
import FacultyLedger from './pages/faculty/FacultyLedger';
import FacultyTeam from './pages/faculty/FacultyTeam';
import OwnerLayout from './layouts/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Colleges from './pages/owner/Colleges';
import Moderation from './pages/owner/Moderation';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <RoleRouter />
        } 
      />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/secretary" element={<SecretaryLayout />}>
        <Route index element={<SecretaryDashboard />} />
        <Route path="editor" element={<PageEditor />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/executive" element={<ExecutiveLayout />}>
        <Route index element={<FocusBoard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="team" element={<Team />} />
      </Route>
      <Route path="/president" element={<PresidentLayout />}>
        <Route index element={<PresidentDashboard />} />
        <Route path="events" element={<EventsDesk />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="team" element={<TeamDirectory />} />
      </Route>
      <Route path="/faculty" element={<FacultyLayout />}>
        <Route index element={<FacultyDashboard />} />
        <Route path="approvals" element={<ApprovalsQueue />} />
        <Route path="ledger" element={<FacultyLedger />} />
        <Route path="team" element={<FacultyTeam />} />
      </Route>
      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<OwnerDashboard />} />
        <Route path="colleges" element={<Colleges />} />
        <Route path="moderation" element={<Moderation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
