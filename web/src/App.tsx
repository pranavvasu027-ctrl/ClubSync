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
import EventBudget from './pages/executive/EventBudget';
import EventFeedback from './pages/executive/EventFeedback';
import LiveOps from './pages/executive/LiveOps';
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

// New recruitment layouts & pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseOpenings from './pages/student/BrowseOpenings';
import ApplicationForm from './pages/student/ApplicationForm';
import MyApplications from './pages/student/MyApplications';
import InterviewDetails from './pages/student/InterviewDetails';
import Notifications from './pages/student/Notifications';

import RecruiterLayout from './layouts/RecruiterLayout';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import ApplicationsView from './pages/recruiter/ApplicationsView';
import Shortlisting from './pages/recruiter/Shortlisting';
import InterviewScheduler from './pages/recruiter/InterviewScheduler';
import EvaluationForm from './pages/recruiter/EvaluationForm';
import Results from './pages/recruiter/Results';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateCycle from './pages/admin/CreateCycle';
import ManageCycles from './pages/admin/ManageCycles';
import TeamFormation from './pages/admin/TeamFormation';
import MembersDirectory from './pages/admin/MembersDirectory';
import AdminApprovalsQueue from './pages/admin/AdminApprovalsQueue';
import FinanceVerification from './pages/admin/FinanceVerification';

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
      
      <Route path="/student" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="openings" element={<BrowseOpenings />} />
        <Route path="apply/:cycleId" element={<ApplicationForm />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="interview" element={<InterviewDetails />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/recruiter" element={<ProtectedRoute><RecruiterLayout /></ProtectedRoute>}>
        <Route index element={<RecruiterDashboard />} />
        <Route path="applications" element={<ApplicationsView />} />
        <Route path="shortlisting" element={<Shortlisting />} />
        <Route path="interviews" element={<InterviewScheduler />} />
        <Route path="evaluations" element={<EvaluationForm />} />
        <Route path="results" element={<Results />} />
      </Route>
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="approvals" element={<AdminApprovalsQueue />} />
        <Route path="finance" element={<FinanceVerification />} />
        <Route path="create-cycle" element={<CreateCycle />} />
        <Route path="cycles" element={<ManageCycles />} />
        <Route path="team-formation" element={<TeamFormation />} />
        <Route path="members" element={<MembersDirectory />} />
      </Route>

      <Route path="/secretary" element={<ProtectedRoute><SecretaryLayout /></ProtectedRoute>}>
        <Route index element={<SecretaryDashboard />} />
        <Route path="editor" element={<PageEditor />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/executive" element={<ProtectedRoute><ExecutiveLayout /></ProtectedRoute>}>
        <Route index element={<FocusBoard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="live" element={<LiveOps />} />
        <Route path="budget" element={<EventBudget />} />
        <Route path="feedback" element={<EventFeedback />} />
        <Route path="team" element={<Team />} />
      </Route>
      <Route path="/president" element={<ProtectedRoute><PresidentLayout /></ProtectedRoute>}>
        <Route index element={<PresidentDashboard />} />
        <Route path="events" element={<EventsDesk />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="recruitment" element={<Recruitment />} />
        <Route path="team" element={<TeamDirectory />} />
      </Route>
      <Route path="/faculty" element={<ProtectedRoute><FacultyLayout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="approvals" element={<ApprovalsQueue />} />
        <Route path="ledger" element={<FacultyLedger />} />
        <Route path="team" element={<FacultyTeam />} />
      </Route>
      <Route path="/owner" element={<ProtectedRoute><OwnerLayout /></ProtectedRoute>}>
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
