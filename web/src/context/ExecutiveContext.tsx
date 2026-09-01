import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { initialExecData } from '../lib/executiveData';
import type { ExecData } from '../lib/executiveData';
import { supabase } from '../lib/supabase';

interface ExecContextType {
  execData: ExecData;
  setExecData: React.Dispatch<React.SetStateAction<ExecData>>;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
  createTask: (title: string, priority: string, assignee: string, dueDate: string, eventId: string) => Promise<void>;
}

const ExecContext = createContext<ExecContextType | undefined>(undefined);

export const ExecProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [execData, setExecData] = useState<ExecData>(initialExecData);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Tasks (from event_tasks)
      const { data: tasks } = await supabase.from('event_tasks').select(`
        *,
        assigned_to_user:users!event_tasks_assigned_to_fkey(name)
      `);
      
      // 2. Fetch Announcements (mock for now, or notifications)
      const { data: announcements } = await supabase.from('notifications').select('*').eq('type', 'notice');

      // 3. Fetch Events
      const { data: events } = await supabase.from('events').select('*');

      setExecData(prev => {
        const newData = { ...prev };
        
        if (tasks) {
          newData.tasks = tasks.map(t => {
            // Map priorities
            let p = 'mid';
            if (t.priority === 'LOW') p = 'low';
            if (t.priority === 'HIGH' || t.priority === 'CRITICAL') p = 'high';
            
            // Map statuses
            let s = 'backlog';
            if (t.status === 'NOT_STARTED') s = 'todo';
            if (t.status === 'IN_PROGRESS') s = 'in-progress';
            if (t.status === 'COMPLETED') s = 'done';

            // Get initials
            const name = t.assigned_to_user?.name || 'UN';
            const initials = name.substring(0, 2).toUpperCase();

            return {
              id: t.task_id,
              title: t.title,
              dueDate: t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date',
              assignee: initials,
              priority: p as any,
              status: s as any
            };
          });
        }

        if (announcements) {
          newData.announcements = announcements.map(a => ({
            id: a.notification_id,
            title: a.title,
            audience: 'All Students',
            sentDate: new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            delivered: '100%',
            read: '0%',
            openRate: '0%'
          }));
        }

        if (events) {
          newData.events = events.map(e => ({
            id: e.event_id,
            title: e.title,
            date: e.start_time ? new Date(e.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : e.event_date,
            location: e.venue_name || 'TBA',
            registrations: e.registered_count || 0,
            capacity: e.expected_count || 100,
            role: 'Lead',
            countdown: e.status === 'live' ? 'Live' : 'Upcoming',
            colors: ['var(--exec-sky)', 'var(--exec-lime)']
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

    // Map frontend status back to DB status
    let dbStatus = 'NOT_STARTED';
    if (newStatus === 'in-progress') dbStatus = 'IN_PROGRESS';
    if (newStatus === 'review') dbStatus = 'IN_PROGRESS'; // Custom column
    if (newStatus === 'done') dbStatus = 'COMPLETED';

    await supabase.from('event_tasks').update({ status: dbStatus }).eq('task_id', taskId);
  };

  const createTask = async (title: string, priority: string, assignee: string, dueDate: string, eventId: string) => {
    // Map frontend priority back to DB
    let dbPriority = 'MEDIUM';
    if (priority === 'low') dbPriority = 'LOW';
    if (priority === 'high') dbPriority = 'HIGH';

    const newTask = {
      event_id: eventId,
      title,
      priority: dbPriority,
      status: 'NOT_STARTED',
      deadline: dueDate ? new Date(dueDate).toISOString() : null
    };

    const { data, error } = await supabase.from('event_tasks').insert([newTask]).select().single();
    
    if (data && !error) {
      setExecData(prev => ({
        ...prev,
        tasks: [...prev.tasks, {
          id: data.task_id,
          title: data.title,
          dueDate: data.deadline ? new Date(data.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date',
          assignee: assignee,
          priority: priority as any,
          status: 'todo' as any
        }]
      }));
    }
  };

  return (
    <ExecContext.Provider value={{ execData, setExecData, updateTaskStatus, createTask }}>
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
