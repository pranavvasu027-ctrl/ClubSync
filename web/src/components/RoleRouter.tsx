import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRouter: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>Verifying credentials...</div>;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If profile is not loaded yet but user is authenticated, wait
  if (!profile) {
    return <div style={{ padding: 50, textAlign: 'center', fontFamily: 'sans-serif' }}>Loading profile...</div>;
  }

  // Route based on user_type
  const role = profile.user_type?.toLowerCase();

  switch (role) {
    case 'secretary':
      return <Navigate to="/secretary" replace />;
    case 'executive':
      return <Navigate to="/executive" replace />;
    case 'president':
      return <Navigate to="/president" replace />;
    case 'owner':
      return <Navigate to="/owner" replace />;
    case 'faculty':
      return <Navigate to="/faculty" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'recruiter':
      return <Navigate to="/recruiter" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    default:
      // Fallback dashboard if role is unknown
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleRouter;
