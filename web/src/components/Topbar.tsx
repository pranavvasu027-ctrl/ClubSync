import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Topbar({ title }: { title: string }) {
  const { signOut } = useAuth();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2 className="page-title">{title}</h2>
        <select className="college-select">
          <option>VIT Pune (Vishwakarma Institute of Technology)</option>
          <option>COEP Technological University</option>
          <option>PICT Pune</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="role-toggle">
          <button className="role-btn active">President / Tech Lead</button>
          <button className="role-btn">Faculty Mentor</button>
          <button className="role-btn">College Admin</button>
        </div>
        <button className="btn btn-outline" onClick={signOut}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
}
