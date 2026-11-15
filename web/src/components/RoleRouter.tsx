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

  // Route strictly to the 3 approved dashboards: President, Faculty, Student
  const role = (profile.user_type || '').toLowerCase();

  if (role.includes('president') || role.includes('lead')) {
    return <Navigate to="/president" replace />;
  }
  if (role.includes('faculty') || role.includes('mentor') || role.includes('owner') || role.includes('dean') || role.includes('admin')) {
    return <Navigate to="/faculty" replace />;
  }
  return <Navigate to="/student" replace />;
};

export default RoleRouter;
