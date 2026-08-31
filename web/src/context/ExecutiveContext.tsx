import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExecData, initialExecData } from '../lib/executiveData';
import { supabase } from '../lib/supabase';

interface ExecContextType {
  execData: ExecData;
  setExecData: React.Dispatch<React.SetStateAction<ExecData>>;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
}

const ExecContext = createContext<ExecContextType | undefined>(undefined);

export const ExecProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [execData, setExecData] = useState<ExecData>(initialExecData);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Tasks
      const { data: tasks } = await supabase.from('club_tasks').select('*');
      
      // 2. Fetch Announcements
      const { data: announcements } = await supabase.from('club_announcements').select('*');

      // 3. Fetch Events
      const { data: events } = await supabase.from('club_events').select('*');

      setExecData(prev => {
        const newData = { ...prev };
        
        if (tasks) {
          newData.tasks = tasks.map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Unknown',
            assignee: t.assignee_initials || 'UN',
            priority: t.priority as any,
            status: t.status as any
          }));
        }

        if (announcements) {
          newData.announcements = announcements.map(a => ({
            id: a.id,
            title: a.title,
            audience: a.audience,
            sentDate: new Date(a.sent_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            delivered: a.delivered,
            read: a.read_count,
            openRate: a.open_rate
          }));
        }

        if (events) {
          newData.events = events.map(e => ({
            id: e.id,
            title: e.title,
            date: new Date(e.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            location: e.location,
            registrations: e.expected_users || 0,
            capacity: 200, // mock capacity
            role: 'Lead',
            countdown: 'Live',
            colors: ['var(--exec-sky)', 'var(--exec-lime)'] // default colors
          }));
        }

        return newData;
      });
    };
    
    fetchData();
  }, []);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic UI Update
    setExecData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t)
    }));

    // Update in Supabase (if it's a UUID, meaning it came from the DB)
    if (taskId.includes('-')) {
      await supabase.from('club_tasks').update({ status: newStatus }).eq('id', taskId);
    }
  };

  return (
    <ExecContext.Provider value={{ execData, setExecData, updateTaskStatus }}>
      {children}
    </ExecContext.Provider>
  );
};

export const useExec = () => {
  const context = useContext(ExecContext);
  if (context === undefined) {
    throw new Error('useExec must be used within an ExecProvider');
  }
  return context;
};
